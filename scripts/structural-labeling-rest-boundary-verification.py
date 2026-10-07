#!/usr/bin/env python3
import json
import os
import secrets
import urllib.error
import urllib.request
import uuid
from pathlib import Path


def req(method, url, headers=None, data=None):
    body = None if data is None else json.dumps(data).encode()
    h = dict(headers or {})
    if data is not None:
        h.setdefault("Content-Type", "application/json")
    r = urllib.request.Request(url, data=body, headers=h, method=method)
    try:
        with urllib.request.urlopen(r, timeout=30) as x:
            return x.status, x.read().decode(errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode(errors="replace")


def need(name):
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing environment variable: {name}")
    return value


def find_keys(items):
    publishable = secret = anon = service = None
    for item in items:
        if not isinstance(item, dict):
            continue
        value = item.get("api_key") or item.get("key")
        if not value:
            continue
        kind = str(item.get("type", "")).lower()
        name = str(item.get("name", "")).lower()
        if kind == "publishable":
            publishable = publishable or value
        elif kind == "secret":
            secret = secret or value
        elif name == "anon":
            anon = anon or value
        elif name == "service_role":
            service = service or value
    public_key, admin_key = publishable or anon, secret or service
    if not public_key or not admin_key:
        raise RuntimeError("Required publishable/anon or secret/service_role API key is unavailable.")
    return public_key, admin_key


def reject(results, name, result, statuses=None, fragment=None):
    status, body = result
    ok = not 200 <= status < 300
    if statuses:
        ok = ok and status in statuses
    if fragment:
        ok = ok and fragment in body
    results.append({
        "test": name,
        "result": "PASS" if ok else "FAIL",
        "status": status,
        "required_fragment": fragment,
        "response_excerpt": body[:500],
    })
    if not ok:
        raise RuntimeError(f"{name}: status={status}, body={body[:700]}")


def main():
    token = need("SUPABASE_ACCESS_TOKEN")
    ref = need("SUPABASE_PROJECT_REF")
    run_id = os.environ.get("GITHUB_RUN_ID", "local")
    attempt = os.environ.get("GITHUB_RUN_ATTEMPT", "1")
    base = f"https://{ref}.supabase.co"
    results = []
    user_id = None

    status, body = req(
        "GET",
        f"https://api.supabase.com/v1/projects/{ref}/api-keys?reveal=true",
        {"Authorization": f"Bearer {token}"},
    )
    if status != 200:
        raise RuntimeError(f"Management API key retrieval failed: {status} {body[:700]}")
    items = json.loads(body)
    if isinstance(items, dict):
        items = items.get("keys") or items.get("data") or []
    public_key, admin_key = find_keys(items)

    email = f"structural-labeling-gate-{run_id}-{attempt}-{uuid.uuid4().hex[:8]}@example.invalid"
    password = "Aa1!" + secrets.token_urlsafe(24)
    admin_headers = {
        "apikey": admin_key,
        "Content-Type": "application/json",
        "User-Agent": "linkoteq-structural-labeling-gate/1.0",
    }

    try:
        status, body = req(
            "POST",
            f"{base}/auth/v1/admin/users",
            admin_headers,
            {
                "email": email,
                "password": password,
                "email_confirm": True,
                "app_metadata": {"role": "employee", "gate": "structural-labeling"},
            },
        )
        if status not in (200, 201):
            raise RuntimeError(f"Disposable auth user creation failed: {status} {body[:700]}")
        user_id = json.loads(body)["id"]

        status, body = req(
            "POST",
            f"{base}/auth/v1/token?grant_type=password",
            {"apikey": public_key, "Content-Type": "application/json"},
            {"email": email, "password": password},
        )
        if status != 200:
            raise RuntimeError(f"Disposable auth sign-in failed: {status} {body[:700]}")
        jwt = json.loads(body)["access_token"]

        public_headers = {
            "apikey": public_key,
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }
        auth_headers = {**public_headers, "Authorization": f"Bearer {jwt}"}
        candidate = str(uuid.uuid4())
        direct = {
            "project_group_id": f"runtime-rest-gate-{run_id}",
            "source_kind": "website-upload",
            "source_ref": "runtime-rest-gate",
            "source_sha256": "a" * 64,
        }

        reject(
            results,
            "unauthenticated_direct_candidate_insert",
            req("POST", f"{base}/rest/v1/structural_labeling_candidates", public_headers, direct),
            {401, 403},
        )
        reject(
            results,
            "authenticated_no_permission_direct_candidate_insert",
            req("POST", f"{base}/rest/v1/structural_labeling_candidates", auth_headers, direct),
            {401, 403},
        )
        reject(
            results,
            "authenticated_no_permission_create_candidate_rpc",
            req(
                "POST",
                f"{base}/rest/v1/rpc/labeling_create_candidate",
                auth_headers,
                {
                    "p_hash": "b" * 64,
                    "p_filename": "runtime-rest-gate.pdf",
                    "p_mime": "application/pdf",
                    "p_bytes": 128,
                    "p_storage": f"runtime-rest-gate/{uuid.uuid4()}.pdf",
                    "p_origin_kind": "website-upload",
                    "p_origin_ref": "runtime-rest-gate",
                    "p_project_group": f"runtime-rest-gate-{run_id}",
                    "p_page_id": "page-1",
                    "p_page_index": 0,
                    "p_transform": {},
                    "p_provenance": {"runtime_rest_gate": True},
                    "p_historical": {},
                },
            ),
            fragment="permission_denied:labeling.upload",
        )
        reject(
            results,
            "employee_no_owner_review_permission",
            req(
                "POST",
                f"{base}/rest/v1/rpc/labeling_owner_transition",
                auth_headers,
                {"p_candidate_id": candidate, "p_action": "approve", "p_reason": None},
            ),
            fragment="permission_denied:labeling.owner_review",
        )
        reject(
            results,
            "employee_no_gpt7_export_permission",
            req(
                "POST",
                f"{base}/rest/v1/rpc/labeling_assert_exportable",
                auth_headers,
                {"p_candidate_id": candidate},
            ),
            fragment="permission_denied:labeling.gpt7_export",
        )
        reject(
            results,
            "authenticated_direct_revision_insert",
            req(
                "POST",
                f"{base}/rest/v1/structural_labeling_annotation_revisions",
                auth_headers,
                {"candidate_id": candidate, "revision_no": 99, "created_by": user_id},
            ),
            {401, 403},
        )
        reject(
            results,
            "authenticated_direct_audit_update",
            req(
                "PATCH",
                f"{base}/rest/v1/structural_labeling_audit_events?candidate_id=eq.{candidate}",
                auth_headers,
                {"notes": "must-not-write"},
            ),
            {401, 403},
        )
        reject(
            results,
            "authenticated_direct_audit_delete",
            req(
                "DELETE",
                f"{base}/rest/v1/structural_labeling_audit_events?candidate_id=eq.{candidate}",
                auth_headers,
            ),
            {401, 403},
        )
    finally:
        cleanup_ok = True
        cleanup_err = None
        if user_id:
            status, body = req("DELETE", f"{base}/auth/v1/admin/users/{user_id}", admin_headers)
            cleanup_ok = status in (200, 204)
            if not cleanup_ok:
                cleanup_err = f"{status} {body[:500]}"

        Path("runtime-rest-boundary-evidence.json").write_text(
            json.dumps(
                {
                    "gate": "structural-labeling-production-rest-boundary",
                    "run_id": run_id,
                    "run_attempt": attempt,
                    "enablesTraining": False,
                    "historical_apply": False,
                    "yolo_training": False,
                    "tests": results,
                    "disposable_auth_user_deleted": cleanup_ok,
                    "cleanup_error": cleanup_err,
                    "labeling_records_created": False,
                },
                indent=2,
                sort_keys=True,
            )
        )
        if not cleanup_ok:
            raise RuntimeError(f"Disposable auth cleanup failed: {cleanup_err}")

    print("All production REST authorization boundary checks passed.")
    print("Disposable auth identity was deleted.")
    print("No Structural Labeling source, candidate, revision, or audit row was created.")


if __name__ == "__main__":
    main()

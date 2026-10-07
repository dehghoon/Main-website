#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

APPROVED_FILES = {
    "20261004000100": "20261004000100_structural_labeling_foundation.sql",
    "20261004000200": "20261004000200_structural_labeling_milestone2_authorization.sql",
    "20261004000300": "20261004000300_structural_labeling_milestone2_rpc_core.sql",
    "20261004000400": "20261004000400_structural_labeling_milestone2_rpc_review.sql",
    "20261004000500": "20261004000500_structural_labeling_milestone2_security_finalize.sql",
    "20261004000600": "20261004000600_structural_labeling_milestone2_source_read.sql",
    "20261004000700": "20261004000700_structural_labeling_milestone2_upload_batch.sql",
    "20261006000100": "20261006000100_structural_labeling_direct_mutation_lockdown.sql",
}


def load_local_versions(migrations_dir: Path) -> set[str]:
    versions: set[str] = set()
    for path in migrations_dir.glob("*.sql"):
        version = path.name.split("_", 1)[0]
        if len(version) == 14 and version.isdigit():
            if version in versions:
                raise SystemExit(f"Duplicate local migration version detected: {version}")
            versions.add(version)
    return versions


def validate_approved_files(migrations_dir: Path) -> None:
    expected_names = set(APPROVED_FILES.values())
    actual_names = {
        path.name for path in migrations_dir.glob("*structural_labeling*.sql")
    }
    if actual_names != expected_names:
        missing = sorted(expected_names - actual_names)
        unexpected = sorted(actual_names - expected_names)
        raise SystemExit(
            "Structural Labeling migration identity mismatch: "
            f"missing={missing}, unexpected={unexpected}"
        )


def load_remote_versions(remote_file: Path) -> set[str]:
    versions = {
        line.strip()
        for line in remote_file.read_text(encoding="utf-8").splitlines()
        if line.strip()
    }
    invalid = sorted(
        version
        for version in versions
        if len(version) != 14 or not version.isdigit()
    )
    if invalid:
        raise SystemExit(
            f"Invalid remote migration versions detected: {invalid}"
        )
    return versions


def verify_pending(
    local_versions: set[str],
    remote_versions: set[str],
) -> None:
    approved = set(APPROVED_FILES)
    pending = local_versions - remote_versions
    unexpected = sorted(pending - approved)
    missing = sorted(approved - pending)

    print("Pending local-only migration versions:")
    for version in sorted(pending):
        print(version)

    if unexpected:
        raise SystemExit(
            f"Unapproved pending migrations detected: {unexpected}"
        )
    if missing:
        raise SystemExit(
            "Approved Structural Labeling migrations missing from pending set: "
            f"{missing}"
        )

    print(
        "Pending migration set exactly matches the approved "
        "Structural Labeling allowlist."
    )


def verify_applied(
    local_versions: set[str],
    remote_versions: set[str],
    before_remote_versions: set[str] | None,
) -> None:
    approved = set(APPROVED_FILES)
    remaining = local_versions - remote_versions
    missing_remote = sorted(approved - remote_versions)

    print("Remaining local-only migration versions after apply:")
    for version in sorted(remaining):
        print(version)

    if remaining:
        raise SystemExit(
            "Local migrations remain unapplied after controlled apply: "
            f"{sorted(remaining)}"
        )
    if missing_remote:
        raise SystemExit(
            "Approved Structural Labeling migrations are not present in remote "
            f"history after apply: {missing_remote}"
        )

    if before_remote_versions is not None:
        remote_delta = remote_versions - before_remote_versions
        removed_remote = before_remote_versions - remote_versions
        unexpected_delta = sorted(remote_delta - approved)
        missing_delta = sorted(approved - remote_delta)

        print("Remote migration-history delta:")
        for version in sorted(remote_delta):
            print(version)

        if removed_remote:
            raise SystemExit(
                "Remote migration history lost versions during controlled apply: "
                f"{sorted(removed_remote)}"
            )
        if unexpected_delta:
            raise SystemExit(
                "Unexpected migration versions appeared during controlled apply: "
                f"{unexpected_delta}"
            )
        if missing_delta:
            raise SystemExit(
                "Approved Structural Labeling migrations missing from remote "
                f"history delta: {missing_delta}"
            )

    print(
        "All local migrations are represented in remote history and all approved "
        "Structural Labeling migrations are applied."
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Verify the controlled Structural Labeling Supabase migration set."
        )
    )
    parser.add_argument(
        "--migrations-dir",
        default="supabase/migrations",
        type=Path,
    )
    parser.add_argument(
        "--remote-file",
        required=True,
        type=Path,
    )
    parser.add_argument(
        "--before-remote-file",
        type=Path,
    )
    parser.add_argument(
        "--expect",
        choices=("pending", "applied"),
        default="pending",
    )
    args = parser.parse_args()

    if args.expect == "pending" and args.before_remote_file is not None:
        raise SystemExit(
            "--before-remote-file is only valid with --expect applied."
        )

    validate_approved_files(args.migrations_dir)
    local_versions = load_local_versions(args.migrations_dir)
    remote_versions = load_remote_versions(args.remote_file)
    before_remote_versions = (
        load_remote_versions(args.before_remote_file)
        if args.before_remote_file is not None
        else None
    )

    if args.expect == "pending":
        verify_pending(local_versions, remote_versions)
    else:
        verify_applied(
            local_versions,
            remote_versions,
            before_remote_versions,
        )


if __name__ == "__main__":
    main()

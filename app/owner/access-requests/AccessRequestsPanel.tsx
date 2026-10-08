"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabase } from "../../../lib/supabase-browser";

type CatalogPermission = {
  permission: string;
  area: string;
  label: string;
  description: string | null;
};

type AccessRequest = {
  request_id: string;
  user_id: string;
  employee_email: string;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  reviewed_at: string | null;
  review_note: string | null;
  permissions: string[];
};

async function accessToken() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error("Sign in as the owner to review access requests");
  return token;
}

export default function AccessRequestsPanel() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [catalog, setCatalog] = useState<CatalogPermission[]>([]);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      setMessage("");
      const token = await accessToken();
      const response = await fetch("/api/access-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Request failed");
      setRequests(payload.requests ?? []);
      setCatalog(payload.catalog ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const catalogByArea = useMemo(() => {
    const grouped = new Map<string, CatalogPermission[]>();
    for (const permission of catalog) {
      const items = grouped.get(permission.area) ?? [];
      items.push(permission);
      grouped.set(permission.area, items);
    }
    return Array.from(grouped.entries());
  }, [catalog]);

  function toggle(requestId: string, permission: string) {
    setSelected((current) => {
      const values = new Set(current[requestId] ?? []);
      if (values.has(permission)) values.delete(permission);
      else values.add(permission);
      return { ...current, [requestId]: Array.from(values) };
    });
  }

  async function review(requestId: string, approve: boolean) {
    try {
      setBusy(requestId);
      setMessage("");
      const token = await accessToken();
      const permissions = approve ? selected[requestId] ?? [] : [];

      if (approve && permissions.length === 0) {
        throw new Error("Select at least one permission before approval");
      }

      const response = await fetch("/api/access-requests", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          permissions,
          note: notes[requestId] ?? "",
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Request failed");

      setMessage(approve ? "Access approved." : "Access request rejected.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed");
    } finally {
      setBusy(null);
    }
  }

  const pending = requests.filter((request) => request.status === "pending");
  const reviewed = requests.filter((request) => request.status !== "pending");

  return (
    <section>
      {message && (
        <div
          role="status"
          style={{
            padding: 12,
            border: "1px solid #cbd5e1",
            borderRadius: 10,
            marginBottom: 18,
            background: "#f8fafc",
          }}
        >
          {message}
        </div>
      )}

      <div style={{ display: "grid", gap: 18 }}>
        {pending.length === 0 ? (
          <div
            style={{
              padding: 22,
              border: "1px solid #e2e8f0",
              borderRadius: 14,
            }}
          >
            No pending employee access requests.
          </div>
        ) : (
          pending.map((request) => (
            <article
              key={request.request_id}
              style={{
                padding: 22,
                border: "1px solid #cbd5e1",
                borderRadius: 14,
                background: "#fff",
              }}
            >
              <div style={{ marginBottom: 18 }}>
                <strong style={{ fontSize: 18 }}>{request.employee_email}</strong>
                <div style={{ color: "#64748b", marginTop: 4 }}>
                  Requested {new Date(request.requested_at).toLocaleString()}
                </div>
              </div>

              <div style={{ display: "grid", gap: 16 }}>
                {catalogByArea.map(([area, permissions]) => (
                  <fieldset
                    key={area}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 10,
                      padding: 14,
                    }}
                  >
                    <legend style={{ fontWeight: 800, padding: "0 6px" }}>
                      {area}
                    </legend>
                    <div style={{ display: "grid", gap: 10 }}>
                      {permissions.map((permission) => (
                        <label
                          key={permission.permission}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 10,
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={(selected[request.request_id] ?? []).includes(
                              permission.permission,
                            )}
                            onChange={() =>
                              toggle(request.request_id, permission.permission)
                            }
                          />
                          <span>
                            <strong>{permission.label}</strong>
                            {permission.description && (
                              <span
                                style={{
                                  display: "block",
                                  color: "#64748b",
                                  fontSize: 14,
                                }}
                              >
                                {permission.description}
                              </span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>

              <label
                style={{
                  display: "grid",
                  gap: 6,
                  marginTop: 16,
                  fontWeight: 700,
                }}
              >
                Review note
                <textarea
                  value={notes[request.request_id] ?? ""}
                  onChange={(event) =>
                    setNotes((current) => ({
                      ...current,
                      [request.request_id]: event.target.value,
                    }))
                  }
                  rows={3}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    font: "inherit",
                  }}
                />
              </label>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  marginTop: 16,
                }}
              >
                <button
                  type="button"
                  disabled={busy === request.request_id}
                  onClick={() => void review(request.request_id, true)}
                  style={{ padding: "10px 16px", fontWeight: 800 }}
                >
                  Approve Selected Access
                </button>
                <button
                  type="button"
                  disabled={busy === request.request_id}
                  onClick={() => void review(request.request_id, false)}
                  style={{ padding: "10px 16px" }}
                >
                  Reject Request
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {reviewed.length > 0 && (
        <details style={{ marginTop: 28 }}>
          <summary style={{ cursor: "pointer", fontWeight: 800 }}>
            Reviewed requests ({reviewed.length})
          </summary>
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {reviewed.map((request) => (
              <div
                key={request.request_id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: 14,
                }}
              >
                <strong>{request.employee_email}</strong>
                <div style={{ color: "#64748b", marginTop: 4 }}>
                  {request.status} · {request.permissions.join(", ") || "No access granted"}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}

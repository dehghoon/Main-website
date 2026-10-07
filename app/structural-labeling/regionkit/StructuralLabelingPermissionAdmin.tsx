"use client";

import { useEffect, useMemo, useState } from "react";
import { labelingAccessToken } from "../client";

type EmployeePermissionRow = {
  user_id: string;
  email: string | null;
  base_role: string | null;
  permissions: string[] | null;
};

type PermissionKey =
  | "labeling.workspace"
  | "labeling.upload"
  | "labeling.annotate"
  | "labeling.submit";

const PERMISSIONS: Array<{ key: PermissionKey; label: string; description: string }> = [
  {
    key: "labeling.workspace",
    label: "Workspace",
    description: "View Structural Labeling candidates and private source workflow state.",
  },
  {
    key: "labeling.upload",
    label: "Upload",
    description: "Upload a private PDF/image source and create labeling candidates.",
  },
  {
    key: "labeling.annotate",
    label: "Annotate",
    description: "Start labeling and save annotation revisions.",
  },
  {
    key: "labeling.submit",
    label: "Submit",
    description: "Submit completed employee revisions for Owner QA.",
  },
];

export default function StructuralLabelingPermissionAdmin() {
  const [employees, setEmployees] = useState<EmployeePermissionRow[]>([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);
  const [busyPermission, setBusyPermission] = useState<PermissionKey | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const token = await labelingAccessToken();
      const response = await fetch("/api/structural-labeling/permissions", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (response.status === 403) {
        setAvailable(false);
        return;
      }
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? `Permission list failed: ${response.status}`);
      }
      const rows = (body.employees ?? []) as EmployeePermissionRow[];
      setEmployees(rows);
      setAvailable(true);
      if (!selectedEmail && rows[0]?.email) setSelectedEmail(rows[0].email);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Permission administration failed.");
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(
    () => employees.find((employee) => employee.email === selectedEmail) ?? null,
    [employees, selectedEmail],
  );

  async function setPermission(permission: PermissionKey, enabled: boolean) {
    if (!selectedEmail) return;
    setBusyPermission(permission);
    setMessage("");
    try {
      const token = await labelingAccessToken();
      const response = await fetch("/api/structural-labeling/permissions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: selectedEmail, permission, enabled }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? `Permission update failed: ${response.status}`);
      }
      setMessage(`${permission} ${enabled ? "granted" : "revoked"} for ${selectedEmail}.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Permission update failed.");
    } finally {
      setBusyPermission(null);
    }
  }

  if (available === false) return null;

  return (
    <section
      aria-label="Structural Labeling permission administration"
      style={{ maxWidth: 1440, margin: "0 auto 24px", padding: "0 20px" }}
    >
      <div style={{ border: "1px solid #d1d5db", borderRadius: 12, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Employee labeling permissions</h2>
        <p>
          Owner/Admin only. Grant only the minimum permissions required for a trusted employee.
          Permission changes are executed server-side and recorded in the Structural Labeling permission audit log.
        </p>

        {available === null ? (
          <p>Checking permission administration access …</p>
        ) : employees.length === 0 ? (
          <p>No employee accounts are available. Create or assign an employee account through the existing LinkoTech identity workflow first.</p>
        ) : (
          <>
            <label style={{ display: "block", marginBottom: 16 }}>
              Employee
              <select
                value={selectedEmail}
                onChange={(event) => setSelectedEmail(event.target.value)}
                style={{ display: "block", marginTop: 6, minWidth: 280, maxWidth: "100%" }}
              >
                {employees.map((employee) => (
                  <option key={employee.user_id} value={employee.email ?? ""}>
                    {employee.email ?? employee.user_id}
                  </option>
                ))}
              </select>
            </label>

            <div style={{ display: "grid", gap: 12 }}>
              {PERMISSIONS.map((item) => {
                const enabled = selected?.permissions?.includes(item.key) ?? false;
                return (
                  <div
                    key={item.key}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      borderTop: "1px solid #e5e7eb",
                      paddingTop: 12,
                    }}
                  >
                    <div style={{ minWidth: 220, flex: "1 1 360px" }}>
                      <strong>{item.label}</strong>
                      <div style={{ fontSize: 13 }}>{item.description}</div>
                      <code>{item.key}</code>
                    </div>
                    <button
                      type="button"
                      disabled={busyPermission !== null || !selectedEmail}
                      onClick={() => void setPermission(item.key, !enabled)}
                    >
                      {busyPermission === item.key
                        ? "Saving …"
                        : enabled
                          ? "Revoke"
                          : "Grant"}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {message && <p role="status">{message}</p>}
      </div>
    </section>
  );
}

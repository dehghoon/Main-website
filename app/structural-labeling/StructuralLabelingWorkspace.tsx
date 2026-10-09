"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import UploadDrawing from "./UploadDrawing";
import AnnotationEditor from "./AnnotationEditor";
import { labelingApi } from "./client";
type Candidate = {
  id: string;
  workflow_state: string;
  page_index: number | null;
  page_id: string | null;
  original_filename: string | null;
  source_ref: string;
  source_sha256: string;
  transform_metadata: unknown;
  duplicate_of: string | null;
};
type Detail = {
  candidate: Candidate;
  revisions: Array<{
    annotations: import("../../lib/structural-labeling/contract").Annotation[];
    transform_metadata: import("../../lib/structural-labeling/contract").TransformMetadata;
    revision_no: number;
    revision_kind: string;
  }>;
  audit: unknown[];
};
export default function StructuralLabelingWorkspace() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [message, setMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const has = useCallback((permission: string) => permissions.includes(permission), [permissions]);
  const refreshQueue = useCallback(async () => {
    const body = await labelingApi("/api/structural-labeling/candidates");
    setPermissions(body.permissions ?? []);
    setCandidates(body.candidates ?? []);
  }, []);
  const refreshDetail = useCallback(async (id: string) => {
    setDetail(await labelingApi(`/api/structural-labeling/candidates/${id}`));
  }, []);
  useEffect(() => { void refreshQueue().catch((error) => setMessage(error.message)); }, [refreshQueue]);
  useEffect(() => { if (selected) void refreshDetail(selected).catch((error) => setMessage(error.message)); }, [selected, refreshDetail]);

  const selectedCandidate = useMemo(
    () => candidates.find((candidate) => candidate.id === selected) ?? null,
    [candidates, selected],
  );
  async function action(name: string, actionReason?: string) {
    if (!selected) return;
    setBusy(true);
    setActionMessage(`Running: ${name}...`);
    try {
      await labelingApi("/api/structural-labeling/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: selected, action: name, reason: actionReason || null }),
      });
      setReason("");
      const successMessage = `Action completed: ${name}`;
      setMessage(successMessage);
      setActionMessage(successMessage);
      await Promise.all([refreshQueue(), refreshDetail(selected)]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Action failed";
      setMessage(errorMessage);
      setActionMessage(`Failed: ${errorMessage}`);
    } finally {
      setBusy(false);
    }
  }

  async function deleteSelected() {
    if (!selected || !selectedCandidate) return;
    const label = selectedCandidate.original_filename || selectedCandidate.page_id || selectedCandidate.id;
    if (!window.confirm(`Remove "${label}" from your active labeling queue?`)) return;

    setBusy(true);
    try {
      await labelingApi(`/api/structural-labeling/candidates/${selected}/delete`, {
        method: "DELETE",
      });
      setSelected(null);
      setDetail(null);
      setMessage("Drawing removed from the active labeling queue.");
      await refreshQueue();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  const state = selectedCandidate?.workflow_state;
  const employeeCanAnnotate = has("labeling.annotate");
  const ownerCanReview = has("labeling.owner_review") && !employeeCanAnnotate;
  const canEdit = state === "labeling-in-progress" ? employeeCanAnnotate : state === "submitted-for-owner-qa" ? ownerCanReview : false;
  const employeeCanDelete =
    has("labeling.upload") &&
    employeeCanAnnotate &&
    ["candidate", "suitable-for-labeling", "unsuitable-for-labeling", "labeling-in-progress", "revision-required"].includes(state ?? "");

  return (
    <main style={{ maxWidth: 1440, margin: "0 auto", padding: "40px 20px 80px" }}>
      <header>
        <p>Authenticated Workspace</p>
        <h1>Structural Labeling</h1>
        {message && <p role="status">{message}</p>}
      </header>
      <section style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", margin: "20px 0" }}>
        {has("labeling.upload") && <UploadDrawing onDone={() => void refreshQueue()} onMessage={setMessage} />}
        <button onClick={() => void refreshQueue()}>Refresh Queue</button>
        <span>{candidates.length} candidates</span>
      </section>
      <section style={{ display: "grid", gridTemplateColumns: "minmax(260px, 360px) minmax(0, 1fr)", gap: 20 }}>
        <aside>
          <h2>Candidate Queu</h2>
          {candidates.map((candidate) => (
            <button key={candidate.id} onClick={() => setSelected(candidate.id)}>
              <strong>{candidate.original_filename || candidate.page_id || candidate.id}</strong><br />
              <small>{candidate.workflow_state}{candidate.page_index != null ? ` · page ${candidate.page_index + 1}` : ""}</small>
            </button>
          ))}
        </aside>
        <article>
          {!selectedCandidate && <p>Select a candidate.</p>}
          {selectedCandidate && (
            <>
              <h2>{selectedCandidate.original_filename || selectedCandidate.page_id}</h2>
              <p><strong>Status:</strong> {selectedCandidate.workflow_state}</p>
              {employeeCanDelete && (<p><button disabled={busy} onClick={() => void deleteSelected()}>Remove uploaded drawing</button></p>)}
              {state === "candidate" && employeeCanAnnotate && (
                <div>
                  <button disabled={busy} onClick={() => void action("mark-suitable")}>Suitable for labeling</button>
                  <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Unsuitable reason" />
                  <button disabled={busy || !reason.trim()} onClick={() => void action("mark-unsuitable", reason)}>Unsuitable for labeling</button>
                </div>
              )}
              {(state === "suitable-for-labeling" || state === "revision-required") && employeeCanAnnotate && (
                <button disabled={busy} onClick={() => void action("start-labeling")}>Start / Resume Labeling</button>
              )}
              {detail && (
                <AnnotationEditor candidate={detail.candidate} revisions={detail.revisions} canEdit={canEdit} onSaved={() => void refreshDetail(selectedCandidate.id)} onMessage={setMessage} />
              )}
              {state === "labeling-in-progress" && has("labeling.submit") && (
                <section style={{ marginTop: 12, padding: 12, border: "1=x solid #cbd5e1", borderRadius: 8 }}>
                  <button disabled={busy} onClick={() => void action("submit-owner-qa")}>
                    {busy ? "Submitting..." : "Submit for Owner QA"}
                  </button>
                  {actionMessage && <p role="status" aria-live="polite" style={{ marginBottom: 0 }}>{actionMessage}</p>}
                </section>
              )}
              {state === "submitted-for-owner-qa" && ownerCanReview && (
                <section style={{ marginTop: 20, borderTop: "1px solid #bbb", paddingTop: 16 }}>
                  <h3>Owner QA</h3>
                  <p>Any annotation correction saved above creates a new Owner adjudication revision; the Employee submission is preserved.</p>
                  <button disabled={busy} onClick={() => void action("approve")}>Approve</button>{" "}
                  <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason for reject/revision" />{" "}
                  <button disabled={busy || !reason.trim()} onClick={() => void action("reject", reason)}>Reject</button>{" "}
                  <button disabled={busy || !reason.trim()} onClick={() => void action("request-revision", reason)}>Revision Required</button>
                </section>
              )}
              <details><summary>Audit / Revision History</summary><pre>{JSON.stringify({ revisions: detail?.revisions ?? [], audit: detail?.audit ?? [] }, null, 2)}</pre></details>
            </>
          )}
        </article>
      </section>
    </main>
  );
}

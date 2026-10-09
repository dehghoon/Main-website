"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import UploadDrawing from "./UploadDrawing";
import AnnotationEditor from "./AnnotationEditor";
import { labelingApi } from "./client";
import type { Annotation, TransformMetadata } from "../../lib/structural-labeling/contract";

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

type Revision = {
  annotations: Annotation[];
  transform_metadata: TransformMetadata;
  revision_no: number;
  revision_kind: string;
};

type Detail = {
  candidate: Candidate;
  revisions: Revision[];
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

  const has = useCallback(
    (permission: string) => permissions.includes(permission),
    [permissions],
  );

  const refreshQueue = useCallback(async () => {
    const body = await labelingApi("/api/structural-labeling/candidates");
    setPermissions(body.permissions ?? []);
    setCandidates(body.candidates ?? []);
  }, []);

  const refreshDetail = useCallback(async (id: string) => {
    setDetail(await labelingApi(`/api/structural-labeling/candidates/${id}`));
  }, []);

  useEffect(() => {
    void refreshQueue().catch((error) => setMessage(error.messae));
  }, [refreshQueue]);

  useEffect(() => {
    if (selected) {
      void refreshDetail(selected).catch((error) => setMessage(error.message));
    }
  }, [selected, refreshDetail]);

  const selectedCandidate = useMemo(
    () => candidates.find((candidate) => candidate.id === selected) ?? null,
    [candidates, selected],
  );

  const state = selectedCandidate?.workflow_state;
  const employeeCanAnnotate = has("labeling.annotate");
  const ownerCanReview = has("labeling.owner_review");
  const canEdit =
    (state === "labeling-in-progress" && employeeCanAnnotate) ||
    (state === "submitted-for-owner-qa" && ownerCanReview);

  const latestRevision = detail?.revisions.at(-1) ?? null;
  const savedLabelCount = latestRevision?.annotations?.length ?? 0;

  const employeeCanDelete =
    has("labeling.upload") &&
    !ownerCanReview &&
    Boolean(selectedCandidate);

  async function action(name: string, actionReason?: string) {
    if (!selected) return;
    setBusy(true);
    setActionMessage(`Running: ${name}...`);
    try {
      await labelingApi("/api/structural-labeling/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: selected,
          action: name,
          reason: actionReason || null,
        }),
      });
      setReason("");
      setActionMessage(`Action complete: ${name}`);
      await Promise.all([refreshQueue(), refreshDetail(selected)]);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Action failed";
      setMessage(text);
      setActionMessage(`Failed: ${text}`);
    } finally {
      setBusy(false);
    }
  }

  async function removeSelected() {
    if (!selected || !selectedCandidate) return;
    const label =
      selectedCandidate.original_filename ||
      selectedCandidate.page_id ||
      selectedCandidate.id;

    if (
      !window.confirm(
        `Remove "${label}" from your active labeling queue? Source and audit history will be preserved.`,
      )
    ) {
      return;
    }

    setBusy(true);
    setActionMessage("Removing uploaded drawing...");
    try {
      await labelingApi(
        `/api/structural-labeling/candidates/${selected}/delete`,
        { method: "DELETE" },
      );
      setSelected(null);
      setDetail(null);
      setActionMessage("Drawing removed from the active labeling queue.");
      await refreshQueue();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Delete failed";
      setMessage(text);
      setActionMessage(`Failed: ${text}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="labeling-page">
      <header className="labeling-header">
        <p>Authenticated Workspace</p>
        <h1>Structural Labeling</h1>
        {message && <p role="status" className="status-message">{message}</p>}
      </header>
      <section className="labeling-toolbar">
        {has("labeling.upload") && (
          <UploadDrawing
            onDone={() => void refreshQueue()}
            onMessage={setMessage}
          />
        )}
        <button onClick={() => void refreshQueue()}>Refresh Queue</button>
        <span>{candidates.length} candidates</span>
      </section>
      <section className="labeling-grid">
        <aside className="candidate-queue">
          <h2>Candidate Queue</h2>
          <div className="candidate-list">
            {candidates.map((candidate) => (
              <button
                className={candidate.id === selected ? "candidate-card selected" : "candidate-card"}
                key={candidate.id}
                onClick={() => setSelected(candidate.id)}
              >
                <strong>
                  {candidate.original_filename || candidate.page_id || candidate.id}
                </strong>
                <small>
                  {candidate.workflow_state}
                  {candidate.page_index != null ? ` · page ${candidate.page_index + 1}` : ""}
                </small>
              </button>
            ))}
          </div>
        </aside>
        <article className="candidate-detail">
          {!selectedCandidate && <p>Select a candidate.</p>}
          {selectedCandidate && (
            <>
              <div className="candidate-heading">
                <h2>
                  {selectedCandidate.original_filename ||
                    selectedCandidate.page_id ||
                    selectedCandidate.id}
                </h2>
                <p><strong>Status:</strong> {selectedCandidate.workflow_state}</p>
                <p><strong>Saved labels:</strong> {savedLabelCount}</p>
              </div>
              {employeeCanDelete && (
                <button
                  className="danger-button"
                  disabled={busy}
                  onClick={() => void removeSelected()}
                >
                  Remove uploaded drawing
                </button>
              )}
              {state === "candidate" && employeeCanAnnotate && (
                <div className="action-row">
                  <button disabled={busy} onClick={() => void action("mark-suitable")}>
                    Suitable for labeling
                  </button>
                  <input
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Unsuitable reason"
                  />
                  <button
                    disabled={busy || !reason.trim()}
                    onClick={() => void action("mark-unsuitable", reason)}
                  >
                    Unsuitable for labeling
                  </button>
                </div>
              )}
              {(state === "suitable-for-labeling" ||
                state === "revision-required") &&
                employeeCanAnnotate && (
                  <button
                    disabled={busy}
                    onClick={() => void action("start-labeling")}
                  >
                    Start / Resume Labeling
                  </button>
                )}
              {detail && (
                <AnnotationEditor
                  candidate={detail.candidate}
                  revisions={detail.revisions}
                  canEdit={canEdit}
                  onSaved={() => {
                    void refreshDetail(selectedCandidate.id);
                    void refreshQueue();
                  }}
                  onMessage={setMessage}
                />
              )}
              {state === "labeling-in-progress" && has("labeling.submit") && (
                <section className="action-panel">
                  <p>
                    Save the current labels first. Only saved revision labels are
                    transferred to Owner QA.
                  </p>
                  <button
                    disabled={busy || savedLabelCount === 0}
                    onClick={() => void action("submit-owner-qa")}
                  >
                    Submit saved labels for Owner QA
                  </button>
                  {savedLabelCount === 0 && (
                    <p className="warning">
                      No saved labels are available for submission.
                    </p>
                  )}
                </section>
              )}
              {state === "submitted-for-owner-qa" && ownerCanReview && (
                <section className="action-panel">
                  <h3>Owner QA</h3>
                  {savedLabelCount === 0 ? (
                    <p className="warning">
                      This legacy submission contains no saved labels. Request a
                      revision instead of approving it.
                    </p>
                  ) : (
                    <p>{savedLabelCount} saved label(s) are available for review.</p>
                  )}
                  <button
                    disabled={busy || savedLabelCount === 0}
                    onClick={() => void action("approve")}
                  >
                    Approve
                  </button>
                  <input
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Reason for reject/revision"
                  />
                  <button
                    disabled={busy || !reason.trim()}
                    onClick={() => void action("reject", reason)}
                  >
                    Reject
                  </button>
                  <button
                    disabled={busy || !reason.trim()}
                    onClick={() => void action("request-revision", reason)}
                  >
                    Revision Required
                  </button>
                </section>
              )}
              {actionMessage && (
                <p role="status" aria-live="polite" className="action-message">
                  {actionMessage}
                </p>
              )}
              <details>
                <summary>Audit / Revision History</summary>
                <pre>
                  {JSON.stringify(
                    {
                      revisions: detail?.revisions ?? [],
                      audit: detail?.audit ?? [],
                    },
                    null,
                    2,
                  )}
                </pre>
              </details>
            </>
          )}
        </article>
      </section>
      <style jsx>{`
        .labeling-page {
          max-width: 1440px;
          margin: 0 auto;
          padding: 32px 20px 64px;
          font-size: 16px;
          line-height: 1.45;
        }
        .labeling-header h1,
        .candidate-queue h2,
        .candidate-detail h2 {
          overflow-wrap: anywhere;
          word-break: break-word;
        }
        .labeling-toolbar,
        .action-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          margin: 16px 0 22px;
        }
        .labeling-grid {
          display: grid;
          grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
          gap: 28px;
          align-items: start;
        }
        .candidate-list {
          display: grid;
          gap: 10px;
        }
        .candidate-card {
          width: 100%;
          min-width: 0;
          padding: 12px 14px;
          text-align: left;
          border-radius: 8px;
          white-space: normal;
          overflow-wrap: anywhere;
          word-break: break-word;
          line-height: 1.35;
        }
        .candidate-card strong,
        .candidate-card small {
          display: block;
          max-width: 100%;
          overflow-wrap: anywhere;
        }
        .candidate-card small {
          margin-top: 5px;
        }
        .candidate-card.selected {
          outline: 2px solid #2563eb;
        }
        .candidate-detail {
          min-width: 0;
        }
        .candidate-heading {
          margin-bottom: 12px;
        }
        .action-panel {
          margin-top: 16px;
          padding: 14px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
        }
        .action-panel input {
          min-height: 38px;
          margin: 6px 8px 6px 0;
        }
        .action-panel button,
        .action-row button,
        .danger-button {
          min-height: 38px;
          margin: 6px 8px 6px 0;
          padding: 8px 12px;
        }
        .danger-button {
          border-color: #b91c1c;
        }
        .warning {
          font-weight: 600;
        }
        .action-message,
        .status-message {
          margin-top: 10px;
          overflow-wrap: anywhere;
        }
        pre {
          max-width: 100%;
          overflow: auto;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }
        @media (max-width: 1100px) {
          .labeling-grid {
            grid-template-columns: 1fr;
          }
          .candidate-list {
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          }
        }
        @media (max-width: 640px) {
          .labeling-page {
            padding: 20px 12px 48px;
            font-size: 15px;
          }
          .candidate-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}

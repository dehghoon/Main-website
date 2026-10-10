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

const DELETABLE_STATES = new Set([
  "candidate",
  "suitable-for-labeling",
  "unsuitable-for-labeling",
  "labeling-in-progress",
  "revision-required",
]);

function labelOf(candidate: Candidate) {
  return candidate.original_filename || candidate.page_id || candidate.id;
}

export default function StructuralLabelingWorkspace() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [multiSelected, setMultiSelected] = useState<Set<string>>(() => new Set());
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
    const next = (body.candidates ?? []) as Candidate[];
    setPermissions(body.permissions ?? []);
    setCandidates(next);
    setSelected((current) => current && next.some((item) => item.id === current) ? current : null);
    setMultiSelected((current) => {
      const ids = new Set(next.map((item) => item.id));
      return new Set([...current].filter((id) => ids.has(id)));
    });
  }, []);

  const refreshDetail = useCallback(async (id: string) => {
    setDetail(await labelingApi(`/api/structural-labeling/candidates/${id}`));
  }, []);

  useEffect(() => {
    void refreshQueue().catch((error) => setMessage(error.message));
  }, [refreshQueue]);

  useEffect(() => {
    if (selected) {
      void refreshDetail(selected).catch((error) => setMessage(error.message));
    } else {
      setDetail(null);
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

  const canRemove = useCallback(
    (candidate: Candidate) =>
      has("labeling.upload") && DELETABLE_STATES.has(candidate.workflow_state),
    [has],
  );

  const removableCandidates = useMemo(
    () => candidates.filter(canRemove),
    [candidates, canRemove],
  );

  const selectedRemovable = useMemo(
    () => candidates.filter((candidate) => multiSelected.has(candidate.id) && canRemove(candidate)),
    [candidates, multiSelected, canRemove],
  );

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

  async function removeOne() {
    if (!selected || !selectedCandidate || !canRemove(selectedCandidate)) return;
    if (!window.confirm(`Remove "${labelOf(selectedCandidate)}" from the active labeling queue? Source and audit history will be preserved.`)) return;

    setBusy(true);
    try {
      await labelingApi(`/api/structural-labeling/candidates/${selected}/delete`, { method: "DELETE" });
      setMultiSelected((current) => {
        const next = new Set(current);
        next.delete(selected);
        return next;
      });
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

  function toggleMulti(candidate: Candidate) {
    if (!canRemove(candidate)) return;
    setMultiSelected((current) => {
      const next = new Set(current);
      if (next.has(candidate.id)) next.delete(candidate.id);
      else next.add(candidate.id);
      return next;
    });
  }

  async function removeMany() {
    if (!selectedRemovable.length) return;
    if (!window.confirm(`Remove ${selectedRemovable.length} selected drawing${selectedRemovable.length === 1 ? "" : "s"} from the active labeling queue? Submitted drawings are protected.`)) return;

    setBusy(true);
    setActionMessage(`Removing ${selectedRemovable.length} selected drawing${selectedRemovable.length === 1 ? "" : "s"}...`);

    const results = await Promise.allSettled(
      selectedRemovable.map((candidate) =>
        labelingApi(`/api/structural-labeling/candidates/${candidate.id}/delete`, { method: "DELETE" }),
      ),
    );

    const removedIds = new Set(
      selectedRemovable
        .filter((_, index) => results[index].status === "fulfilled")
        .map((candidate) => candidate.id),
    );
    const failed = selectedRemovable.filter((_, index) => results[index].status === "rejected");

    setMultiSelected((current) => {
      const next = new Set(current);
      removedIds.forEach((id) => next.delete(id));
      return next;
    });

    if (selected && removedIds.has(selected)) {
      setSelected(null);
      setDetail(null);
    }

    setActionMessage(
      failed.length
        ? `Removed ${removedIds.size}. Failed to remove ${failed.length}: ${failed.map(labelOf).join(", ")}`
        : `Removed ${removedIds.size} selected drawing${removedIds.size === 1 ? "" : "s"}.`,
    );

    try {
      await refreshQueue();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Queue refresh failed");
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
          <UploadDrawing onDone={() => void refreshQueue()} onMessage={setMessage} />
        )}
        <button onClick={() => void refreshQueue()}>Refresh Queue</button>
        <span>{candidates.length} candidates</span>
      </section>

      {has("labeling.upload") && (
        <section className="action-row" aria-label="Candidate multi-select actions">
          <button
            type="button"
            disabled={busy || removableCandidates.length === 0}
            onClick={() => setMultiSelected(new Set(removableCandidates.map((candidate) => candidate.id)))}
          >
            Select removable ({removableCandidates.length})
          </button>
          <button
            type="button"
            disabled={busy || multiSelected.size === 0}
            onClick={() => setMultiSelected(new Set())}
          >
            Clear selection
          </button>
          <button
            type="button"
            className="danger-button"
            disabled={busy || selectedRemovable.length === 0}
            onClick={() => void removeMany()}
          >
            Remove selected ({selectedRemovable.length})
          </button>
          <span>Submitted drawings are locked and cannot be selected for removal.</span>
        </section>
      )}

      <section className="labeling-grid">
        <aside className="candidate-queue">
          <h2>Candidate Queue</h2>
          <div className="candidate-list">
            {candidates.map((candidate) => {
              const removable = canRemove(candidate);
              return (
                <div
                  className={`candidate-card${candidate.id === selected ? " selected" : ""}`}
                  key={candidate.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(candidate.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelected(candidate.id);
                    }
                  }}
                >
                  {has("labeling.upload") && (
                    <label onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={multiSelected.has(candidate.id)}
                        disabled={!removable || busy}
                        onChange={() => toggleMulti(candidate)}
                        aria-label={`Select ${labelOf(candidate)} for removal`}
                      />{" "}
                      {removable ? "Select" : "Locked"}
                    </label>
                  )}
                  <strong>{labelOf(candidate)}</strong>
                  <small>
                    {candidate.workflow_state}
                    {candidate.page_index !== null ? ` · page ${candidate.page_index + 1}` : ""}
                  </small>
                </div>
              );
            })}
          </div>
        </aside>

        <article className="candidate-detail">
          {!selectedCandidate && <p>Select a candidate.</p>}
          {selectedCandidate && (
            <>
              <div className="candidate-heading">
                <h2>{labelOf(selectedCandidate)}</h2>
                <p><strong>Status:</strong> {selectedCandidate.workflow_state}</p>
                <p><strong>Saved labels:</strong> {savedLabelCount}</p>
              </div>

              {canRemove(selectedCandidate) && (
                <button className="danger-button" disabled={busy} onClick={() => void removeOne()}>
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

              {(state === "suitable-for-labeling" || state === "revision-required") &&
                employeeCanAnnotate && (
                  <button disabled={busy} onClick={() => void action("start-labeling")}>
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
                  <p>Save the current labels first. Only saved revision labels are transferred to Owner QA.</p>
                  <button
                    disabled={busy || savedLabelCount === 0}
                    onClick={() => void action("submit-owner-qa")}
                  >
                    Submit saved labels for Owner QA
                  </button>
                  {savedLabelCount === 0 && <p className="warning">No saved labels are available for submission.</p>}
                </section>
              )}

              {state === "submitted-for-owner-qa" && ownerCanReview && (
                <section className="action-panel">
                  <h3>Owner QA</h3>
                  {savedLabelCount === 0 ? (
                    <p className="warning">This legacy submission contains no saved labels. Request a revision instead of approving it.</p>
                  ) : (
                    <p>{savedLabelCount} saved label(s) are available for review.</p>
                  )}
                  <button disabled={busy || savedLabelCount === 0} onClick={() => void action("approve")}>
                    Approve
                  </button>
                  <input
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Reason for reject/revision"
                  />
                  <button disabled={busy || !reason.trim()} onClick={() => void action("reject", reason)}>
                    Reject
                  </button>
                  <button disabled={busy || !reason.trim()} onClick={() => void action("request-revision", reason)}>
                    Revision Required
                  </button>
                </section>
              )}

              {actionMessage && <p role="status" aria-live="polite" className="action-message">{actionMessage}</p>}

              <details>
                <summary>Audit / Revision History</summary>
                <pre>{JSON.stringify({ revisions: detail?.revisions ?? [], audit: detail?.audit ?? [] }, null, 2)}</pre>
              </details>
            </>
          )}
        </article>
      </section>
    </main>
  );
}

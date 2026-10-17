"use client";

import { useEffect, useState } from "react";
import { labelingApi } from "./client";

type ApprovedCandidate = {
  id: string;
  original_filename: string | null;
  page_index: number | null;
  workflow_state: string;
};

type RecoveryListResponse = {
  candidates: ApprovedCandidate[];
};

type RecoveryRetryResponse = {
  commitSha: string;
  exportPath: string;
};

export default function Gpt7HandoffRecovery() {
  const [candidates, setCandidates] = useState<ApprovedCandidate[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const body = await labelingApi<RecoveryListResponse>(
        "/api/structural-labeling/gpt7-handoffs/retry",
      );
      setCandidates(body.candidates ?? []);
    } catch (error) {
      const text = error instanceof Error ? error.message : "";
      if (!text.includes("labeling_owner_review_permission_required")) {
        setMessage(text);
      }
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function retry(candidateId: string) {
    setBusyId(candidateId);
    setMessage("Retrying GPT-7 handoff...");
    try {
      const body = await labelingApi<RecoveryRetryResponse>(
        "/api/structural-labeling/gpt7-handoffs/retry",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidateId }),
        },
      );
      setMessage(
        `GPT-7 handoff complete. Commit: ${body.commitSha}. Export: ${body.exportPath}`,
      );
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "GPT-7 handoff retry failed");
    } finally {
      setBusyId(null);
    }
  }

  if (!candidates.length && !message) return null;

  return (
    <section
      style={{
        maxWidth: 1440,
        margin: "16px auto 0",
        padding: "14px 20px",
        border: "1px solid #cbd5e1",
        borderRadius: 8,
      }}
    >
      <h2>GPT-7 Handoff Recovery</h2>
      <p>
        Owner-approved candidates can be exported again without repeating Owner QA approval.
      </p>
      {candidates.map((candidate) => (
        <div
          key={candidate.id}
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 8,
          }}
        >
          <span>
            {candidate.original_filename || candidate.id}
            {candidate.page_index != null ? ` · page ${candidate.page_index + 1}` : ""}
          </span>
          <button
            disabled={busyId !== null}
            onClick={() => void retry(candidate.id)}
          >
            {busyId === candidate.id ? "Retrying..." : "Retry GPT-7 handoff"}
          </button>
        </div>
      ))}
      {message && <p role="status">{message}</p>}
    </section>
  );
}

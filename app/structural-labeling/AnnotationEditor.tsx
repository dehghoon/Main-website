"use client";

import { useState } from "react";
import EnhancedAnnotationEditor from "./EnhancedAnnotationEditor";
import { labelingApi } from "./client";
import type { Annotation, TransformMetadata } from "../../lib/structural-labeling/contract";

type Candidate = {
  id: string;
  page_index: number | null;
  workflow_state: string;
  transform_metadata: unknown;
};

type Revision = {
  annotations: Annotation[];
  transform_metadata: TransformMetadata;
  revision_no: number;
  revision_kind: string;
};

export default function AnnotationEditor(props: {
  candidate: Candidate;
  revisions: Revision[];
  canEdit: boolean;
  onSaved: () => void;
  onMessage: (message: string) => void;
}) {
  const [retrying, setRetrying] = useState(false);
  const [handoffMessage, setHandoffMessage] = useState("");
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnosticMessage, setDiagnosticMessage] = useState("");

  const retryHandoff = async () => {
    setRetrying(true);
    setHandoffMessage("Retrying GPT-7 GitHub handoff...");
    try {
      const result = await labelingApi<{
        handoff?: {
          state?: string;
          repository?: string;
          commitSha?: string;
          exportPath?: string;
        };
      }>("/api/structural-labeling/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: props.candidate.id,
          action: "retry-gpt7-handoff",
        }),
      });

      const handoff = result.handoff;
      const message =
        handoff?.state === "exported-to-gpt7-github"
          ? `GPT-7 handoff complete: ${handoff.repository ?? "repository"} @ ${handoff.commitSha ?? "commit"}`
          : "GPT-7 handoff completed.";
      setHandoffMessage(message);
      props.onMessage(message);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "GPT-7 GitHub handoff failed";
      setHandoffMessage(message);
      props.onMessage(message);
    } finally {
      setRetrying(false);
    }
  };



  const diagnoseEnv = async () => {
    setDiagnosing(true);
    setDiagnosticMessage("Checking GPT-7 environment...");
    try {
      const result = await labelingApi<{
        vercelEnv?: string | null;
        vercelGitCommitSha?: string | null;
        env?: Record<string, { present: boolean; length: number }>;
      }>("/api/structural-labeling/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: props.candidate.id,
          action: "diagnose-gpt7-env",
        }),
      });

      setDiagnosticMessage(JSON.stringify(result, null, 2));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Diagnostic failed";
      setDiagnosticMessage(message);
    } finally {
      setDiagnosing(false);
    }
  };

  return (
    <>
      <EnhancedAnnotationEditor {...props} />
      {props.candidate.workflow_state === "owner-approved" && (
        <section
          style={{
            marginTop: 14,
            padding: 14,
            border: "1px solid #cbd5e1",
            borderRadius: 8,
          }}
        >
          <strong>GPT-7 GitHub handoff</strong>
          <p style={{ margin: "8px 0" }}>
            If the automatic export did not complete after approval, retry it here.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button disabled={retrying} onClick={() => void retryHandoff()}>
              {retrying ? "Retrying..." : "Retry GPT-7 handoff"}
            </button>
            <button disabled={diagnosing} onClick={() => void diagnoseEnv()}>
              {diagnosing ? "Checking..." : "Check GPT-7 env"}
            </button>
          </div>
          {handoffMessage && (
            <p role="status" aria-live="polite" style={{ marginBottom: 0 }}>
              {handoffMessage}
            </p>
          )}
          {diagnosticMessage && (
            <pre style={{ marginTop: 12, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {diagnosticMessage}
            </pre>
          )}
        </section>
      )}
    </>
  );
}

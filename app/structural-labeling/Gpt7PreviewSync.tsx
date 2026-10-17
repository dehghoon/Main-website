"use client";

import { useEffect, useState } from "react";
import { labelingApi } from "./client";

type PreviewCandidate = {
  id: string;
  original_filename: string | null;
  page_index: number | null;
};

type PreviewListResponse = {
  candidates: PreviewCandidate[];
};

type PreviewResult = {
  candidateId: string;
  previewPath: string;
  status: "created" | "existing";
};

export default function Gpt7PreviewSync() {
  const [status, setStatus] = useState("");
  const [paths, setPaths] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      try {
        const list = await labelingApi<PreviewListResponse>(
          "/api/structural-labeling/gpt7-handoffs/preview",
        );
        if (cancelled || !list.candidates.length) return;

        const results: string[] = [];
        const skipped: string[] = [];
        setStatus("Checking annotated GPT-7 previews...");

        for (const candidate of list.candidates) {
          if (cancelled) return;

          try {
            const result = await labelingApi<PreviewResult>(
              "/api/structural-labeling/gpt7-handoffs/preview",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ candidateId: candidate.id }),
              },
            );
            if (result.previewPath) results.push(result.previewPath);
          } catch (error) {
            const message = error instanceof Error ? error.message : "";
            if (message.includes("404") || message.includes("candidate_not_found")) {
              skipped.push(candidate.id);
              continue;
            }
            throw error;
          }
        }

        if (!cancelled) {
          setPaths(results);
          if (results.length) {
            setStatus(
              skipped.length
                ? `Annotated GPT-7 previews are synchronized. Skipped ${skipped.length} stale export record(s).`
                : "Annotated GPT-7 previews are synchronized.",
            );
          } else if (skipped.length) {
            setStatus(
              `No preview was generated. Skipped ${skipped.length} stale export record(s) whose GPT-7 handoff no longer exists.`,
            );
          } else {
            setStatus("");
          }
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "";
          if (!message.includes("labeling_owner_review_permission_required") {
            setStatus(`Annotated preview sync failed: ${message}`);
          }
        }
      }
    }

    void sync();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!status && !paths.length) return null;

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
      <h2>GPT-7 Annotated Preview</h2>
      {status && (
        <p role="status" aria-live="polite">
          {status}
        </p>
      )}
      {paths.length > 0 && (
        <ul>
          {paths.map((path) => (
            <li key={path}>
              <code>{path}</code>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

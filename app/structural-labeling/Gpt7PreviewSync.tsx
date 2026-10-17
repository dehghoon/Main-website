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
        setStatus("Checking annotated GPT-7 previews...");

        for (const candidate of list.candidates) {
          if (cancelled) return;
          const result = await labelingApi<PreviewResult>(
            "/api/structural-labeling/gpt7-handoffs/preview",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ candidateId: candidate.id }),
            },
          );
          results.push(result.previewPath);
        }

        if (!cancelled) {
          setPaths(results);
          setStatus(
            results.length ? "Annotated GPT-7 previews are synchronized." : "",
          );
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "";
          if (!message.includes("labeling_owner_review_permission_required")) {
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

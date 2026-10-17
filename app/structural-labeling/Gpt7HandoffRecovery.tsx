"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "../../lib/supabase-browser";
import { labelingAccessToken, labelingApi } from "./client";

let sharedPdfWorker: Worker | null = null;

type ApprovedCandidate = {
  id: string;
  original_filename: string | null;
  page_index: number | null;
};

type ListResponse = {
  candidates: ApprovedCandidate[];
};

type RenderInitResponse = {
  bucket: string;
  storagePath: string;
  token: string;
  pageIndex: number;
  transform: {
    raster_width_px: number;
    raster_height_px: number;
    page_rotation_deg: 0 | 90 | 180 | 270;
  };
};

type RetryResponse = {
  commitSha: string;
  exportPath: string;
};

type StartResponse = RenderInitResponse | RetryResponse;

function isRenderInit(value: StartResponse): value is RenderInitResponse {
  return "bucket" in value && "storagePath" in value && "token" in value;
}

async function renderPdfPage(
  candidateId: string,
  init: RenderInitResponse,
): Promise<{ blob: Blob; widthPx: number; heightPx: number; scale: number }> {
  const accessToken = await labelingAccessToken();
  const sourceResponse = await fetch(
    `/api/structural-labeling/source/${candidateId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!sourceResponse.ok) {
    throw new Error(`Private source load failed (${sourceResponse.status})`);
  }

  const contentType = (sourceResponse.headers.get("content-type") ?? "").toLowerCase();
  if (!contentType.includes("pdf")) {
    throw new Error("Recovery render expected a PDF source");
  }

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  if (!sharedPdfWorker) {
    sharedPdfWorker = new Worker(
      new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url),
      { type: "module" },
    );
  }
  pdfjs.GlobalWorkerOptions.workerPort = sharedPdfWorker;

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(await sourceResponse.arrayBuffer()),
  });

  try {
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(init.pageIndex + 1);
    const baseViewport = page.getViewport({
      scale: 1,
      rotation: init.transform.page_rotation_deg,
    });
    const scale = Math.max(
      init.transform.raster_width_px / baseViewport.width,
      init.transform.raster_height_px / baseViewport.height,
    );
    const viewport = page.getViewport({
      scale,
      rotation: init.transform.page_rotation_deg,
    });

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(viewport.width));
    canvas.height = Math.max(1, Math.round(viewport.height));

    const context = canvas.getContext("2d");
    if (!context) throw new Error("PDF recovery render canvas unavailable");

    await page.render({ canvasContext: context, viewport, canvas }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => {
        if (value) resolve(value);
        else reject(new Error("PDF recovery PNG encoding failed"));
      }, "image/png");
    });

    return { blob, widthPx: canvas.width, heightPx: canvas.height, scale };
  } finally {
    await loadingTask.destroy();
  }
}

export default function Gpt7HandoffRecovery() {
  const [candidates, setCandidates] = useState<ApprovedCandidate[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const body = await labelingApi<ListResponse>(
        "/api/structural-labeling/gpt7-handoffs/retry",
      );
      setCandidates(body.candidates ?? []);
    } catch (error) {
      const text = error instanceof Error ? error.message : "";
      if (!text.includes("labeling_owner_review_permission_required")) setMessage(text);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function retry(candidateId: string) {
    setBusyId(candidateId);
    setMessage("Preparing GPT-7 handoff...");

    try {
      const start = await labelingApi<StartResponse>(
        "/api/structural-labeling/gpt7-handoffs/retry",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "init-render", candidateId }),
        },
      );

      if (!isRenderInit(start)) {
        setMessage(`GPT-7 handoff complete. Commit: ${start.commitSha}. Export: ${start.exportPath}`);
        await load();
        return;
      }

      setMessage("Rendering the approved PDF page in the browser...");
      const rendered = await renderPdfPage(candidateId, start);

      const supabase = getSupabase();
      if (!supabase) throw new Error("Supabase is not configured");

      const renderFile = new File([rendered.blob], `page-${String(start.pageIndex + 1).padStart(4, "0")}.png`, { type: "image/png" });
      setMessage("Uploading the rendered page to private staging storage...");

      const { error: uploadError } = await supabase.storage
        .from(start.bucket)
        .uploadToSignedUrl(start.storagePath, start.token, renderFile, {
          contentType: "image/png",
          upsert: false,
        });
      if (uploadError) throw new Error(uploadError.message);

      setMessage("Completing GPT-7 handoff...");
      const body = await labelingApi<RetryResponse>(
        "/api/structural-labeling/gpt7-handoffs/retry",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "complete-render",
            candidateId,
            storagePath: start.storagePath,
            widthPx: rendered.widthPx,
            heightPx: rendered.heightPx,
            scale: rendered.scale,
          }),
        },
      );

      setMessage(`GPT-7 handoff complete. Commit: ${body.commitSha}. Export: ${body.exportPath}`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "GPT-7 handoff retry failed");
    } finally {
      setBusyId(null);
    }
  }

  if (!candidates.length && !message) return null;

  return (
    <section style={{ maxWidth: 1440, margin: "16px auto 0", padding: "14px 20px", border: "1px solid #cbd5e1", borderRadius: 8 }}>
      <h2>GPT-7 Handoff Recovery</h2>
      <p>Owner-approved candidates can be exported again without repeating Owner QA approval.</p>
      {candidates.map((candidate) => (
        <div key={candidate.id} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
          <span>
            {candidate.original_filename || candidate.id}
            {candidate.page_index != null ? ` · page ${candidate.page_index + 1}` : ""}
          </span>
          <button disabled={busyId !== null} onClick={() => void retry(candidate.id)}>
            {busyId === candidate.id ? "Retrying..." : "Retry GPT-7 handoff"}
          </button>
        </div>
      ))}
      {message && <p role="status" aria-live="polite">{message}</p>}
    </section>
  );
}

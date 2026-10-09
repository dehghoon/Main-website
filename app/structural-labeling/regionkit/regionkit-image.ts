"use client";

import type { TransformMetadata } from "../../../lib/structural-labeling/contract";
import { validateRoundTrip } from "../../../lib/structural-labeling/coordinates";
import { labelingAccessToken } from "../client";

let sharedPdfWorker: Worker | null = null;

type RegionKitImageCandidate = {
  id: string;
  page_index: number | null;
  original_filename: string | null;
  page_id: string | null;
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function regionKitFilename(candidate: RegionKitImageCandidate) {
  const sourceName =
    candidate.original_filename ??
    candidate.page_id ??
    `structural-labeling-${candidate.id}`;
  const withoutExtension = sourceName.replace(/\.[^.]+$/, "");
  const pageSuffix =
    candidate.page_index === null ? "" : `-page-${candidate.page_index + 1}`;
  return `${withoutExtension}${pageSuffix}-regionkit.png`;
}

async function fetchPrivateSource(candidateId: string) {
  const accessToken = await labelingAccessToken();
  const response = await fetch(`/api/structural-labeling/source/${candidateId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Private source download failed.");
  }

  return {
    blob: await response.blob(),
    contentType: (response.headers.get("content-type") ?? "").toLowerCase(),
  };
}

function canvasToPng(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("RegionKit PNG generation failed."));
    }, "image/png");
  });
}

async function renderPdfToRegionKitPng(
  source: Blob,
  pageIndex: number,
  transform: TransformMetadata,
) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  if (!sharedPdfWorker) {
    sharedPdfWorker = new Worker(
      new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url),
      { type: "module" },
    );
  }
  pdfjs.GlobalWorkerOptions.workerPort = sharedPdfWorker;

  const width = Math.max(1, Math.round(transform.raster_width_px));
  const height = Math.max(1, Math.round(transform.raster_height_px));
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(await source.arrayBuffer()),
  });

  try {
    const pdf = await loadingTask.promise;
    const pageNumber = pageIndex + 1;
    if (pageNumber < 1 || pageNumber > pdf.numPages) {
      throw new Error(`Source PDF does not contain page ${pageNumber}.`);
    }

    const page = await pdf.getPage(pageNumber);
    const baseViewport = page.getViewport({
      scale: 1,
      rotation: transform.page_rotation_deg,
    });
    const renderScale = Math.max(
      width / baseViewport.width,
      height / baseViewport.height,
    );
    const viewport = page.getViewport({
      scale: renderScale,
      rotation: transform.page_rotation_deg,
    });

    const rendered = document.createElement("canvas");
    rendered.width = Math.max(1, Math.round(viewport.width));
    rendered.height = Math.max(1, Math.round(viewport.height));
    const renderedContext = rendered.getContext("2d");
    if (!renderedContext) {
      throw new Error("PDF render canvas is unavailable.");
    }

    await page.render({
      canvasContext: renderedContext,
      viewport,
      canvas: rendered,
    }).promise;

    const output = document.createElement("canvas");
    output.width = width;
    output.height = height;
    const outputContext = output.getContext("2d");
    if (!outputContext) {
      throw new Error("RegionKit export canvas is unavailable.");
    }

    outputContext.fillStyle = "#fff";
    outputContext.fillRect(0, 0, width, height);
    outputContext.drawImage(rendered, 0, 0, width, height);

    return canvasToPng(output);
  } finally {
    await loadingTask.destroy();
  }
}

async function renderImageToRegionKitPng(
  source: Blob,
  transform: TransformMetadata,
) {
  const width = Math.max(1, Math.round(transform.raster_width_px));
  const height = Math.max(1, Math.round(transform.raster_height_px));
  const bitmap = await createImageBitmap(source);

  try {
    const output = document.createElement("canvas");
    output.width = width;
    output.height = height;
    const context = output.getContext("2d");
    if (!context) {
      throw new Error("RegionKit export canvas is unavailable.");
    }

    context.fillStyle = "#fff";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);

    return canvasToPng(output);
  } finally {
    bitmap.close();
  }
}

export async function downloadRegionKitImage(
  candidate: RegionKitImageCandidate,
  transform: TransformMetadata,
) {
  if (transform.transform_validation_state !== "validated") {
    throw new Error(
      "RegionKit image export requires a validated PDF-point transform.",
    );
  }

  validateRoundTrip(transform, 0.01);

  const { blob, contentType } = await fetchPrivateSource(candidate.id);
  const isPdf =
    contentType.includes("pdf") ||
    candidate.original_filename?.toLowerCase().endsWith(".pdf");

  const png = isPdf
    ? await renderPdfToRegionKitPng(
        blob,
        candidate.page_index ?? 0,
        transform,
      )
    : await renderImageToRegionKitPng(blob, transform);

  downloadBlob(png, regionKitFilename(candidate));
}

"use client";

import { useState } from "react";
import { labelingApi } from "./client";

export default function UploadDrawing({ onDone, onMessage }: { onDone: () => void; onMessage: (value: string) => void }) {
  const [busy, setBusy] = useState(false);
  async function handle(file: File) {
    setBusy(true);
    try {
      const pages: unknown[] = [];
      if (file.type === "application/pdf") {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
        for (let number = 1; number <= document.numPages; number += 1) {
          const page = await document.getPage(number);
          const rotation = (((page.rotate % 360) + 360) % 360) as 0 | 90 | 180 | 270;
          const source = page.getViewport({ scale: 1, rotation });
          const raster = page.getViewport({ scale: 2, rotation });
          const sx = source.width / raster.width;
          const sy = source.height / raster.height;
          pages.push({
            pageIndex: number - 1,
            transform: {
              coordinate_space: "source-page",
              unit: "pdf-point",
              effective_page_width_pt: source.width,
              effective_page_height_pt: source.height,
              effective_crop_box_pdf: page.view,
              page_rotation_deg: rotation,
              raster_width_px: Math.round(raster.width),
              raster_height_px: Math.round(raster.height),
              display_width_px: Math.round(raster.width),
              display_height_px: Math.round(raster.height),
              raster_to_source_page_affine: [sx, 0, 0, sy, 0, 0],
              source_page_to_raster_affine: [1 / sx, 0, 0, 1 / sy, 0, 0],
              display_to_raster_affine: [1, 0, 0, 1, 0, 0],
              render_version: "pdfjs-6.3.289-scale-2",
              transform_validation_state: "validated",
            },
          });
        }
      }
      const form = new FormData();
      form.set("file", file);
      form.set("pages", JSON.stringify(pages));
      await labelingApi("/api/structural-labeling/upload", { method: "POST", body: form });
      onMessage("Source preserved and candidate pages created. No dataset admission occurred.");
      onDone();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }
  return <label style={{ border: "1px solid #222", borderRadius: 8, padding: "10px 14px", cursor: "pointer" }}>
    {busy ? "Uploading…" : "Upload New Drawing"}
    <input hidden disabled={busy} type="file" accept=".pdf,image/png,image/jpeg,image/webp"
      onChange={(event) => { const file = event.target.files?.[0]; if (file) void handle(file); }} />
  </label>;
}

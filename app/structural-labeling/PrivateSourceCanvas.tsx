"use client";

import { useEffect, useRef, useState } from "react";
import type { TransformMetadata } from "../../lib/structural-labeling/contract";
import { labelingAccessToken } from "./client";

export default function PrivateSourceCanvas({
  candidateId,
  pageIndex,
  transform,
  displayWidth,
  displayHeight,
  onError,
}: {
  candidateId: string;
  pageIndex: number | null;
  transform: TransformMetadata;
  displayWidth: number;
  displayHeight: number;
  onError: (message: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        setState("loading");
        const token = await labelingAccessToken();
        const response = await fetch(`/api/structural-labeling/source/${candidateId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(`Private source load failed (${response.status})`);

        const blob = await response.blob();
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        const width = Math.max(1, Math.round(transform.raster_width_px));
        const height = Math.max(1, Math.round(transform.raster_height_px));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas unavailable");

        const type = (response.headers.get("content-type") || blob.type || "").toLowerCase();

        if (type.includes("pdf")) {
          const pdfjs = await import("pdfjs-dist");
          pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            "pdfjs-dist/build/pdf.worker.min.mjs",
            import.meta.url,
          ).toString();

          const pdf = await pdfjs.getDocument({
            data: new Uint8Array(await blob.arrayBuffer()),
          }).promise;
          const page = await pdf.getPage((pageIndex ?? 0) + 1);
          const base = page.getViewport({ scale: 1, rotation: transform.page_rotation_deg });
          const renderScale = Math.max(width / base.width, height / base.height);
          const viewport = page.getViewport({
            scale: renderScale,
            rotation: transform.page_rotation_deg,
          });

          const offscreen = document.createElement("canvas");
          offscreen.width = Math.max(1, Math.round(viewport.width));
          offscreen.height = Math.max(1, Math.round(viewport.height));
          const offscreenContext = offscreen.getContext("2d");
          if (!offscreenContext) throw new Error("PDF render canvas unavailable");

          await page.render({
            canvasContext: offscreenContext,
            viewport,
            canvas: offscreen,
          }).promise;

          if (cancelled) return;
          context.clearRect(0, 0, width, height);
          context.fillStyle = "#fff";
          context.fillRect(0, 0, width, height);
          context.drawImage(offscreen, 0, 0, width, height);
          await pdf.destroy();
        } else {
          const objectUrl = URL.createObjectURL(blob);
          try {
            await new Promise<void>((resolve, reject) => {
              const image = new Image();
              image.onload = () => {
                if (!cancelled) {
                  context.clearRect(0, 0, width, height);
                  context.fillStyle = "#fff";
                  context.fillRect(0, 0, width, height);
                  context.drawImage(image, 0, 0, width, height);
                }
                resolve();
              };
              image.onerror = () => reject(new Error("Image render failed"));
              image.src = objectUrl;
            });
          } finally {
            URL.revokeObjectURL(objectUrl);
          }
        }

        if (!cancelled) setState("ready");
      } catch (error) {
        if (cancelled) return;
        setState("error");
        onError(error instanceof Error ? error.message : "Source render failed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [candidateId, pageIndex, transform, onError]);

  return (
    <>
      <canvas
        ref={canvasRef}
        width={Math.max(1, Math.round(transform.raster_width_px))}
        height={Math.max(1, Math.round(transform.raster_height_px))}
        aria-label="Structural drawing page"
        style={{
          display: "block",
          width: displayWidth,
          height: displayHeight,
          background: "#fff",
        }}
      />
      {state !== "ready" && (
        <div
          role={state === "error" ? "alert" : "status"}
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            padding: 16,
            textAlign: "center",
            background: state === "error" ? "rgba(255,255,255,.94)" : "rgba(255,255,255,.72)",
            pointerEvents: "none",
          }}
        >
          {state === "loading"
            ? "Rendering private drawing…"
            : "Drawing background could not be rendered. Reload the page and retry."}
        </div>
      )}
    </>
  );
}

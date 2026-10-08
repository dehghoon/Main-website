"use client";

import { useEffect, useRef, useState } from "react";
import type { TransformMetadata } from "../../lib/structural-labeling/contract";
import { labelingAccessToken } from "./client";

let sharedPdfWorker: Worker | null = null;

type Props = {
  candidateId: string;
  pageIndex: number | null;
  transform: TransformMetadata;
  displayWidth: number;
  displayHeight: number;
  onError: (message: string) => void;
};

export default function PrivateSourceCanvas({
  candidateId,
  pageIndex,
  transform,
  displayWidth,
  displayHeight,
  onError,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        setError("");

        const token = await labelingAccessToken();
        const response = await fetch(`/api/structural-labeling/source/${candidateId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`Private source load failed (${response.status)`);
        }

        const source = await response.blob();
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        const width = Math.max(1, Math.round(transform.raster_width_px));
        const height = Math.max(1, Math.round(transform.raster_height_px));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas unavailable");

        const contentType = (
          response.headers.get("content-type") ??
          source.type ??
          ""
        ).toLowerCase();

        if (contentType.includes("pdf")) {
          const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

          if (!sharedPdfWorker) {
            sharedPdfWorker = new Worker(
              new URL(
                "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
                import.meta.url,
              ),
              { type: "module" },
            );
          }
          pdfjs.GlobalWorkerOptions.workerPort = sharedPdfWorker;

          const loadingTask = pdfjs.getDocument({
            data: new Uint8Array(await source.arrayBuffer()),
          });

          try {
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage((pageIndex ?? 0) + 1);
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

            const offscreen = document.createElement("canvas");
            offscreen.width = Math.max(1, Math.round(viewport.width));
            offscreen.height = Math.max(1, Math.round(viewport.height));
            const offscreenContext = offscreen.getContext("2d");
            if (!offscreenContext) {
              throw new Error("PDF render canvas unavailable");
            }

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
          } finally {
            await loadingTask.destroy();
          }
        } else {
          const objectUrl = URL.createObjectURL(source);
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
            URL.revokeObjectURL(_objectUrl);
          }
        }
      } catch (cause) {
        if (cancelled) return;
        const message = cause instanceof Error ? cause.message : "Source render failed";
        setError(message);
        onError(message);
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
      {error && (
        <div
          role="alert"
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            padding: 16,
            textAlign: "center",
            background: "rgba(255,255,255,.94)",
            pointerEvents: "none",
          }}
        >
          Drawing background could not be rendered: {error}
        </div>
      )}
    </>
  );
}

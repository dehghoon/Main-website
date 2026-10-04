"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  applyAffine,
  displayPointToRaster,
  rasterBBoxToSourcePage,
  validateRoundTrip,
} from "../../lib/structural-labeling/coordinates";
import {
  LABEL_CLASSES,
  validateBBox,
  type Annotation,
  type LabelClass,
  type PdfPointBBox,
  type TransformMetadata,
} from "../../lib/structural-labeling/contract";
import { labelingAccessToken, labelingApi } from "./client";

type Candidate = {
  id: string;
  page_index: number | null;
  workflow_state: string;
  transform_metadata: TransformMetadata | null;
};

type Revision = {
  annotations: Annotation[];
  transform_metadata: TransformMetadata;
  revision_no: number;
  revision_kind: string;
};

type Mode = "box" | "pan";

export default function AnnotationEditor({
  candidate,
  revisions,
  canEdit,
  onSaved,
  onMessage,
}: {
  candidate: Candidate;
  revisions: Revision[];
  canEdit: boolean;
  onSaved: () => void;
  onMessage: (message: string) => void;
}) {
  const latest = revisions.at(-1);
  const transform = latest?.transform_metadata ?? candidate.transform_metadata;
  const [annotations, setAnnotations] = useState<Annotation[]>(latest?.annotations ?? []);
  const [currentClass, setCurrentClass] = useState<LabelClass>("column");
  const [mode, setMode] = useState<Mode>("box");
  const [zoom, setZoom] = useState(1);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panStart, setPanStart] = useState<{ x: number; y: number; left: number; top: number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAnnotations(latest?.annotations ?? []);
    setSelectedId(null);
  }, [latest?.revision_no]);

  useEffect(() => {
    let objectUrl = "";
    void (async () => {
      try {
        if (!transform || transform.transform_validation_state !== "validated") return;
        validateRoundTrip(transform, 0.01);
        const access = await labelingAccessToken();
        const response = await fetch(`/api/structural-labeling/source/${candidate.id}`, {
          headers: { Authorization: `Bearer ${access}` },
        });
        if (!response.ok) throw new Error("Private source load failed");
        const blob = await response.blob();
        const canvas = canvasRef.current;
        if (!canvas) return;
        objectUrl = URL.createObjectURL(blob);

        if (blob.type === "application/pdf") {
          const pdfjs = await import("pdfjs-dist");
          pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            "pdfjs-dist/build/pdf.worker.min.mjs",
            import.meta.url,
          ).toString();
          const document = await pdfjs.getDocument({
            data: new Uint8Array(await blob.arrayBuffer()),
          }).promise;
          const page = await document.getPage((candidate.page_index ?? 0) + 1);
          const viewport = page.getViewport({scale: 2, rotation: transform.page_rotation_deg});
          canvas.width = Math.round(viewport.width);
          canvas.height = Math.round(viewport.height);
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Canvas unavailable");
          await page.render({ canvasContext: context, viewport, canvas }).promise;
        } else {
          await new Promise<void>((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
              canvas.width = image.naturalWidth;
              canvas.height = image.naturalHeight;
              const context = canvas.getContext("2d");
              if (!context) return reject(new Error("Canvas unavailable"));
              context.drawImage(image, 0, 0);
              resolve();
            };
            image.onerror = () => reject(new Error("Image render failed"));
            image.src = objectUrl;
          });
        }
      } catch (error) {
        onMessage(error instanceof Error ? error.message : "Source render failed");
      }
    })();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [candidate.id, candidate.page_index, transform, onMessage]);

  const selected = useMemo(
    () => annotations.find((annotation) => annotation.annotation_id === selectedId) ?? null,
    [annotations, selectedId],
  );

  if (!transform || transform.transform_validation_state !== "validated") {
    return (
      <p>
        Pixel-only or unvalidated source. Labeling and GPT-7 handoff are blocked until a reversible
        PDF-point transform is validated.
      </p>
    );
  }

  function pointerToDisplay(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / zoom,
      y: (event.clientY - rect.top) / zoom,
    };
  }

  function begin(event: React.PointerEvent<HTMLDivElement>) {
    if (mode === "pan") {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      setPanStart({
        x: event.clientX,
        y: event.clientY,
        left: scroller.scrollLeft,
        top: scroller.scrollTop,
      });
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    if (!canEdit) return;
    setDrawStart(pointerToDisplay(event));
    setSelectedId(null);
  }

  function move(event: React.PointerEvent<HTMLDivElement>) {
    if (!panStart || mode !== "pan") return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollLeft = panStart.left - (event.clientX - panStart.x);
    scroller.scrollTop = panStart.top - (event.clientY - panStart.y);
  }

  function finish(event: React.PointerEvent<HTMLDivElement>) {
    if (mode === "pan") {
      setPanStart(null);
      return;
    }
    if (!canEdit || !drawStart) return;
    const displayEnd = pointerToDisplay(event);
    const rasterStart = displayPointToRaster(drawStart, transform);
    const rasterEnd = displayPointToRaster(displayEnd, transform);
    const rasterBBox: PdfPointBBox = {
      xmin: Math.min(rasterStart.x, rasterEnd.x),
      ymin: Math.min(rasterStart.y, rasterEnd.y),
      xmax: Math.max(rasterStart.x, rasterEnd.x),
      ymax: Math.max(rasterStart.y, rasterEnd.y),
    };
    const bbox = rasterBBoxToSourcePage(rasterBBox, transform);
    const errors = validateBBox(
      bbox,
      transform.effective_page_width_pt,
      transform.effective_page_height_pt,
    );
    if (errors.length === 0) {
      const annotation: Annotation = {
        annotation_id: crypto.randomUUID(),
        class: currentClass,
        bbox,
        annotation_spec_version: "v0.2",
        flags: {},
      };
      setAnnotations((values) => [...values, annotation]);
      setSelectedId(annotation.annotation_id);
    } else {
      onMessage(errors.join(", "));
    }
    setDrawStart(null);
  }

  async function save() {
    try {
      validateRoundTrip(transform, 0.01);
      const errors = annotations.flatMap((annotation) => [
        ...validateBBox(
          annotation.bbox,
          transform.effective_page_width_pt,
          transform.effective_page_height_pt,
        ).map((error) => `${annotation.annotation_id}:$${error}`.replace(":$", ":")),
        ...(LABEL_CLASSES.includes(annotation.class) ? [] : [`${annotation.annotation_id}:invalid_class`]),
      ]);
      if (errors.length) throw new Error(errors.join(", "));
      await labelingApi("/api/structural-labeling/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: candidate.id,
          action: "save-revision",
          annotations,
          transform,
        }),
      });
      onMessage("Annotation revision saved.");
      onSaved();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Save failed");
    }
  }

  function updateSelected(patch: Partial<Annotation>) {
    if (!selectedId || !canEdit) return;
    setAnnotations((values) =>
      values.map((value) => (value.annotation_id === selectedId ? { ...value, ...patch } : value)),
    );
  }

  return (
    <section>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <strong>Current class:</strong>
        {LABEL_CLASSES.map((value) => (
          <button
            key={value}
            disabled={!canEdit}
            aria-pressed={currentClass === value}
            onClick={() => setCurrentClass(value)}
          >
            {value}
          </button>
        ))}
        <span aria-hidden="true">|</span>
        <button aria-pressed={mode === "box"} onClick={() => setMode("box")}>Box</button>
        <button aria-pressed={mode === "pan"} onClick={() => setMode("pan")}>Pan</button>
        <button onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}>− /</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((value) => Math.min(3, value + 0.25))}>+</button>
        {canEdit && <button onClick={() => void save()}>Save revision</button>}
      </div>

      <p>
        Authoritative annotations are source-page PDF points. Contract flags are preserved as supplied;
        this editor does not invent a local flag taxonomy.
      </p>

      <div
        ref={scrollerRef}
        style={{ overflow: "auto", maxHeight: 650, border: "1 solid #bbb", marginTop: 12 }}
      >
        <div
          onPointerDown={begin}
          onPointerMove={move}
          onPointerUp={finish}
          onPointerCancel={() => { setDrawStart(null); setPanStart(null); }}
          style={{
            position: "relative",
            width: transform.raster_width_px * zoom,
            height: transform.raster_height_px * zoom,
            touchAction: "none",
            cursor: mode === "pan" ? (panStart ? "grabbing" : "grab") : "crosshair",
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              display: "block",
              width: transform.raster_width_px * zoom,
              height: transform.raster_height_px * zoom,
            }}
          />
          {annotations.map((annotation) => {
            const a = applyAffine(transform.source_page_to_raster_affine, {
              x: annotation.bbox.xmin,
              y: annotation.bbox.ymin,
            });
            const b = applyAffine(transform.source_page_to_raster_affine, {
              x: annotation.bbox.xmax,
              y: annotation.bbox.ymax,
            });
            const isSelected = selectedId === annotation.annotation_id;
            return (
              <button
                key={annotation.annotation_id}
                type="button"
                title={`${annotation.class} ${annotation.annotation_id}`)
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedId(annotation.annotation_id);
                }}
                style={{
                  position: "absolute",
                  left: Math.min(a.x, b.x) * zoom,
                  top: Math.min(a.y, b.y) * zoom,
                  width: Math.abs(b.x - a.x) * zoom,
                  height: Math.abs(b.y - a.y) * zoom,
                  border: isSelected ? "3px solid" : "2px solid",
                  background: "transparent",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                <span style={{ background: "white" }}>{annotation.class}</span>
              </button>
            );
          })}
        </div>
      </div>

      <h3>Annotations</h3>
      {annotations.length === 0 && <p>No annotations yet.</p>}
      {annotations.map((annotation) => (
        <div
          key={annotation.annotation_id}
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 8,
            flexWrap: "wrap",
            outline: annotation.annotation_id === selectedId ? "2px solid" : undefined,
            padding: 4,
          }}
          onClick={() => setSelectedId(annotation.annotation_id)}
        >
          <select
            disabled={!canEdit}
            value={annotation.class}
            onChange={(event) => {
              setSelectedId(annotation.annotation_id);
              updateSelected({ class: event.target.value as LabelClass });
            }}
          >
            {LABEL_CLASSES.map((value) => <option key={value}>{value}</option>)}
          </select>
          {(["xmin", "ymin", "xmax", "ymax"] as const).map((key) => (
            <label key={key}>
              {key}
              <input
                style={{ width: 92 }}
                disabled={!canEdit}
                type="number"
                step="0.01"
                value={annotation.bbox[key]}
                onFocus={() => setSelectedId(annotation.annotation_id)}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setAnnotations((items) =>
                    items.map((item) =>
                      item.annotation_id === annotation.annotation_id
                        ? { ...item, bbox: { ...item.bbox, [key]: value } }
                        : item,
                    ),
                  );
                }}
              />
            </label>
          ))}
          <code>{JSON.stringify(annotation.flags)}</code>
          {canEdit && (
            <button
              onClick={() =>
                setAnnotations((values) =>
                  values.filter((value) => value.annotation_id !== annotation.annotation_id),
                )
              }
            >
              Delete
            </button>
          )}
        </div>
      ))}

      {selected && (
        <p>
          Selected: <code>{selected.annotation_id}</code> · {selected.class}
        </p>
      )}
    </section>
  );
}

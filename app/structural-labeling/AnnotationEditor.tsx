"use client";

import { useEffect, useRef, useState } from "react";
import {
  applyAffine,
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
import { labelingApi } from "./client";
import PrivateSourceCanvas from "./PrivateSourceCanvas";

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

const VALIDATION_MESSAGES: Record<string, string> = {
  "bbox-must-have-positive-area":
    "Annotation box must have positive width and height.",
  "bbox-must-be-within-effective-page-bounds":
    "Annotation box must stay within the PDF page bounds.",
  "bbox-and-page-values-must-be-finite":
    "Annotation and page coordinates must be finite numbers.",
};

function explainValidation(code: string) {
  return VALIDATION_MESSAGES[code]
    ? `${VALIDATION_MESSAGES[code]} (${code})`
    : code;
}

function isTransformMetadata(value: unknown): value is TransformMetadata {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<TransformMetadata>;
  return (
    item.coordinate_space === "source-page" &&
    item.unit === "pdf-point" &&
    item.transform_validation_state === "validated" &&
    typeof item.raster_width_px === "number" &&
    typeof item.raster_height_px === "number" &&
    typeof item.effective_page_width_pt === "number" &&
    typeof item.effective_page_height_pt === "number" &&
    Array.isArray(item.source_page_to_raster_affine) &&
    Array.isArray(item.raster_to_source_page_affine)
  );
}

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
  const candidateTransform = isTransformMetadata(candidate.transform_metadata)
    ? candidate.transform_metadata
    : null;
  const rawTransform = latest?.transform_metadata ?? candidateTransform;

  const [annotations, setAnnotations] = useState<Annotation[]>(
    latest?.annotations ?? [],
  );
  const [currentClass, setCurrentClass] = useState<LabelClass>("column");
  const [zoom, setZoom] = useState(1);
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [hostWidth, setHostWidth] = useState(0);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAnnotations(latest?.annotations ?? []);
  }, [latest?.revision_no]);

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return;
    const update = () => setHostWidth(node.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (!rawTransform || rawTransform.transform_validation_state !== "validated") {
    return (
      <p>
        Pixel-only or unvalidated source. Labeling and GPT-7 handoff are blocked
        until a reversible PDF-point transform is validated.
      </p>
    );
  }

  const transform: TransformMetadata = rawTransform;
  const rasterWidth = Math.max(1, transform.raster_width_px);
  const rasterHeight = Math.max(1, transform.raster_height_px);
  const fitScale = hostWidth > 0 ? Math.min(1, hostWidth / rasterWidth) : 1;
  const displayScale = Math.max(0.05, fitScale * zoom);
  const displayWidth = rasterWidth * displayScale;
  const displayHeight = rasterHeight * displayScale;

  function rasterPoint(
    event: React.PointerEvent<HTMLDivElement>,
  ): { x: number; y: number } {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / displayScale,
      y: (event.clientY - rect.top) / displayScale,
    };
  }

  function finish(event: React.PointerEvent<HTMLDivElement>) {
    if (!canEdit || !start) return;
    const end = rasterPoint(event);
    const raster: PdfPointBBox = {
      xmin: Math.min(start.x, end.x),
      ymin: Math.min(start.y, end.y),
      xmax: Math.max(start.x, end.x),
      ymax: Math.max(start.y, end.y),
    };

    const bbox = rasterBBoxToSourcePage(raster, transform);
    const errors = validateBBox(
      bbox,
      transform.effective_page_width_pt,
      transform.effective_page_height_pt,
    );

    if (errors.length) {
      onMessage(errors.map(explainValidation).join(" "));
    } else {
      setAnnotations((values) => [
        ...values,
        {
          annotation_id: crypto.randomUUID(),
          class: currentClass,
          bbox,
          annotation_spec_version: "v0.2",
          flags: {},
        },
      ]);
    }
    setStart(null);
  }

  async function save() {
    try {
      validateRoundTrip(transform, 0.01);
      const errors = annotations.flatMap((annotation) =>
        validateBBox(
          annotation.bbox,
          transform.effective_page_width_pt,
          transform.effective_page_height_pt,
        ).map(
          (error) =>
            `${annotation.annotation_id}: ${explainValidation(error)}`,
        ),
      );
      if (errors.length) throw new Error(errors.join(" "));

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
      const message =
        error instanceof Error ? error.message : "Save failed";
      onMessage(message);
    }
  }

  return (
    <section>
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
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
        <button
          onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}
        >
          -
        </button>
        <span>{Math.round(displayScale * 100)}%</span>
        <button
          onClick={() => setZoom((value) => Math.min(3, value + 0.25))}
        >
          +
        </button>
        <button onClick={() => setZoom(1)}>Fit width</button>
        {canEdit && <button onClick={() => void save()}>Save revision</button>}
      </div>

      <p>
        Authoritative annotations are source-page PDF points mapped
        deterministically through display to raster to source-page.
      </p>

      <div ref={hostRef} style={{ width: "100%", minWidth: 0 }}>
        <div
          style={{
            overflow: "auto",
            maxHeight: "70vh",
            border: "1px solid #bbb",
            marginTop: 12,
            width: "100%",
            background: "#f4f4f4",
          }}
        >
          <div
            onPointerDown={(event) => {
              if (canEdit) setStart(rasterPoint(event));
            }}
            onPointerUp={finish}
            onPointerCancel={() => setStart(null)}
            style={{
              position: "relative",
              width: displayWidth,
              height: displayHeight,
              touchAction: "none",
              background: "#fff",
            }}
          >
            <PrivateSourceCanvas
              candidateId={candidate.id}
              pageIndex={candidate.page_index}
              transform={transform}
              displayWidth={displayWidth}
              displayHeight={displayHeight}
              onError={onMessage}
            />

            {annotations.map((annotation) => {
              const a = applyAffine(
                transform.source_page_to_raster_affine,
                {
                  x: annotation.bbox.xmin,
                  y: annotation.bbox.ymin,
                },
              );
              const b = applyAffine(
                transform.source_page_to_raster_affine,
                {
                  x: annotation.bbox.xmax,
                  y: annotation.bbox.ymax,
                },
              );

              return (
                <div
                  key={annotation.annotation_id}
                  style={{
                    position: "absolute",
                    left: Math.min(a.x, b.x) * displayScale,
                    top: Math.min(a.y, b.y) * displayScale,
                    width: Math.abs(b.x - a.x) * displayScale,
                    height: Math.abs(b.y - a.y) * displayScale,
                    border: "2px solid",
                    pointerEvents: "none",
                  }}
                >
                  <span style={{ background: "white" }}>{annotation.class}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <h3>Annotations</h3>
      {annotations.length === 0 && <p>No annotations yet.</p>}
      {annotations.map((annotation, index) => (
        <div
          key={annotation.annotation_id}
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 6,
            flexWrap: "wrap",
          }}
        >
          <select
            disabled={!canEdit}
            value={annotation.class}
            onChange={(event) =>
              setAnnotations((values) =>
                values.map((value, i) =>
                  i === index
                    ? {
                        ...value,
                        class: event.target.value as LabelClass,
                      }
                    : value,
                ),
              )
            }
          >
            {LABEL_CLASSES.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
          {canEdit && (
            <button
              onClick={() =>
                setAnnotations((values) =>
                  values.filter((_, i) => i !== index),
                )
              }
            >
              Delete
            </button>
          )}
        </div>
      ))}
    </section>
  );
}

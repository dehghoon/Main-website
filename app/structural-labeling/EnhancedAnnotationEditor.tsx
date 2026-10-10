"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as PE } from "react";
import { applyAffine, rasterBBoxToSourcePage, validateRoundTrip } from "../../lib/structural-labeling/coordinates";
import { LABEL_CLASSES, validateBBox, type Annotation, type LabelClass, type PdfPointBBox, type TransformMetadata } from "../../lib/structural-labeling/contract";
import { labelingApi } from "./client";
import PrivateSourceCanvas from "./PrivateSourceCanvas";

type C = { id: string; page_index: number | null; workflow_state: string; transform_metadata: unknown };
type R = { annotations: Annotation[]; transform_metadata: TransformMetadata; revision_no: number; revision_kind: string };
type ToolMode = "draw" | "select";

const COLORS: Record<LabelClass, { s: string; f: string }> = {
  column: { s: "#2563eb", f: "rgba(37,99,235,.12)" },
  beam: { s: "#d97706", f: "rgba(217,119,6,.12)" },
  wall: { s: "#dc2626", f: "rgba(220,38,38,.12)" },
};
const MSG: Record<string, string> = {
  "bbox-must-have-positive-area": "Annotation box must have positive width and height.",
  "bbox-must-be-within-effective-page-bounds": "Annotation box must stay within the PDF page bounds.",
  "bbox-and-page-values-must-be-finite": "Annotation and page coordinates must be finite numbers.",
};
const explain = (x: string) => MSG[x] ? `${MSG[x]} (${x})` : x;
const copy = (items: Annotation[]) => items.map((x) => ({ ...x, bbox: { ...x.bbox }, flags: { ...x.flags } }));

function isTransform(value: unknown): value is TransformMetadata {
  if (!value || typeof value !== "object") return false;
  const x = value as Partial<TransformMetadata>;
  return x.coordinate_space === "source-page" &&
    x.unit === "pdf-point" &&
    x.transform_validation_state === "validated" &&
    typeof x.raster_width_px === "number" &&
    typeof x.raster_height_px === "number" &&
    typeof x.effective_page_width_pt === "number" &&
    typeof x.effective_page_height_pt === "number" &&
    Array.isArray(x.source_page_to_raster_affine) &&
    Array.isArray(x.raster_to_source_page_affine);
}

export default function EnhancedAnnotationEditor({
  candidate, revisions, canEdit, onSaved, onMessage,
}: {
  candidate: C;
  revisions: R[];
  canEdit: boolean;
  onSaved: () => void;
  onMessage: (message: string) => void;
}) {
  const latest = revisions.at(-1);
  const candidateTransform = isTransform(candidate.transform_metadata) ? candidate.transform_metadata : null;
  const transform = latest?.transform_metadata ?? candidateTransform;
  const [annotations, setAnnotations] = useState<Annotation[]>(copy(latest?.annotations ?? []));
  const [undo, setUndo] = useState<Annotation[][]>([]);
  const [redo, setRedo] = useState<Annotation[][]>([]);
  const [labelClass, setLabelClass] = useState<LabelClass>("column");
  const [tool, setTool] = useState<ToolMode>("draw");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [hostWidth, setHostWidth] = useState(0);
  const [full, setFull] = useState(false);
  const root = useRef<HTMLElement>(null);
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAnnotations(copy(latest?.annotations ?? []));
    setUndo([]);
    setRedo([]);
    setSelectedId(null);
    setTool("draw");
  }, [latest?.revision_no, candidate.id]);

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const update = () => setHostWidth(node.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const update = () => setFull(document.fullscreenElement === root.current);
    document.addEventListener("fulscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  if (!transform || transform.transform_validation_state !== "validated") {
    return <p>Pixel-only or unvalidated source. Labeling and GPT-7 handoff are blocked until a reversible PDF-point transform is validated.</p>;
  }

  const rw = Math.max(1, transform.raster_width_px);
  const rh = Math.max(1, transform.raster_height_px);
  const fit = hostWidth ? Math.min(1, hostWidth / rw) : 1;
  const scale = Math.max(.01, fit * (zoom / 100));
  const displayWidth = rw * scale;
  const displayHeight = rh * scale;

  const commit = (next: Annotation[]) => {
    setUndo((items) => [...items, copy(annotations)].slice(-100));
    setRedo([]);
    setAnnotations(copy(next));
    if (selectedId && !next.some((item) => item.annotation_id === selectedId)) setSelectedId(null);
  };

  const doUndo = () => setUndo((items) => {
    const previous = items.at(-1);
    if (!previous) return items;
    setRedo((next) => [copy(annotations), ...next].slice(0, 100));
    setAnnotations(copy(previous));
    setSelectedId(null);
    return items.slice(0, -1);
  });

  const doRedo = () => setRedo((items) => {
    const next = items[0];
    if (!next) return items;
    setUndo((previous) => [...previous, copy(annotations)].slice(-100));
    setAnnotations(copy(next));
    setSelectedId(null);
    return items.slice(1);
  });

  const point = (event: PE<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / scale, y: (event.clientY - rect.top) / scale };
  };

  const finish = (event: PE>HTMLDivElement>) => {
    if (!canEdit || tool !== "draw" || !start) return;
    const end = point(event);
    const rasterBBox: PdfPointBBox = {
      xmin: Math.min(start.x, end.x), ymin: Math.min(start.y, end.y),
      xmax: Math.max(start.x, end.x), ymax: Math.max(start.y, end.y),
    };
    const bbox = rasterBBoxToSourcePage(rasterBBox, transform);
    const errors = validateBBox(bbox, transform.effective_page_width_pt, transform.effective_page_height_pt);
    if (errors.length) onMessage(errors.map(explain).join(" "));
    else commit([...annotations, { annotation_id: crypto.randomUUID(), class: labelClass, bbox, annotation_spec_version: "v0.2", flags: {} }]);
    setStart(null);
  };

  const deleteSelected = () => {
    if (!canEdit || !selectedId) return;
    commit(annotations.filter((item) => item.annotation_id !== selectedId));
    setSelectedId(null);
  };

  const save = async () => {
    try {
      validateRoundTrip(transform, .01);
      const errors = annotations.flatMap((item) =>
        validateBBox(item.bbox, transform.effective_page_width_pt, transform.effective_page_height_pt)
          .map((error) => `${item.annotation_id}: ${explain(error)}`));
      if (errors.length) throw new Error(errors.join(" "));
      await labelingApi("/api/structural-labeling/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: candidate.id, action: "save-revision", annotations, transform }),
      });
      onMessage("Annotation revision saved.");
      onSaved();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Save failed");
    }
  };

  const toggle = async () => {
    try {
      if (document.fullscreenElement === root.current) await document.exitFullscreen();
      else await root.current?.requestFullscreen();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Fullscreen mode failed");
    }
  };

  return <section ref={root} style={{ width: "100%", minHeight: full ? "100vh" : "88vh", background: "#fff", padding: full ? 12 : 0, boxSizing: "border-box", overflow: "hidden" }}>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", position: "sticky", top: 0, zIndex: 20, background: "#fff", padding: "10px 0", borderBottom: "1px solid #e2e8f0" }}>
      <strong>Label:</strong>
      {LABEL_CLASSES.map((item) => <button key={item} disabled={!canEdit} aria-pressed={tool === "draw" && labelClass === item} onClick={() => { setLabelClass(item); setTool("draw"); setSelectedId(null); }} style={{ border: `2px solid ${COLORS[item].s}`, background: tool === "draw" && labelClass === item ? COLORS[item].f : "#fff", borderRadius: 7, padding: "6px 10px" }}>{item}</button>)}
      <span aria-hidden="true" style={{ width: 1, height: 28, background: "#cbd5e1" }} />
      <button disabled={!canEdit} aria-pressed={tool === "select"} onClick={() => { setTool(tool === "select" ? "draw" : "select"); setStart(null); }}>{tool === "select" ? "Exit select" : "Select"}</button>
      <button disabled={!canEdit || !selectedId} onClick={deleteSelected}>Delete selected</button>
      <button onClick={() => setZoom((value) => Math.max(10, value - 10))} disabled={zoom <= 10}>−</button>
      <input aria-label="Zoom percentage" type="range" min={10} max={150} step={10} value={zoom} onChange={(event) => setZoom(+event.target.value)} />
      <strong>{zoom}%</strong>
      <button onClick={() => setZoom((value) => Math.min(150, value + 10))} disabled={zoom >= 150}>+</button>
      <button onClick={() => setZoom(100)}>Fit width</button>
      <button disabled={!canEdit || !undo.length} onClick={doUndo}>Undo</button>
      <button disabled={!canEdit || !redo.length} onClick={doRedo}>Redo</button>
      <button onClick={() => void toggle()}>{full ? "Exit full screen" : "Full screen"}</button>
      {canEdit && <button onClick={() => void save()}>Save revision</button>}
    </div>

    <p style={{ margin: "8px 0" }}>
      {tool === "select" ? "Select mode: click a label box to select it, then use Delete selected. " : "Draw mode: choose a label class and drag a box. "}
      Zoom is display-only. Saved geometry remains authoritative source-page PDF points.
    </p>

    <div ref={host} style={{ width: "100%", height: full ? "calc(100vh - 150px)" : "72vh", minHeight: 520, overflow: "auto", border: !1px solid #94a3b8", background: "#e2e8f0" }}>
      <div
        onPointerDown={(event) => {
          if (canEdit && tool === "draw") setStart(point(event));
          else if (tool === "select" && event.target === event.currentTarget) setSelectedId(null);
        }}
        onPointerUp={finish}
        onPointerCancel={() => setStart(null)}
        style={{ position: "relative", width: displayWidth, height: displayHeight, touchAction: "none", background: "#fff", margin: "0 auto", cursor: tool === "select" ? "default" : "crosshair" }}
      >
        <PrivateSourceCanvas candidateId={candidate.id} pageIndex={candidate.page_index} transform={transform} displayWidth={displayWidth} displayHeight={displayHeight} onError={onMessage} />
        {annotations.map((item) => {
          const p = applyAffine(transform.source_page_to_raster_affine, { x: item.bbox.xmin, y: item.bbox.ymin });
          const q = applyAffine(transform.source_page_to_raster_affine, { x: item.bbox.xmax, y: item.bbox.ymax });
          const color = COLORS[item.class];
          const selected = selectedId === item.annotation_id;
          return <div
            key={item.annotation_id}
            role={tool === "select" ? "button" : undefined}
            tabIndex={tool === "select" ? 0 : undefined}
            aria-label={tool === "select" ? `Select ${item.class} annotation` : undefined}
            onClick={(event) => { if (tool === "select") { event.stopPropagation(); setSelectedId(item.annotation_id); } }}
            onKeyDown={(event) => { if (tool === "select" && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); setSelectedId(item.annotation_id); } }}
            style={{ position: "absolute", left: Math.min(p.x, q.x) * scale, top: Math.min(p.y, q.y) * scale, width: Math.abs(q.x - p.x) * scale, height: Math.abs(q.y - p.y) * scale, border: `${selected ? 5 : 3}px solid ${color.s}`, boxShadow: selected ? "0 0 0 2px #111" : undefined, background: color.f, pointerEvents: tool === "select" ? "auto" : "none", cursor: tool === "select" ? "pointer" : "default", boxSizing: "border-box" }}
          ><span style={{ background: color.s, color: "#fff", padding: "2px 5px", fontSize: 12 }}>{item.class}</span></div>;
        })}
      </div>
    </div>

    <h3>Annotations ({annotations.length})</h3>
    {!annotations.length && <p>No annotations yet.</p>}
    <div style={{ display: "grid", gap: 6 }}>
      {annotations.map((item, index) => {
        const color = COLORS[item.class];
        const selected = selectedId === item.annotation_id;
        return <div key={item.annotation_id} onClick={() => tool === "select" && setSelectedId(item.annotation_id)} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", borderLeft: `5px solid ${color.s}`, outline: selected ? "2px solid #111" : undefined, background: color.f, padding: "7px 9px", borderRadius: 6 }}>
          <strong>#{index + 1}</strong>
          <select disabled={!canEdit} value={item.class} onChange={(event) => commit(annotations.map((value, itemIndex) => itemIndex === index ? { ...value, class: event.target.value as LabelClass } : value))}>
            {LABEL_CLASSES.map((value) => <option key={value}>{value}</option>)}
          </select>
          {canEdit && <button onClick={(event) => { event.stopPropagation(); commit(annotations.filter((_, itemIndex) => itemIndex !== index)); }}>Delete label</button>}
        </div>;
      })}
    </div>
  </section>;
}

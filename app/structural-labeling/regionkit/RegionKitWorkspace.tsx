"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LABEL_CLASSES,
  type Annotation,
  type LabelClass,
  type PdfPointBBox,
  type TransformMetadata,
} from "../../../lib/structural-labeling/contract";
import {
  rasterBBoxToSourcePage,
  validateRoundTrip,
} from "../../../lib/structural-labeling/coordinates";
import { labelingAccessToken, labelingApi } from "../client";

type Candidate = {
  id: string;
  workflow_state: string;
  page_index: number | null;
  page_id: string | null;
  original_filename: string | null;
  source_ref: string;
  source_sha256: string;
  transform_metadata: TransformMetadata | null;
};

type CandidateDetail = {
  candidate: Candidate;
  revisions: Array<{
    annotations: Annotation[];
    transform_metadata: TransformMetadata;
    revision_no: number;
    revision_kind: string;
  }>;
};

type RegionKitRectangle = {
  id?: string;
  type?: string;
  visibility?: boolean;
  label?: string;
  data?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
};

type RegionKitNativeExport = {
  annotations?: RegionKitRectangle[];
};

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseRegionKitAnnotations(
  value: RegionKitNativeExport,
  transform: TransformMetadata,
): Annotation[] {
  if (transform.transform_validation_state !== "validated") {
    throw new Error(
      "This candidate does not have a validated raster-to-source-page transform. RegionKit JSON may be reviewed, but authoritative GPT-7 export remains blocked.",
    );
  }

  validateRoundTrip(transform, 0.01);

  if (!Array.isArray(value.annotations)) {
    throw new Erro

"invalid RegionKit NativeExport");
  }

  return value.annotations
    .filter((annotation) => annotation.visibility !== false)
    .map((annotation, index) => {
      if (annotation.type !== "rectangle") {
        throw new Error(
          `Annotation ${index + 1} uses unsupported shape "${annotation.type ?? "unknown"}". Only rectangles are accepted.`,
        );
      }

      const label = annotation.label;
      if (!LABEL_CLASSES.includes(label as LabelClass)) {
        throw new Error(
          `Annotation ${index + 1} has invalid class "${label ?? ""}". Allowed classes: ${LABEL_CLASSES.join(", ")}.`,
        );
      }

      const data = annotation.data;
      if (
        !data ||
        !finite(data.x) ||
        !finite(data.y) ||
        !finite(data.width) ||
        !finite(data.height) ||
        data.width <= 0 ||
        data.height <= 0
      ) {
        throw new Error(`Annotation ${index + 1} has invalid rectangle geometry.`);
      }

      const rasterBBox: PdfPointBBox = {
        xmin: data.x,
        ymin: data.y,
       xmax: data.x + data.width,
        ymax: data.y + data.height,
      };
      const bbox = rasterBBoxToSourcePage(rasterBBox, transform);

      return {
        annotation_id:
          typeof annotation.id === "string" && annotation.id.trim()
            ? annotation.id
            : crypto.randomUUID(),
        class: label as LabelClass,
        bbox,
        annotation_spec_version: "v0.2",
        flags: {},
      };
    });
}

async function downloadPrivateSource(candidate: Candidate) {
  const accessToken = await labelingAccessToken();
  const response = await fetch(`/api/structural-labeling/source/${candidate.id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Private source download failed.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download =
    candidate.original_filename ||
    candidate.page_id ||
    `structural-labeling-${candidate.id}`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function RegionKitWorkspace() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CandidateDetail | null>(null);
  const [imported, setImported] = useState<Annotation[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const has = useCallback(
    (permission: string) => permissions.includes(permission),
    [permissions],
  );

  const refreshQueue = useCallback(async () => {
    const body = await labelingApi("/api/structural-labeling/candidates");
    setPermissions(body.permissions ?? []);
    setCandidates(body.candidates ?? []);
  }, []);

  const refreshDetail = useCallback(async (id: string) => {
    setDetail(await labelingApi(`/api/structural-labeling/candidates/${id}`));
  }, []);

  useEffect(() => {
    void refreshQueue().catch((error) =>
      setMessage(error instanceof Error ? error.messae : "Queue load failed."),
  );
  }, [refreshQueue]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setImported([]);
      return;
    }
    void refreshDetail(selectedId).catch((error) =>
      setMessage(error instanceof Error ? error.message : "Candidate load failed."),
    );
  }, [selectedId, refreshDetail]);

  const selected = useMemo(
    () => candidates.find((candidate) => candidate.id === selectedId) ?? null,
    [candidates, selectedId],
  );

  const transform =
    detail?.revisions.at(-1)?.transform_metadata ??
    selected?.transform_metadata ??
    null;

  async function transition(action: string) {
    if (!selectedId) return;
    setBusy(true);
    try {
      await labelingApi("/api/structural-labeling/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: selectedId, action }),
      });
      await Promise.all([refreshQueue(), refreshDetail(selectedId)]);
      setMessage(`Action completed: ${action}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  async function importJson(file: File) {
    if (!transform) {
      setMessage("Candidate transform metadata is unavailable.");
      return;
    }
    try {
      const parsed = JSON.parse(await file.text()) as RegionKitNativeExport;
      const annotations = parseRegionKitAnnotations(parsed, transform);
      setImported(annotations);
      setMessage(
        `${annotations.length} RegionKit rectangle annotations validated and converted to source-page PDF points.`,
      );
    } catch (error) {
      setImported([]);
      setMessage(error instanceof Error ? error.message : "RegionKit JSON import failed.");
    }
  }

  async function saveRevision() {
    if (!selectedId || !transform || imported.length === 0) return;
    setBusy(true);
    try {
      await labelingApi("/api/structural-labeling/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: selectedId,
          action: "save-revision",
          annotations: imported,
          transform,
          notes: "Imported from RegionKit NativeExport after manual labeling.",
        }),
      });
      await refreshDetail(selectedId);
      setMessage("RegionKit annotations saved as a Website revision.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Revision save failed.");
    } finally {
      setBusy(false);
  }

  const state = selected?.workflow_state;
  const employeeCanLabel = has("labeling.annotate");
  const ownerCanReview = has("labeling.owner_review") && !employeeCanLabel;

  return (
    <main style={{ maxWidth: 1440, margin: "0 auto", padding: "32px 20px 80px" }}>
      <header>
        <p style={{ textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 700 }}>
          Manual labeling
        </p>
        <h1>RegionKit Handoff</h1>
        <p>
          RegionKit is the drawing/review surface. LinkoTech keeps the private source,
          canonical PDF-point revision, audit state, and the pinned GPT-7 contract boundary.
        </p>
        <p>
          RegionKit published scenes are not used for private drawings because published
          scenes are readable without authentication.
        </p>
        {message && <p role="status">{message}</p>}
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(260px,360px) minmax(0,1fr)", gap: 20 }}>
        <aside>
          <h2>Candidate Queue</h2>
          <button onClick={() => void refreshQueue()}>Refresh Queue</button>
          {candidates.map((candidate) => (
            <button
              key={candidate.id}
              onClick={() => setSelectedId(candidate.id)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: 12,
                marginTop: 8,
                border: selectedId === candidate.id ? "2px solid" : "1px solid #bbb",
                borderRadius: 8,
              }}
            >
              <strong>{candidate.original_filename || candidate.page_id || candidate.id}</strong>
              <br />
              <small>
                {candidate.workflow_state}
                {candidate.page_index !== null ? ` · page ${candidate.page_index + 1}` : ""}
              </small>
            </button>
          ))}
        </aside>

        <article>
          {!selected && <p>Select a candidate.</p>}
          {selected && (
            <>
              <h2>{selected.original_filename || selected.page_id}</h2>
              <p><strong>Status:</strong> {selected.workflow_state}</p>
              <p><strong>SHA-256:</strong> <code>{selected.source_sha256}</code></p>
              <p>
                <strong>Transform:</strong>{" "}
                {transform?.transform_validation_state ?? "missing"}
              </p>

              {(state === "suitable-for-labeling" || state === "revision-required") &&
                employeeCanLabel && (
                  <button disabled={busy} onClick={() => void transition("start-labeling")}>
                    Start / Resume Labeling
                  </button>
                )}

              {(state === "labeling-in-progress" || state === "submitted-for-owner-qa") && (
                <section style={{ marginTop: 20, borderTop: "1px solid #bbb", paddingTop: 16 }}>
                  <h3>1. Open the private drawing in RegionKit</h3>
                  <p>
                    Download the authenticated source, then open RegionKit and load that local
                    file. The source is not published by LinkoTech.
                  </p>
                  <button disabled={busy} onClick={() => void downloadPrivateSource(selected).catch((error) => setMessage(error.message))}>
                    Download Private Source
                  </button>{" "}
                  <button
                    onClick={() =>
                      window.open("https://editor.regionkit.app", "_blank", "noopener,noreferrer")
                    }
                  >
                    Open RegionKit
                  </button>

                  <h3 style={{ marginTop: 24 }}>2. Import RegionKit Native JSON</h3>
                  <p>
                    Use rectangles only and labels exactly <code>column</code>, <code>beam</code>,
                    or <code>wall</code>. The adapter performs only class/shape checks and the
                    deterministic raster-to-source-page conversion required by GPT-7.
                  </p>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void importJson(file);
                    }}
                  />
                  <p>{imported.length} validated annotations ready.</p>

                  {state === "labeling-in-progress" && employeeCanLabel && (
                    <>
                      <button disabled={busy || imported.length === 0} onClick={() => void saveRevision()}>
                        Save RegionKit Revision
                      </button>{" "}
                      <button disabled={busy} onClick={() => void transition("submit-owner-qa")}>
                        Submit for Visual QA
                      </button>
                    </>
                  )}

                  {state === "submitted-for-owner-qa" && ownerCanReview && (
                    <section style={{ marginTop: 20 }}>
                      <h3>3. Visual QA</h3>
                      <p>
                        Review the drawing and labels in RegionKit. Approval below records the
                        Owner disposition required by the pinned GPT-7 intake contract; it does
                        not perform a second semantic QA engine.
                      </p>
                      {imported.length > 0 && (
                        <button disabled={busy} onClick={() => void saveRevision()}>
                          Save Owner Adjudication Revision
                        </button>
                      )}{" "}
                      <button disabled={busy} onClick={() => void transition("request-revision")}>
                        Request Revision
                      </button>
                    </section>
                  )}
                </section>
              )}

              {state === "owner-approved" && (
                <section style={{ marginTop: 20 }}>
                  <h3>GPT-7 Handoff Gate</h3>
                  <p>
                    Owner visual QA is recorded. This state is still not dataset admission or
                    training readiness. GPT-7 alone controls admission.
                  </p>
                  {has("labeling.gpt7_export") && (
                    <a href={`/api/structural-labeling/export/${selected.id}`}>
                      Generate GPT-7 Intake Package
                    </a>
                  )}
                </section>
              )}
            </>
          )}
        </article>
      </section>
    </main>
  );
}

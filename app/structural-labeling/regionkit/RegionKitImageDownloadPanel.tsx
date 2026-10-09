"use client";

import { useEffect, useMemo, useState } from "react";
import type { TransformMetadata } from "../../../lib/structural-labeling/contract";
import { labelingApi } from "../client";
import { downloadRegionKitImage } from "./regionkit-image";

const REGIONKIT_URL = "https://editor.regionkit.app";

type Candidate = {
  id: string;
  workflow_state: string;
  page_index: number | null;
  page_id: string | null;
  original_filename: string | null;
  transform_metadata: TransformMetadata | null;
};

const ELIGIBLE_STATES = new Set([
  "suitable-for-labeling",
  "revision-required",
  "labeling-in-progress",
]);

export default function RegionKitImageDownloadPanel() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void labelingApi("/api/structural-labeling/candidates")
      .then((body) => {
        setCandidates(body.candidates ?? []);
        setPermissions(body.permissions ?? []);
      })
      .catch((error) =>
        setMessage(
          error instanceof Error
            ? error.message
            : "RegionKit image candidates could not be loaded.",
        ),
      );
  }, []);

  const available = useMemo(
    () =>
      candidates.filter(
        (candidate) =>
          ELIGIBLE_STATES.has(candidate.workflow_state) &&
          candidate.transform_metadata?.transform_validation_state === "validated",
      ),
    [candidates],
  );

  if (!permissions.includes("labeling.annotate")) {
    return null;
  }

  return (
    <section
      style={{
        maxWidth: 1440,
        margin: "0 auto 20px",
        padding: "20px",
        border: "1px solid #cbd5e1",
        borderRadius: 12,
        background: "#fff",
      }}
    >
      <h2 style={{ marginTop: 0 }}>RegionKit Image Preparation</h2>
      <p>
        RegionKit uses an image for manual labeling. Download the controlled PNG
        generated from the validated source transform. The original private source
        remains unchanged in LinkoTech.
      </p>

      {message && <p role="status">{message}</p>}

      {available.length === 0 ? (
        <p>No validated candidates are currently ready for RegionKit image export.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {available.map((candidate) => (
            <div
              key={candidate.id}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                padding: 12,
                border: "1px solid #e2e8f0",
                borderRadius: 10,
              }}
            >
              <div>
                <strong>
                  {candidate.original_filename ||
                    candidate.page_id ||
                    candidate.id}
                </strong>
                <div style={{ fontSize: 14, color: "#64748b" }}>
                  {candidate.workflow_state}
                  {candidate.page_index !== null
                    ? ` · page ${candidate.page_index + 1}`
                    : ""}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  disabled={busyId === candidate.id}
                  onClick={() => {
                    if (!candidate.transform_metadata) return;
                    setBusyId(candidate.id);
                    setMessage("");
                    void downloadRegionKitImage(
                      candidate,
                      candidate.transform_metadata,
                    )
                      .then(() =>
                        setMessage(
                          "Validated RegionKit PNG downloaded. Load this PNG in RegionKit.",
                        ),
                      )
                      .catch((error) =>
                        setMessage(
                          error instanceof Error
                            ? error.message
                            : "RegionKit PNG download failed.",
                        ),
                      )
                      .finally(() => setBusyId(null));
                  }}
                >
                  {busyId === candidate.id
                    ? "Preparing PNG..."
                    : "Download RegionKit PNG"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      REGIONKIT_URL,
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                >
                  Open RegionKit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

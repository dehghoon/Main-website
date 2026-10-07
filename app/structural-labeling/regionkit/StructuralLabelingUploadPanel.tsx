"use client";

import { useEffect, useState } from "react";
import { labelingAccessToken, labelingApi } from "../client";

type QueueResponse = {
  permissions?: string[];
  candidates?: unknown[];
};

type UploadResponse = {
  candidateIds?: string[];
  pageCount?: number;
  transformStates?: string[];
  error?: string;
};

export default function StructuralLabelingUploadPanel() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [projectGroupId, setProjectGroupId] = useState("manual-labeling");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void labelingApi<QueueResponse>("/api/structural-labeling/candidates")
      .then((body) => setPermissions(body.permissions ?? []))
      .catch((error) =>
        setMessage(
          error instanceof Error ? error.message : "Permission load failed.",
        ),
      );
  }, []);

  const hasUpload = permissions.includes("labeling.upload");

  async function uploadSource() {
    if (!file) return;
    if (!projectGroupId.trim()) {
      setMessage("Project group is required.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const accessToken = await labelingAccessToken();
      const form = new FormData();
      form.append("file", file);
      form.append("projectGroupId", projectGroupId.trim());

      const response = await fetch("/api/structural-labeling/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      });
      const body = (await response.json().catch(() => ({}))) as UploadResponse;
      if (!response.ok) {
        throw new Error(body.error ?? `Upload failed: ${response.status}`);
      }

      const created = body.candidateIds?.length ?? 0;
      setMessage(
        `Upload complete. ${body.pageCount ?? created} page(s) processed and ${created} candidate(s) created. Refreshing the queue.`,
      );
      setFile(null);
      setTimeout(() => window.location.reload(), 600);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Source upload failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-label="Create Structural Labeling candidates"
      style={{
        maxWidth: 1440,
        margin: "0 auto 24px",
        padding: "0 20p",
      }}
    >
      <div
        style={{
          border: "1px solid #d1d5db",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Add the first labeling source</h2>
        <p>
          The queue shows only sources that already exist in the production Structural Labeling
          database. Upload a PDF or supported image here to create the candidate rows before RegionKit
          labeling.
        </p>

        <label style={{ display: "block" }}>
          Project group
          <input
            value={projectGroupId}
            onChange={(event) => setProjectGroupId(event.target.value)}
            disabled={busy || !hasUpload}
            style={{ display: "block", marginTop: 6, marginBottom: 12 }}
          />
        </label>

        <label style={{ display: "block" }}>
          Source file
          <input
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp,.pdf,.png,.jpg,.jpeg,.webp"
            disabled={busy || !hasUpload}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            style={{ display: "block", marginTop: 6, marginBottom: 12 }}
          />
        </label>

        {hasUpload ? (
          <button disabled={busy || !file} onClick={() => void uploadSource()}>
            {busy ? "Uploading …" : "Upload and Create Candidates"}
          </button>
        ) : (
          <p>
            Your current account does not have <code>labeling.upload</code> permission. The queu can
            be read, but a new source cannot be created until that permission is granted.
          </p>
        )}

        {message && <p role="status">{message}</p>}
      </div>
    </section>
  );
}

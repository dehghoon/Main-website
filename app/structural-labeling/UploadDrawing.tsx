"use client";

import { useMemo, useState } from "react";
import { labelingApi } from "./client";

type UploadResult = {
  pageCount: number;
  transformStates: string[];
};

export default function UploadDrawing({
  onDone,
  onMessage,
}: {
  onDone: () => void;
  onMessage: (value: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const totalSize = useMemo(
    () => files.reduce((sum, file) => sum + file.size, 0),
    [files],
  );

  function addFiles(nextFiles: File[]) {
    setFiles((current) => {
      const seen = new Set(current.map((file) => `${file.name}:${file.size}:${file.lastModified}`));
      const merged = [...current];
      for (const file of nextFiles) {
        const key = `${file.name}:${file.size}:${file.lastModified}`;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(file);
        }
      }
      return merged;
    });
  }

  function removeFile(index: number) {
    if (busy) return;
    setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function uploadSelected() {
    if (!files.length || busy) return;
    setBusy(true);

    let uploaded = 0;
    let pages = 0;
    let blockedPages = 0;

    try {
      for (const file of files) {
        const form = new FormData();
        form.set("file", file);
        const result = await labelingApi<UploadResult>("/api/structural-labeling/upload", {
          method: "POST",
          body: form,
        });
        uploaded += 1;
        pages += result.pageCount;
        blockedPages += result.transformStates.filter((state) => state !== "validated").length;
      }

      onMessage(
        blockedPages > 0
          ? `${uploaded} drawing(s) uploaded and ${pages} candidate page(s) created. ${blockedPages} page(s) require validated PDF-point mapping before labeling/export.`
          : `${uploaded} drawing(s) uploaded and ${pages} candidate page(s) created with validated geometry.`,
      );
      setFiles([]);
      onDone();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      style={{
        border: "1px solid #cbd5e1",
        borderRadius: 10,
        padding: 12,
        minWidth: 280,
        maxWidth: 720,
        background: "#fff",
      }}
    >
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <label
          style={{
            border: "1px solid #222",
            borderRadius: 8,
            padding: "10px 14px",
            cursor: busy ? "not-allowed" : "pointer",
            opacity: busy ? 0.6 : 1,
          }}
        >
          Add drawings
          <input
            hidden
            multiple
            disabled={busy}
            type="file"
            accept=".pdf,image/png,image/jpeg,image/webp"
            onChange={(event) => {
              addFiles(Array.from(event.target.files ?? []));
              event.currentTarget.value = "";
            }}
          />
        </label>

        <button
          type="button"
          disabled={busy || files.length === 0}
          onClick={() => void uploadSelected()}
        >
          {busy ? "Uploading…" : `Upload selected (${files.length)`}
        </button>

        {files.length > 0 && (
          <button type="button" disabled={busy} onClick={() => setFiles([])}>
            Clear selection
          </button>
        )}
      </div>

      {files.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <strong>Selected drawings</strong>
          <div style={{ marginTop: 6, display: "grid", gap: 6 }}>
            {files.map((file, index) => (
              <div
                key={`${file.name}:${file.size}:${file.lastModified}`}
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  justifyContent: "space-between",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "7px 9px",
                }}
              >
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {file.name}
                </span>
                <button type="button" disabled={busy} onClick={() => removeFile(index)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
          <small style={{ display: "block", marginTop: 6 }}>
            {((totalSize / (1024 * 1024)).toFixed(1)} MB selected
          </small>
        </div>
      )}
    </section>
  );
}

"use client";

import { useMemo, useState } from "react";
import { getSupabase } from "../../lib/supabase-browser";
import {
  STRUCTURAL_LABELING_ALLOWED_MIME_TYPES,
  STRUCTURAL_LABELING_DIRECT_UPLOAD_THRESHOLD_BYTES,
  STRUCTURAL_LABELING_MAX_UPLOAD_BYTES,
} from "../../lib/structural-labeling/upload-config";
import { labelingApi } from "./client";

type UploadResult = {
  pageCount: number;
  transformStates: string[];
};

type DirectInitResult = {
  bucket: string;
  storagePath: string;
  token: string;
};

async function sha256Hex(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function validateFile(file: File) {
  if (!STRUCTURAL_LABELING_ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error(`Unsupported file type: ${file.name}`);
  }
  if (file.size <= 0 || file.size > STRUCTURAL_LABELING_MAX_UPLOAD_BYTES) {
    throw new Error(`File must be between 1 byte and 50 MB: ${file.name}`);
  }
}

async function uploadLargeDrawing(file: File): Promise<UploadResult> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured");

  const sha256 = await sha256Hex(file);
  const init = await labelingApi<DirectInitResult>(
    "/api/structural-labeling/upload/direct",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "init",
        filename: file.name,
        mimeType: file.type,
        byteSize: file.size,
        sha256,
      }),
    },
  );

  const { error: uploadError } = await supabase.storage
    .from(init.bucket)
    .uploadToSignedUrl(init.storagePath, init.token, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) throw new Error(uploadError.message);

  return labelingApi<UploadResult>(
    "/api/structural-labeling/upload/direct",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "complete",
        filename: file.name,
        mimeType: file.type,
        byteSize: file.size,
        sha256,
        storagePath: init.storagePath,
      }),
    },
  );
}

async function uploadSmallDrawing(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.set("file", file);
  return labelingApi<UploadResult>("/api/structural-labeling/upload", {
    method: "POST",
    body: form,
  });
}

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
      const seen = new Set(
        current.map((file) => `${file.name}:${file.size}:${file.lastModified}`),
      );
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
    setFiles((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  async function uploadSelected() {
    if (!files.length || busy) return;
    setBusy(true);

    let uploaded = 0;
    let pages = 0;
    let blockedPages = 0;
    let directUploads = 0;

    try {
      for (const file of files) {
        validateFile(file);
        const useDirectUpload =
          file.size > STRUCTURAL_LABELING_DIRECT_UPLOAD_THRESHOLD_BYTES;

        onMessage(
          useDirectUpload
            ? `Uploading ${file.name} directly to private storage...`
            : `Uploading ${file.name} through the standard API...`,
        );

        const result = useDirectUpload
          ? await uploadLargeDrawing(file)
          : await uploadSmallDrawing(file);

        uploaded += 1;
        pages += result.pageCount;
        blockedPages += result.transformStates.filter(
          (state) => state !== "validated",
        ).length;
        if (useDirectUpload) directUploads += 1;
      }

      const transportNote =
        directUploads > 0
          ? ` ${directUploads} large drawing(s) used secure direct storage upload.`
          : "";

      onMessage(
        blockedPages > 0
          ? `${uploaded} drawing(s) uploaded and ${pages} candidate page(s) created. ${blockedPages} page(s) require validated PDF-point mapping before labeling/export.${transportNote}`
          : `${uploaded} drawing(s) uploaded and ${pages} candidate page(s) created with validated geometry.${transportNote}`,
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
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
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
          {busy ? "Uploading..." : `Upload selected (${files.length})`}
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
                <span
                  style={{
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {file.name}
                  {file.size >
                    STRUCTURAL_LABELING_DIRECT_UPLOAD_THRESHOLD_BYTES && (
                    <small style={{ display: "block" }}>
                      Secure direct upload
                    </small>
                  )}
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => removeFile(index)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <small style={{ display: "block", marginTop: 6 }}>
            {(totalSize / (1024 * 1024)).toFixed(1)} MB selected
          </small>
        </div>
      )}
    </section>
  );
}

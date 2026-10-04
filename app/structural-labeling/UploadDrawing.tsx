"use client";

import { useState } from "react";
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

  async function handle(file: File) {
    setBusy(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const result = await labelingApi<UploadResult>("/api/structural-labeling/upload", {
        method: "POST",
        body: form,
      });
      const blockedPages = result.transformStates.filter((state) => state !== "validated").length;
      onMessage(
        blockedPages > 0
          ? `Source preserved and ${result.pageCount} candidate page(s) created. ${blockedPages} page(s) require validated PDF-point mapping before GPT-7 export. No dataset admission occurred.`
          : `Source preserved and ${result.pageCount} candidate page(s) created with server-validated geometry. No dataset admission occurred.`,
      );
      onDone();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <label style={{ border: "1px solid #222", borderRadius: 8, padding: "10px 14px", cursor: "pointer" }}>
      {busy ? "Uploading…" : "Upload New Drawing"}
      <input
        hidden
        disabled={busy}
        type="file"
        accept=".pdf,image/png,image/jpeg,image/webp"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handle(file);
          event.currentTarget.value = "";
        }}
      />
    </label>
  );
}

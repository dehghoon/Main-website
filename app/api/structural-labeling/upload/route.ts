import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../lib/structural-labeling/server";

const ALLOWED = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);
const MAX_BYTES = 50 * 1024 * 1024;

function safeName(name: string) {
  return name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 180) || "drawing";
}

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAuthenticatedUser(request.headers.get("authorization"));
    const form = await request.formData();
    const value = form.get("file");
    if (!(value instanceof File)) return NextResponse.json({ error: "file_required" }, { status: 400 });
    if (!ALLOWED.has(value.type)) return NextResponse.json({ error: "unsupported_media_type" }, { status: 415 });
    if (value.size <= 0 || value.size > MAX_BYTES) return NextResponse.json({ error: "invalid_file_size" }, { status: 400 });

    const bytes = new Uint8Array(await value.arrayBuffer());
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const filename = safeName(value.name);
    const storagePath = `${sha256}/${filename}`;

    const upload = await supabase.storage.from("structural-labeling-sources").upload(storagePath, bytes, {
      contentType: value.type,
      upsert: false,
    });
    if (upload.error && !/already exists|duplicate/i.test(upload.error.message)) throw new Error(upload.error.message);

    const projectGroupId = String(form.get("projectGroupId") ?? `upload:${sha256}`);
    const parsedPages = JSON.parse(String(form.get("pages") ?? "[]"));
    const pages = Array.isArray(parsedPages) && parsedPages.length
      ? parsedPages
      : [{ pageIndex: 0, pageId: `${sha256}:page:0`, transform: null }];

    const candidateIds: string[] = [];
    for (const page of pages) {
      const pageIndex = Number(page.pageIndex);
      if (!Number.isInteger(pageIndex) || pageIndex < 0) throw new Error("invalid_page_index");
      const { data, error } = await supabase.rpc("labeling_create_candidate", {
        p_hash: sha256,
        p_filename: filename,
        p_mime: value.type,
        p_bytes: value.size,
        p_storage: storagePath,
        p_origin_kind: "website-upload",
        p_origin_ref: `website-upload:${sha256}`,
        p_project_group: projectGroupId,
        p_page_id: String(page.pageId ?? `${sha256}:page:${pageIndex}`),
        p_page_index: pageIndex,
        p_transform: page.transform ?? null,
        p_provenance: { source: "website-upload", sha256, originalFilename: value.name },
        p_historical: {},
      });
      if (error) throw new Error(!error.message);
      candidateIds.push(String(data));
    }

    return NextResponse.json({ sha256, storagePath, candidateIds, datasetAdmission: false, trainingReady: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "upload_failed";
    return NextResponse.json({ error: message }, { status: message.includes("authentication_required") ? 401 : 403 });
  }
}

import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../lib/structural-labeling/server";
import { deriveSourcePages } from "../../../../lib/structural-labeling/source-geometry";
import {
  STRUCTURAL_LABELING_ALLOWED_MIME_TYPES,
  STRUCTURAL_LABELING_MAX_UPLOAD_BYTES,
  STRUCTURAL_LABELING_SOURCE_BUCKET,
  sanitizeStructuralLabelingFilename,
} from "../../../../lib/structural-labeling/upload-config";

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAuthenticatedUser(
      request.headers.get("authorization"),
    );
    const form = await request.formData();
    const value = form.get("file");

    if (!(value instanceof File)) {
      return NextResponse.json({ error: "file_required" }, { status: 400 });
    }

    if (!STRUCTURAL_LABELING_ALLOWED_MIME_TYPES.has(value.type)) {
      return NextResponse.json(
        { error: "unsupported_media_type" },
        { status: 415 },
      );
    }

    if (
      value.size <= 0 ||
      value.size > STRUCTURAL_LABELING_MAX_UPLOAD_BYTES
    ) {
      return NextResponse.json(
        { error: "invalid_file_size" },
        { status: 400 },
      );
    }

    const bytes = new Uint8Array(await value.arrayBuffer());
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const filename = sanitizeStructuralLabelingFilename(value.name);
    const storagePath = `${sha256}/${filename}`;
    const pages = await deriveSourcePages(bytes, value.type, sha256);
    const projectGroupId = String(
      form.get("projectGroupId") ?? `upload:${sha256}`,
    );

    if (!projectGroupId.trim()) {
      return NextResponse.json(
        { error: "project_group_required" },
        { status: 400 },
      );
    }

    const upload = await supabase.storage
      .from(STRUCTURAL_LABELING_SOURCE_BUCKET)
      .upload(storagePath, bytes, {
        contentType: value.type,
        upsert: false,
      });

    if (
      upload.error &&
      !/already exists|duplicate/i.test(upload.error.message)
    ) {
      throw new Error(upload.error.message);
    }

    const { data, error } = await supabase.rpc(
      "labeling_create_source_candidates",
      {
        p_hash: sha256,
        p_filename: filename,
        p_mime: value.type,
        p_bytes: value.size,
        p_storage: storagePath,
        p_origin_kind: "website-upload",
        p_origin_ref: `website-upload:${sha256}`,
        p_project_group: projectGroupId,
        p_pages: pages,
        p_provenance: {
          source: "website-upload",
          uploadTransport: "standard-api",
          sha256,
          originalFilename: value.name,
          geometryDerivedServerSide: true,
        },
        p_historical: {},
      },
    );

    if (error) throw new Error(error.message);

    return NextResponse.json({
      sha256,
      storagePath,
      candidateIds: data ?? [],
      pageCount: pages.length,
      transformStates: pages.map(
        (page) => page.transform.transform_validation_state,
      ),
      datasetAdmission: false,
      trainingReady: false,
      uploadTransport: "standard-api",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "upload_failed";
    return NextResponse.json(({ error: message }), {
      status: message.includes("authentication_required")
        ? 401
        : 403,
    });
  }
}

import { createHash, randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../../lib/structural-labeling/server";
import { deriveSourcePages } from "../../../../../lib/structural-labeling/source-geometry";
import {
  STRUCTURAL_LABELING_ALLOWED_MIME_TYPES,
  STRUCTURAL_LABELING_MAX_UPLOAD_BYTES,
  STRUCTURAL_LABELING_SOURCE_BUCKET,
  sanitizeStructuralLabelingFilename,
} from "../../../../../lib/structural-labeling/upload-config";

type InitPayload = {
  action: "init";
  filename: string;
  mimeType: string;
  byteSize: number;
  sha256: string;
};

type CompletePayload = {
  action: "complete";
  filename: string;
  mimeType: string;
  byteSize: number;
  sha256: string;
  storagePath: string;
  projectGroupId?: string | null;
};

function adminStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("supabase_server_config_missing");
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function validateMetadata(payload: {
  filename: string;
  mimeType: string;
  byteSize: number;
  sha256: string;
}) {
  if (!payload.filename?.trim()) {
    throw new Error("file_name_required");
  }

  if (!STRUCTURAL_LABELING_ALLOWED_MIME_TYPES.has(payload.mimeType)) {
    throw new Error("unsupported_media_type");
  }

  if (
    !Number.isSafeInteger(payload.byteSize) ||
    payload.byteSize <= 0 ||
    payload.byteSize > STRUCTURAL_LABELING_MAX_UPLOAD_BYTES
  ) {
    throw new Error("invalid_file_size");
  }

  if (!/^[0-9a-f]{64}$/.test(payload.sha256)) {
    throw new Error("invalid_sha256");
  }
}

async function requireUploadPermission(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("platform_my_permissions");
  if (error) throw new Error(error.message);

  const permissions = Array.isArray(data) ? data : [];
  if (!permissions.includes("labeling.upload")) {
    throw new Error("labeling_upload_permission_required");
  }
}

function statusFor(message: string) {
  if (message.includes("authentication_required")) return 401;

  if (
    message.includes("permission_required") ||
    message.includes("labeling_upload_permission_required")
  ) {
    return 403;
  }

  if (
    message.includes("unsupported_media_type") ||
    message.includes("invalid_file_size") ||
    message.includes("invalid_sha256") ||
    message.includes("file_name_required") ||
    message.includes("invalid_storage_path") ||
    message.includes("uploaded_file_size_mismatch") ||
    message.includes("uploaded_file_hash_mismatch")
  ) {
    return 400;
  }

  return 500;
}

export async function POST(request: NextRequest) {
  let cleanupPath: string | null = null;
  let keepUploadedObject = false;

  try {
    const { supabase, user } = await requireAuthenticatedUser(
      request.headers.get("authorization"),
    );
    await requireUploadPermission(supabase);

    const payload = (await request.json()) as InitPayload | CompletePayload;
    validateMetadata(payload);

    const safeFilename = sanitizeStructuralLabelingFilename(payload.filename);
    const admin = adminStorageClient();

    if (payload.action === "init") {
      const uploadId = randomUUID();
      const storagePath =
        `direct/${user.id}/${payload.sha256}/${uploadId}/${safeFilename}`;

      const { data, error } = await admin.storage
        .from(STRUCTURAL_LABELING_SOURCE_BUCKET)
        .createSignedUploadUrl(storagePath, { upsert: false });

      if (error || !data?.token) {
        throw new Error(error?.message || "signed_upload_url_failed");
      }

      return NextResponse.json({
        bucket: STRUCTURAL_LABELING_SOURCE_BUCKET,
        storagePath,
        token: data.token,
      });
    }

    const expectedPrefix = `direct/${user.id}/${payload.sha256}/`;
    if (
      !payload.storagePath.startsWith(expectedPrefix) ||
      !payload.storagePath.endsWith(`/${safeFilename}`)
    ) {
      throw new Error("invalid_storage_path");
    }

    cleanupPath = payload.storagePath;

    const { data: object, error: downloadError } = await admin.storage
      .from(STRUCTURAL_LABELING_SOURCE_BUCKET)
      .download(payload.storagePath);

    if (downloadError || !object) {
      throw new Error(downloadError?.message || "uploaded_file_not_found");
    }

    const bytes = new Uint8Array(await object.arrayBuffer());
    if (bytes.byteLength !== payload.byteSize) {
      throw new Error("uploaded_file_size_mismatch");
    }

    const actualSha256 = createHash("sha256").update(bytes).digest("hex");
    if (actualSha256 !== payload.sha256) {
      throw new Error("uploaded_file_hash_mismatch");
    }

    const pages = await deriveSourcePages(
      bytes,
      payload.mimeType,
      payload.sha256,
    );
    const projectGroupId =
      payload.projectGroupId?.trim() || `upload:${payload.sha256}`;

    const { data, error } = await supabase.rpc(
      "labeling_create_source_candidates",
      {
        p_hash: payload.sha256,
        p_filename: safeFilename,
        p_mime: payload.mimeType,
        p_bytes: payload.byteSize,
        p_storage: payload.storagePath,
        p_origin_kind: "website-upload",
        p_origin_ref: `website-upload:${payload.sha256}`,
        p_project_group: projectGroupId,
        p_pages: pages,
        p_provenance: {
          source: "website-upload",
          uploadTransport: "direct-signed-storage",
          sha256: payload.sha256,
          originalFilename: payload.filename,
          geometryDerivedServerSide: true,
        },
        p_historical: {},
      },
    );

    if (error) throw new Error(error.message);

    keepUploadedObject = true;

    return NextResponse.json({
      sha256: payload.sha256,
      storagePath: payload.storagePath,
      candidateIds: data ?? [],
      pageCount: pages.length,
      transformStates: pages.map(
        (page) => page.transform.transform_validation_state,
      ),
      datasetAdmission: false,
      trainingReady: false,
      uploadTransport: "direct-signed-storage",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "direct_upload_failed";

    if (cleanupPath && !keepUploadedObject) {
      try {
        const admin = adminStorageClient();
        await admin.storage
          .from(STRUCTURAL_LABELING_SOURCE_BUCKET)
          .remove([cleanupPath]);
      } catch {
        // Best-effort cleanup; preserve the original failure.
      }
    }

    return NextResponse.json(
      { error: message },
      { status: statusFor(message) },
    );
  }
}

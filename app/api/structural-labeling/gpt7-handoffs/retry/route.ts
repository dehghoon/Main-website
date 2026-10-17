import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../../lib/structural-labeling/server";
import {
  prepareGpt7Handoff,
  type PreRenderedPdfPage,
} from "../../../../../lib/structural-labeling/gpt7-handoff-server";
import {
  STRUCTURAL_LABELING_SOURCE_BUCKET,
} from "../../../../../lib/structural-labeling/upload-config";

type InitPayload = {
  action: "init-render";
  candidateId: string;
};

type CompletePayload = {
  action: "complete-render";
  candidateId: string;
  storagePath: string;
  widthPx: number;
  heightPx: number;
  scale: number;
};

function adminStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("supabase_server_config_missing");
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function requireOwnerReviewPermission(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("structural_labeling_permissions")
    .select("permission")
    .eq("user_id", userId)
    .eq("permission", "labeling.owner_review")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("labeling_owner_review_permission_required");
}

function statusFor(message: string) {
  if (message.includes("authentication_required")) return 401;
  if (message.includes("permission_required")) return 403;
  if (
    message.includes("candidateId_required") ||
    message.includes("invalid_render") ||
    message.includes("invalid_storage_path")
  ) return 400;
  if (message.includes("owner_approval_required")) return 409;
  return 500;
}

function pngDimensions(bytes: Uint8Array) {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 24 || sig.some((value, index) => bytes[index] !== value)) {
    throw new Error("invalid_render_png");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return {
    width: view.getUint32(16),
    height: view.getUint32(20),
  };
}

async function candidateRenderContext(
  supabase: SupabaseClient,
  candidateId: string,
) {
  const { data: candidate, error: candidateError } = await supabase
    .from("structural_labeling_candidates")
    .select("id,source_id,page_index,original_filename,workflow_state")
    .eq("id", candidateId)
    .single();
  if (candidateError || !candidate) {
    throw new Error(candidateError?.message ?? "candidate_not_found");
  }

  const { data: source, error: sourceError } = await supabase
    .from("structural_labeling_sources")
    .select("mime_type")
    .eq("source_id", candidate.source_id)
    .single();
  if (sourceError || !source) {
    throw new Error(sourceError?.message ?? "source_not_found");
  }

  const { data: revision, error: revisionError } = await supabase
    .from("structural_labeling_annotation_revisions")
    .select("transform_metadata")
    .eq("candidate_id", candidateId)
    .order("revision_no", { ascending: false })
    .limit(1)
    .single();
  if (revisionError || !revision) {
    throw new Error(revisionError?.message ?? "annotation_revision_required");
  }

  return {
    candidate,
    source,
    transform: revision.transform_metadata as {
      raster_width_px: number;
      raster_height_px: number;
      page_rotation_deg: 0 | 90 | 180 | 270;
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await requireAuthenticatedUser(
      request.headers.get("authorization"),
    );
    await requireOwnerReviewPermission(supabase, user.id);

    const { data, error } = await supabase
      .from("structural_labeling_candidates")
      .select("id,original_filename,page_index,workflow_state")
      .eq("workflow_state", "owner-approved")
      .is("gpt7_exported_at", null)
      .limit(50);

    if (error) throw new Error(error.message);
    return NextResponse.json({ candidates: data ?? [] });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "gpt7_retry_candidates_failed";
    return NextResponse.json({ error: message }, { status: statusFor(message) });
  }
}

export async function POST(request: NextRequest) {
  let cleanupPath: string | null = null;

  try {
    const { supabase, user } = await requireAuthenticatedUser(
      request.headers.get("authorization"),
    );
    await requireOwnerReviewPermission(supabase, user.id);

    const body = (await request.json()) as InitPayload | CompletePayload;
    const candidateId = String(body.candidateId ?? "").trim();
    if (!candidateId) {
      return NextResponse.json({ error: "candidateId_required" }, { status: 400 });
    }

    const context = await candidateRenderContext(supabase, candidateId);
    if (context.candidate.workflow_state !== "owner-approved") {
      throw new Error("owner_approval_required");
    }

    if (context.source.mime_type !== "application/pdf") {
      const handoff = await prepareGpt7Handoff(supabase, candidateId);
      return NextResponse.json({
        candidateId,
        repository: handoff.repository,
        commitSha: handoff.commitSha,
        exportPath: handoff.exportPath,
        sourcePath: handoff.sourcePath,
        yoloImagePath: handoff.yoloImagePath,
        annotationsPath: handoff.annotationsPath,
        manifestPath: handoff.manifestPath,
      });
    }

    const admin = adminStorageClient();

    if (body.action === "init-render") {
      const pageIndex = context.candidate.page_index ?? 0;
      const storagePath =
        `handoff-render/${user.id}/${candidateId}/${randomUUID()}/` +
        `page-${String(pageIndex + 1).padStart(4, "0")}.png`;

      const { data, error } = await admin.storage
        .from(STRUCTURAL_LABELING_SOURCE_BUCKET)
        .createSignedUploadUrl(storagePath, { upsert: false });

      if (error || !data?.token) {
        throw new Error(error?.message ?? "signed_upload_url_failed");
      }

      return NextResponse.json({
        bucket: STRUCTURAL_LABELING_SOURCE_BUCKET,
        storagePath,
        token: data.token,
        pageIndex,
        transform: context.transform,
      });
    }

    const expectedPrefix = `handoff-render/${user.id}/${candidateId}/`;
    if (
      !body.storagePath?.startsWith(expectedPrefix) ||
      !body.storagePath.endsWith(".png")
    ) {
      throw new Error("invalid_storage_path");
    }
    cleanupPath = body.storagePath;

    const { data: blob, error: downloadError } = await admin.storage
      .from(STRUCTURAL_LABELING_SOURCE_BUCKET)
      .download(body.storagePath);

    if (downloadError || !blob) {
      throw new Error(downloadError?.message ?? "render_upload_not_found");
    }

    const png = new Uint8Array(await blob.arrayBuffer());
    const dimensions = pngDimensions(png);
    if (
      !Number.isFinite(body.widthPx) ||
      !Number.isFinite(body.heightPx) ||
      !Number.isFinite(body.scale) ||
      body.widthPx <= 0 ||
      body.heightPx <= 0 ||
      body.scale <= 0 ||
      dimensions.width !== Math.round(body.widthPx) ||
      dimensions.height !== Math.round(body.heightPx)
    ) {
      throw new Error("invalid_render_metadata");
    }

    const preRendered: PreRenderedPdfPage = {
      png,
      widthPx: dimensions.width,
      heightPx: dimensions.height,
      scale: body.scale,
      pageIndex: context.candidate.page_index ?? 0,
    };

    const handoff = await prepareGpt7Handoff(
      supabase,
      candidateId,
      preRendered,
    );

    await admin.storage
      .from(STRUCTURAL_LABELING_SOURCE_BUCKET)
      .remove([body.storagePath]);
    cleanupPath = null;

    return NextResponse.json({
      candidateId,
      repository: handoff.repository,
      commitSha: handoff.commitSha,
      exportPath: handoff.exportPath,
      sourcePath: handoff.sourcePath,
      yoloImagePath: handoff.yoloImagePath,
      annotationsPath: handoff.annotationsPath,
      manifestPath: handoff.manifestPath,
    });
  } catch (error) {
    if (cleanupPath) {
      try {
        const admin = adminStorageClient();
        await admin.storage
          .from(STRUCTURAL_LABELING_SOURCE_BUCKET)
          .remove([cleanupPath]);
      } catch {
        // Best-effort cleanup; preserve the original failure.
      }
    }

    const message =
      error instanceof Error ? error.message : "gpt7_retry_failed";
    return NextResponse.json({ error: message }, { status: statusFor(message) });
  }
}

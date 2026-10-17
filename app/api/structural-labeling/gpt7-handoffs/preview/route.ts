import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAuthenticatedUser } from "../../../../../lib/structural-labeling/server";
import {
  commitGpt7AnnotatedPreview,
  loadGpt7Image,
  renderAnnotatedPreviewPng,
} from "../../../../../lib/structural-labeling/gpt7-preview-server";
import type {
  Annotation,
  TransformMetadata,
} from "../../../../../lib/structural-labeling/contract";

type PreviewPayload = {
  candidateId: string;
  yoloImagePath: string;
};

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
    message.includes("invalid_yolo_image_path")
  ) {
    return 400;
  }
  if (message.includes("owner_approval_required")) return 409;
  return 500;
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireAuthenticatedUser(
      request.headers.get("authorization"),
    );
    await requireOwnerReviewPermission(supabase, user.id);

    const body = (await request.json()) as PreviewPayload;
    const candidateId = String(body.candidateId ?? "").trim();
    const yoloImagePath = String(body.yoloImagePath ?? "").trim();

    if (!candidateId) {
      return NextResponse.json({ error: "candidateId_required" }, { status: 400 });
    }

    const expectedPrefix = `datasets/manual-labeling-inbox/${candidateId}/`;
    if (
      !yoloImagePath.startsWith(expectedPrefix) ||
      !/\.(png|jpe?g|webp)$/i.test(yoloImagePath)
    ) {
      throw new Error("invalid_yolo_image_path");
    }

    const { data: candidate, error: candidateError } = await supabase
      .from("structural_labeling_candidates")
      .select("id,page_index,workflow_state")
      .eq("id", candidateId)
      .single();

    if (candidateError || !candidate) {
      throw new Error(candidateError?.message ?? "candidate_not_found");
    }
    if (candidate.workflow_state !== "owner-approved") {
      throw new Error("owner_approval_required");
    }

    const { data: revision, error: revisionError } = await supabase
      .from("structural_labeling_annotation_revisions")
      .select("annotations,transform_metadata")
      .eq("candidate_id", candidateId)
      .order("revision_no", { ascending: false })
      .limit(1)
      .single();

    if (revisionError || !revision) {
      throw new Error(revisionError?.message ?? "annotation_revision_required");
    }

    const sourceImage = await loadGpt7Image(yoloImagePath);
    const previewPng = await renderAnnotatedPreviewPng({
      image: sourceImage,
      annotations: revision.annotations as Annotation[],
      transform: revision.transform_metadata as TransformMetadata,
    });

    const committed = await commitGpt7AnnotatedPreview({
      candidateId,
      pageIndex: candidate.page_index ?? 0,
      previewPng,
    });

    return NextResponse.json({
      candidateId,
      repository: committed.repository,
      commitSha: committed.commitSha,
      previewPath: committed.previewPath,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "gpt7_preview_generation_failed";
    return NextResponse.json({ error: message }, { status: statusFor(message) });
  }
}

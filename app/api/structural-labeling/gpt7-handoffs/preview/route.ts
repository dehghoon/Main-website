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
};

type Manifest = Record<string, unknown> & {
  yolo_image_file?: unknown;
  preview_files?: unknown;
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
  if (message.includes("candidateId_required")) return 400;
  if (message.includes("owner_approval_required")) return 409;
  return 500;
}

function githubConfig() {
  const token = process.env.GPT7_GITHUB_TOKEN?.trim();
  if (!token) throw new Error("missing_server_env:GPT7_GITHUB_TOKEN");

  return {
    token,
    owner: process.env.GPT7_GITHUB_OWNER?.trim() || "dehghoon",
    repo: process.env.GPT7_GITHUB_REPO?.trim() || "linkoteq-structural-detection",
    branch: process.env.GPT7_GITHUB_BRANCH?.trim() || "main",
  };
}

async function loadManifest(exportPath: string): Promise<Manifest> {
  const { token, owner, repo, branch } = githubConfig();
  const path = `${exportPath}/manifest.json`;
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`gpt7_manifest_load_failed:${response.status}:${text.slice(0, 300)}`);
  }

  const body = (await response.json()) as { content?: string; encoding?: string };
  if (body.encoding !== "base64" || !body.content) {
    throw new Error("gpt7_manifest_encoding_unsupported");
  }

  return JSON.parse(
    Buffer.from(body.content.replace(/\s/g, ""), "base64").toString("utf8"),
  ) as Manifest;
}

function readablePreviewPath(manifest: Manifest, pageIndex: number): string | null {
  if (!Array.isArray(manifest.preview_files)) return null;

  const item = manifest.preview_files.find((value) => {
    if (!value || typeof value !== "object") return false;
    const typed = value as { page_index?: unknown; renderer_version?: unknown };
    return typed.page_index === pageIndex && typed.renderer_version === "readable-labels-v2";
  });

  if (!item || typeof item !== "object") return null;
  const path = (item as { path?: unknown }).path;
  return typeof path === "string" ? path : null;
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await requireAuthenticatedUser(
      request.headers.get("authorization"),
    );
    await requireOwnerReviewPermission(supabase, user.id);

    const { data, error } = await supabase
      .from("structural_labeling_candidates")
      .select("id,original_filename,page_index,gpt7_exported_at,gpt7_export_path")
      .eq("workflow_state", "owner-approved")
      .not("gpt7_exported_at", "is", null)
      .order("gpt7_exported_at", { ascending: false })
      .limit(12);

    if (error) throw new Error(error.message);
    return NextResponse.json({ candidates: data ?? [] });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "gpt7_preview_candidates_failed";
    return NextResponse.json({ error: message }, { status: statusFor(message) });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireAuthenticatedUser(
      request.headers.get("authorization"),
    );
    await requireOwnerReviewPermission(supabase, user.id);

    const body = (await request.json()) as PreviewPayload;
    const candidateId = String(body.candidateId ?? "").trim();
    if (!candidateId) {
      return NextResponse.json({ error: "candidateId_required" }, { status: 400 });
    }

    const { data: candidate, error: candidateError } = await supabase
      .from("structural_labeling_candidates")
      .select("id,page_index,workflow_state,gpt7_exported_at,gpt7_export_path")
      .eq("id", candidateId)
      .single();

    if (candidateError || !candidate) {
      throw new Error(candidateError?.message ?? "candidate_not_found");
    }
    if (candidate.workflow_state !== "owner-approved" || !candidate.gpt7_exported_at) {
      throw new Error("owner_approval_required");
    }

    const pageIndex = candidate.page_index ?? 0;
    const exportPath =
      String(candidate.gpt7_export_path ?? "").trim() ||
      `datasets/manual-labeling-inbox/${candidateId}`;
    const manifest = await loadManifest(exportPath);
    const existingPath = readablePreviewPath(manifest, pageIndex);

    if (existingPath) {
      return NextResponse.json({
        candidateId,
        previewPath: existingPath,
        status: "existing",
      });
    }

    const yoloImagePath =
      typeof manifest.yolo_image_file === "string" ? manifest.yolo_image_file : "";
    const expectedPrefix = `${exportPath}/`;
    if (
      !yoloImagePath.startsWith(expectedPrefix) ||
      !/\.(png|jpe?g|webp)$/i.test(yoloImagePath)
    ) {
      throw new Error("invalid_yolo_image_path");
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
      pageIndex,
      previewPng,
      exportPath,
    });

    return NextResponse.json({
      candidateId,
      repository: committed.repository,
      commitSha: committed.commitSha,
      previewPath: committed.previewPath,
      status: "created",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "gpt7_preview_generation_failed";
    return NextResponse.json({ error: message }, { status: statusFor(message) });
  }
}

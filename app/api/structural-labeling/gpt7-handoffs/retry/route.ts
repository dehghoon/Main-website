import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../../lib/structural-labeling/server";
import { prepareGpt7Handoff } from "../../../../../lib/structural-labeling/gpt7-handoff-server";

async function requireOwnerReviewPermission(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("structural_labeling_permissions")
    .select("permission")
   .eq("user_id", userId)
   .eq("permission", "labeling.owner_review")
   .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) {
    throw new Error("labeling_owner_review_permission_required");
  }
}

function statusFor(message: string) {
  if (message.includes("authentication_required")) return 401;
  if (message.includes("permission_required")) return 403;
  if (message.includes("owner_approval_required")) return 409;
  return 500;
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
  try {
    const { supabase, user } = await requireAuthenticatedUser(
      request.headers.get("authorization"),
    );
    await requireOwnerReviewPermission(supabase, user.id);

    const body = await request.json();
    const candidateId = String(body.candidateId ?? "").trim();
    if (!candidateId) {
      return NextResponse.json({ error: "candidateId_required" }, { status: 400 });
    }

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
  } catch (error) {
    const message = error instanceof Error ? error.message : "gpt7_retry_failed";
    return NextResponse.json({ error: message }, { status: statusFor(message) });
  }
}

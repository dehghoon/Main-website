import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../../../lib/structural-labeling/server";

const DELETABLE_STATES = new Set([
  "candidate",
  "suitable-for-labeling",
  "unsuitable-for-labeling",
  "labeling-in-progress",
  "revision-required",
]);

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const authorization = request.headers.get("authorization");
    const { supabase } = await requireAuthenticatedUser(authorization);
    const { id } = await context.params;

    const { data: candidate, error: candidateError } = await supabase
      .from("structural_labeling_candidates")
      .select("workflow_state")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (candidateError) {
      return NextResponse.json(
        { error: candidateError.message },
       { status: 400 },
      );
    }

    if (!candidate) {
      return NextResponse.json({ error: "candidate_not_found" }, { status: 404 });
    }

    if (!DELETABLE_STATES.has(candidate.workflow_state)) {
      return NextResponse.json(
        { error: `candidate_state_not_deletable:${candidate.workflow_state}` },
        { status: 409 },
      );
    }

    const result = await supabase.rpc("labeling_soft_delete_uploaded_candidate", {
      p_id: id,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "request_failed";
    const status = message.includes("authentication_required") ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}

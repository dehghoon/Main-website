import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../../lib/structural-labeling/server";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { supabase } = await requireAuthenticatedUser(request.headers.get("authorization"));
    const [candidate, revisions, audit] = await Promise.all([
      supabase.from("structural_labeling_candidates").select("*").eq("id", id).is("archived_at", null).single(),
      supabase.from("structural_labeling_annotation_revisions").select("*").eq("candidate_id", id).order("revision_no"),
      supabase.from("structural_labeling_audit_events").select("*").eq("candidate_id", id).order("created_at"),
    ]);
    if (candidate.error || !candidate.data) throw new Error(candidate.error?.message || "candidate_not_found");
    if (revisions.error) throw new Error(revisions.error.message);
    if (audit.error) throw new Error(audit.error.message);
    return NextResponse.json({ candidate: candidate.data, revisions: revisions.data || [], audit: audit.data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "request_failed";
    return NextResponse.json({ error: message }, { status: message.includes("authentication_required") ? 401 : 403 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { supabase } = await requireAuthenticatedUser(request.headers.get("authorization"));
    const { error } = await supabase.rpc("labeling_archive_candidate", { p_id: id });
    if (error) throw new Error(error.message);
    return NextResponse.json({ archived: true, candidateId: id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "request_failed";
    return NextResponse.json({ error: message }, { status: message.includes("authentication_required") ? 401 : 403 });
  }
}

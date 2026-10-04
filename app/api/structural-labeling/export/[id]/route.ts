import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../../lib/structural-labeling/server";
import { buildGpt7IntakePackage, validateGpt7IntakePackage } from "../../../../../lib/structural-labeling/gpt7";
import type { Annotation, TransformMetadata } from "../../../../../lib/structural-labeling/contract";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { supabase } = await requireAuthenticatedUser(request.headers.get("authorization"));
    const gate = await supabase.rpc("labeling_assert_exportable", { p_id: id });
    if (gate.error || gate.data !== true) throw new Error(gate.error?.message ?? "export_not_authorized");

    const [{ data: candidate, error: candidateError }, { data: revisions, error: revisionError }, { data: audit, error: auditError }] = await Promise.all([
      supabase.from("structural_labeling_candidates").select("*").eq("id", id).single(),
      supabase.from("structural_labeling_annotation_revisions").select("*").eq("candidate_id", id).order("revision_no", { ascending: true }),
      supabase.from("structural_labeling_audit_events").select("*").eq("candidate_id", id).order("created_at", { ascending: true }),
    ]);
    if (candidateError || !candidate) throw new Error(candidateError?.message ?? "candidate_not_found");
    if (revisionError) throw new Error(revisionError.message);
    if (auditError) throw new Error(auditError.message);

    const { data: source, error: sourceError } = await supabase
      .from("structural_labeling_sources").select("*").eq("source_id", candidate.source_id).single();
    if (sourceError || !source) throw new Error(sourceError?.message ?? "source_not_found");

    const latest = (revisions ?? []).at(-1);
    if (!latest) throw new Error("annotation_revision_required");
    const pkg = buildGpt7IntakePackage({
      candidate,
      source,
      annotations: latest.annotations as Annotation[],
      transform: latest.transform_metadata as TransformMetadata,
      audit: audit ?? [],
      toolVersion: "milestone-2",
    });
    const errors = validateGpt7IntakePackage(pkg);
    if (errors.length) throw new Error(`pinned_contract_validation_failed:${errors.join(",")}`);

    return NextResponse.json(pkg, {
      headers: {
        "Content-Disposition": `attachment; filename="gpt7-manual-labeling-${id}.json"`,
        "X-Linkoteq-Status": "Pending GPT-7 Admission",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "export_failed";
    return NextResponse.json({ error: message }, { status: message.includes("authentication_required") ? 401 : 403 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../lib/structural-labeling/server";
import { assertAnnotationsValid } from "../../../../lib/structural-labeling/validation";
import type { Annotation, TransformMetadata } from "../../../../lib/structural-labeling/contract";

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "request_failed";
  const status = message.includes("authentication_required") ? 401 : 403;
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");
    const { supabase } = await requireAuthenticatedUser(authorization);
    const body = await request.json();
    const candidateId = String(body.candidateId ?? "");
    const action = String(body.action ?? "");
    if (!candidateId || !action) return NextResponse.json({ error: "candidateId_and_action_required" }, { status: 400 });

    if (action === "save-revision") {
      const annotations = body.annotations as Annotation[];
      const transform = body.transform as TransformMetadata;
      assertAnnotationsValid(annotations, transform);
      const { data, error } = await supabase.rpc("labeling_save_revision", {
        p_id: candidateId,
        p_annotations: annotations,
        p_transform: transform,
        p_notes: body.notes ?? null,
      });
      if (error) throw new Error(error.message);
      return NextResponse.json({ revisionId: data });
    }

    if (["mark-suitable", "mark-unsuitable", "start-labeling", "submit-owner-qa"].includes(action)) {
      const { data, error } = await supabase.rpc("labeling_employee_transition", {
        p_id: candidateId,
        p_action: action,
        p_reason: body.reason ?? null,
      });
      if (error) throw new Error(error.message);
      return NextResponse.json({ state: data });
    }

    if (["approve", "reject", "request-revision"].includes(action)) {
      const { data, error } = await supabase.rpc("labeling_owner_transition", {
        p_id: candidateId,
        p_action: action,
        p_reason: body.reason ?? null,
      });
      if (error) throw new Error(error.message);
      return NextResponse.json({ state: data });
    }

    return NextResponse.json({ error: "unsupported_action" }, { status: 400 });
  } catch (error) {
    return failure(error);
  }
}

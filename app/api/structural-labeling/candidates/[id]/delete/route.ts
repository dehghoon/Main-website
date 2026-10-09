import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../../../lib/structural-labeling/server";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const authorization = request.headers.get("authorization");
    const { supabase } = await requireAuthenticatedUser(authorization);
    const { id } = await context.params;

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

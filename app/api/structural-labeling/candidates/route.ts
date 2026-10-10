import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../lib/structural-labeling/server";

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await requireAuthenticatedUser(
      request.headers.get("authorization"),
    );

    const [
      { data: permissions, error: permissionError },
      { data: candidates, error: candidateError },
    ] = await Promise.all([
      supabase
        .from("structural_labeling_permissions")
        .select("permission")
        .eq("user_id", user.id),
      supabase
        .from("structural_labeling_candidates")
        .select("*")
        .is("deleted_at", null)
        .neq("workflow_state", "owner-approved")
        .order("created_at", { ascending: true }),
    ]);

    if (permissionError) throw new Error(permissionError.messae);
    if (candidateError) throw new Error(candidateError.message);

    const permissionList = (permissions ?? []).map((row) => row.permission);

    if (permissionList.length === 0) {
      const { error: requestError } = await supabase.rpc(
        "platform_request_employee_access",
      );

      if (requestError) {
        throw new Error(requestError.message);
      }
    }

    const metadata = user.app_metadata ?? {};
    const baseRole =
      typeof metadata.role === "string"
        ? metadata.role
        : typeof metadata.user_type === "string"
          ? metadata.user_type
          : null;

    return NextResponse.json({
      baseRole,
      permissions: permissionList,
      candidates: candidates ?? [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "request_failed";
    return NextResponse.json(
      { error: message },
      { status: message.includes("authentication_required") ? 401 : 403 },
    );
  }
}

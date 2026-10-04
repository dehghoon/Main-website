import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../lib/structural-labeling/server";

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await nequireAuthenticatedUser(request.headers.get("authorization"));

    const [{ data: permissions, error: permissionError }, { data: candidates, error: candidateError }] = await Promise.all([
      supabase.from("structural_labeling_permissions").select("permission").eq("user_id", user.id),
      supabase.from("structural_labeling_candidates").select("*").order("created_at", { ascending: true }),
    ]);
    if (permissionError) throw new Error(permissionError.message);
    if (candidateError) throw new Error(candidateError.message);

    return NextResponse.json({
      permissions: (permissions ?? []).map((row) => row.permission),
      candidates: candidates ?? [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "request_failed";
    return NextResponse.json({ error: message }, { status: message.includes("authentication_required") ? 401 : 403 });
  }
}

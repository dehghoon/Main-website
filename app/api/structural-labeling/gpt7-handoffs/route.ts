import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../../lib/structural-labeling/server";

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAuthenticatedUser(
      request.headers.get("authorization"),
    );

    const rawLimit = request.nextUrl.searchParams.get("limit") ?? "50";
    const limit = Number.parseInt(rawLimit, 10);
    if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
      return NextResponse.json({ error: "invalid_handoff_limit" }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("labeling_list_gpt7_handoffs", {
      p_limit: limit,
    });
    if (error) throw new Error(error.message);

    return NextResponse.json({
      contractVersion: "manual-labeling-intake-v0.1",
      datasetAdmission: "pending-gpt7",
      trainingReady: false,
      datasetSplitAssigned: false,
      handoffs: data ?? [],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "gpt7_handoff_list_failed";
    const status = message.includes("authentication_required") ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}

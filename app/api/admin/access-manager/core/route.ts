import { NextRequest, NextResponse } from "next/server";
import { requireCommandCenterOwner, commandCenterError } from "@/lib/command-center/server";
import snapshot from "@/lib/command-center/repository-snapshot.json";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "Vary": "Authorization" };
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireCommandCenterOwner(request.headers.get("authorization"));
    const { data, error } = await supabase.from("command_center_core_releases").select("id,target_version,source_sha,status,evidence,created_at").order("created_at", { ascending: false }).limit(50);
    const events = await supabase.from("command_center_core_release_events").select("id,release_id,actor_id,decision,reason,source_sha,created_at").order("created_at", { ascending: false }).limit(100);
    return NextResponse.json({ events: events.error ? [] : events.data, historyReady: !events.error, snapshot, releases: error ? [] : data, storageReady: !error,
      storageMessage: error ? "Release records unavailable. Apply and verify the staged migration before enabling approvals." : null }, { headers });
  } catch (error) { const result = commandCenterError(error); return NextResponse.json({ error: result.error }, { status: result.status, headers }); }
}
export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireCommandCenterOwner(request.headers.get("authorization"));
    const body = await request.json();
    if (!/^[0-9a-f-]{36}$/i.test(body.releaseId ?? "") || !["approve","request_changes","reject","postpone"].includes(body.decision) || typeof body.reason !== "string" || body.reason.trim().length < 10 || body.reason.length > 2000)
      return NextResponse.json({ error: "A valid release, decision and review reason are required" }, { status: 400, headers });
    const { data, error } = await supabase.rpc("command_center_review_core_release", { p_release_id: body.releaseId, p_decision: body.decision, p_reason: body.reason.trim() });
    if (error) return NextResponse.json({ error: "Review blocked: verify release evidence, current status and database migration" }, { status: 409, headers });
    return NextResponse.json({ status: data }, { headers });
  } catch (error) { const result = commandCenterError(error); return NextResponse.json({ error: result.error }, { status: result.status, headers }); }
}

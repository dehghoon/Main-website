import {applyWoodRecord} from "@/lib/wood-material-catalog";
import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/structural-labeling/server";
import { executionDecision } from "@/lib/tool-access/execution-policy";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" };
  let user: Awaited<ReturnType<typeof requireAuthenticatedUser>>;
  try { user = await requireAuthenticatedUser(request.headers.get("authorization")); }
  catch { return NextResponse.json({ error: "authentication_required" }, { status: 401, headers }); }
  const access = await executionDecision(user.supabase, "wood_design");
  if (access.status !== 200) return NextResponse.json({ error: access.error }, { status: access.status, headers });
  const body = await request.text();
  if (body.length > 100000) return NextResponse.json({ error: "request_too_large" }, { status: 413, headers });
  let resolved:ReturnType<typeof applyWoodRecord>;
  try {resolved=applyWoodRecord(JSON.parse(body));}catch(error){return NextResponse.json({detail:error instanceof Error?error.message:"Invalid material selection"},{status:422,headers});}
  try {
    const result = await fetch("https://linkoteq-wood-api.vercel.app/api/v1/beam/check", {
      method: "POST", headers: { Authorization: request.headers.get("authorization")!, "Content-Type": "application/json" },
      body:JSON.stringify(resolved.body), cache: "no-store", signal: AbortSignal.timeout(25000),
    });
    const data = await result.json();
    return NextResponse.json(resolved.record?{...data,material_selection:{id:resolved.record.id,species:resolved.record.species,grade:resolved.record.grade,source:resolved.record.source,verification:"source-transcribed-beta-review-pending"}}:data, { status: result.status, headers });
  } catch { return NextResponse.json({ error: "wood_service_unavailable" }, { status: 503, headers }); }
}

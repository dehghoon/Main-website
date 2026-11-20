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
  try {
    const result = await fetch("https://linkoteq-wood-api.vercel.app/api/v1/nds2024/simple-beam", {
      method: "POST", headers: { Authorization: request.headers.get("authorization")!, "Content-Type": "application/json" },
      body, cache: "no-store", signal: AbortSignal.timeout(25000),
    });
    const data = await result.json();
    return NextResponse.json(data, { status: result.status, headers });
  } catch { return NextResponse.json({ error: "wood_service_unavailable" }, { status: 503, headers }); }
}

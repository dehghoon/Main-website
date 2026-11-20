import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/structural-labeling/server";

import { executionDecision } from "@/lib/tool-access/execution-policy";

export const dynamic = "force-dynamic";
const origins = ["https://wind-calculator.vercel.app", "https://linkoteq-seismic-preview.vercel.app"];
function headers(request: NextRequest) {
  const origin = request.headers.get("origin");
  return { "Cache-Control": "private, no-store", Vary: "Origin",
    ...(origin && origins.includes(origin) ? { "Access-Control-Allow-Origin": origin } : {}) };
}
export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: { ...headers(request),
    "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Authorization" } });
}
export async function GET(request: NextRequest) {
  const respond = (body: object, status: number) => NextResponse.json(body, { status, headers: headers(request) });
  const tool = request.nextUrl.searchParams.get("tool");
  if (tool !== "wind_load" && tool !== "earthquake") return respond({ error: "invalid_tool" }, 400);
  let authenticated: Awaited<ReturnType<typeof requireAuthenticatedUser>>;
  try { authenticated = await requireAuthenticatedUser(request.headers.get("authorization")); }
  catch { return respond({ error: "authentication_required" }, 401); }
  const { status, ...body } = await executionDecision(authenticated.supabase, tool);
  return respond(body, status);
}

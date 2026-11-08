import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const ADMIN_EMAIL = "dehghani.pmp@gmail.com";

export async function GET(request: NextRequest) {
  const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const forbidden = () => NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return unauthorized();
  const mainUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const mainAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const surveyUrl = process.env.CUSTOMER_DISCOVERY_SUPABASE_URL;
  const surveyServiceKey = process.env.CUSTOMER_DISCOVERY_SUPABASE_SERVICE_ROLE_KEY;
  if (!mainUrl || !mainAnon || !surveyUrl || !surveyServiceKey)
    return NextResponse.json({ error: "Admin integration is not configured" }, { status: 503 });
  const auth = createClient(mainUrl, mainAnon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: authError } = await auth.auth.getUser(token);
  if (authError || !user) return unauthorized();
  if (user.email?.toLowerCase() !== ADMIN_EMAIL || !user.email_confirmed_at) return forbidden();
  const survey = createClient(surveyUrl, surveyServiceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const pageParam = Number(request.nextUrl.searchParams.get("page") ?? "0");
  const page = Number.isSafeInteger(pageParam) && pageParam >= 0 ? Math.min(pageParam, 10000) : 0;
  const { data, count, error } = await survey.from("survey_responses")
    .select("id,created_at,full_name,company_name,email,phone,preferred_contact_method,response", { count: "exact" })
    .order("created_at", { ascending: false }).range(page * 25, page * 25 + 24);
  if (error) return NextResponse.json({ error: "Unable to retrieve responses" }, { status: 502 });
  return NextResponse.json({ responses: data ?? [], total: count ?? 0, page }, { headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}

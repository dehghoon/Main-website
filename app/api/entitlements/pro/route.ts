import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * Read-only entitlement endpoint. An engineering tool must send the user's
 * Supabase access token and enforce the result server-side on every paid action.
 * No user ID or subscription status supplied by the caller is trusted.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const token = /^Bearer (.+)$/i.exec(auth)?.[1];
  if (!token) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.json({ error: "Entitlement service unavailable" }, { status: 503 });

  const client = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: identity, error: authError } = await client.auth.getUser(token);
  if (authError || !identity.user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const { data, error } = await client.rpc("has_active_discovery_pro_reward");
  if (error) return NextResponse.json({ error: "Entitlement check unavailable" }, { status: 503 });
  return NextResponse.json({ active: data === true, source: "customer_discovery_reward" }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

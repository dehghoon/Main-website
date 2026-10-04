"use client";

import { getSupabase } from "../../lib/supabase-browser";

export async function labelingAccessToken() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured");
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) throw new Error("Sign in is required");
  return data.session.access_token;
}

export async function labelingApi(path: string, init: RequestInit = {}) {
  const accessToken = await labelingAccessToken();
  const response = await fetch(path, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${accessToken}` },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed: ${response.status}`);
  return body;
}

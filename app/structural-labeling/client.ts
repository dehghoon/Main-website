"use client";

import { getSupabase } from "../../lib/supabase-browser";

export async function labelingAccessToken() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured");
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) throw new Error("Sign in is required");
  return data.session.access_token;
}

export async function labelingApi<T = Record<string, unknown>>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const accessToken = await labelingAccessToken();
  const response = await fetch(path, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${accessToken}` },
  });
  const body: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof (body as { error?: unknown }).error === "string"
        ? (body as { error: string }).error
        : `Request failed: ${response.status}`;
    throw new Error(message);
  }
  return body as T;
}

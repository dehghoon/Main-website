import { createClient } from "@supabase/supabase-js";

export function createRequestSupabase(authorization: string | null) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase public configuration is missing");
  }
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("authentication_required");
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });
}

export async function requireAuthenticatedUser(authorization: string | null) {
  const supabase = createRequestSupabase(authorization);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("authentication_required");
  return { supabase, user: data.user };
}

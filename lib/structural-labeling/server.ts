import { createClient } from "@supabase/supabase-js";

function bearerToken(authorization: string | null) {
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("authentication_required");
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) {
    throw new Error("authentication_required");
  }

  return token;
}

export function createRequestSupabase(authorization: string | null) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase public configuration is missing");
  }

  const token = bearerToken(authorization);

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export async function requireAuthenticatedUser(authorization: string | null) {
  const token = bearerToken(authorization);
  const supabase = createRequestSupabase(authorization);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new Error("authentication_required");
  }

  return { supabase, user: data.user };
}

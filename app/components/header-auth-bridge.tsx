"use client";
import { useEffect } from "react";
import { getSupabase } from "@/lib/supabase-browser";

/** Bridges the shared framework-neutral header to the existing website Supabase session. */
export default function HeaderAuthBridge() {
 useEffect(() => {
  const el = document.querySelector("linkoteq-header");
  if (!el) return;
  const supabase = getSupabase();
  if (!supabase) return;
  const update = (user: {email?: string | null; user_metadata?: Record<string, unknown> | null} | null | undefined) => {
   const raw = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email?.split("@")[0];
   const name = typeof raw === "string" ? raw.trim() : "";
   if (name) el.setAttribute("account-name", name);
   else el.removeAttribute("account-name");
  };
  void supabase.auth.getSession().then(({data}) => update(data.session?.user));
  const {data: listener} = supabase.auth.onAuthStateChange((_event,session) => update(session?.user));
  const signOut = async () => {await supabase.auth.signOut();window.location.reload()};
  el.addEventListener("linkoteq-signout",signOut);
  return () => {listener.subscription.unsubscribe();el.removeEventListener("linkoteq-signout",signOut)};
 },[]);
 return null;
}

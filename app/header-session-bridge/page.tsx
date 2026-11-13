"use client";
import { useEffect } from "react";
import { getSupabase } from "@/lib/supabase-browser";

const allowed = (origin: string) => {
  try {
    const url = new URL(origin);
    return url.protocol === "https:" && (url.hostname === "linkoteq.com" || url.hostname.endsWith(".linkoteq.com"));
  } catch { return false; }
};

/** Read the central site's session in its own origin; never transmit credentials. */
export default function HeaderSessionBridge() {
  useEffect(() => {
    const supabase = getSupabase();
    const send = (origin: string) => {
      if (!supabase || !allowed(origin)) return;
      void supabase.auth.getUser().then(({ data, error }) => {
        const user = error ? null : data.user;
        const raw = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email?.split("@")[0];
        const name = typeof raw === "string" ? raw.trim().slice(0, 80) : "";
        window.parent.postMessage({ type: "linkoteq:auth-state:v1", name }, origin);
      });
    };
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window.parent || !allowed(event.origin)) return;
      if (event.data?.type === "linkoteq:auth-request:v1") send(event.origin);
      if (event.data?.type === "linkoteq:signout:v1" && supabase) {
        void supabase.auth.signOut().then(() => send(event.origin));
      }
    };
    window.addEventListener("message", onMessage);
    const { data } = supabase?.auth.onAuthStateChange(() => {
      // The parent re-requests on navigation; send a fresh state when it is listening.
      if (document.referrer) {
        try { const origin = new URL(document.referrer).origin; if (allowed(origin)) send(origin); } catch {}
      }
    }) ?? { data: null };
    return () => { window.removeEventListener("message", onMessage); data?.subscription.unsubscribe(); };
  }, []);
  return null;
}

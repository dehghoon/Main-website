"use client";

import { useEffect } from "react";
import { engineeringToolOrigins, signOutHeaderAccount, subscribeHeaderAccount } from "@/lib/header-account";
import { getSupabase } from "@/lib/supabase-browser";

const modelOrigin = "https://3dmodel.linkoteq.com";

async function runSnow(payload: unknown) {
  try {
    const { data } = await getSupabase()?.auth.getSession() ?? {};
    const token = data?.session?.access_token;
    if (!token) return { ok: false, data: { error: "authentication_required" } };
    const response = await fetch(modelOrigin + "/api/calculators/snow", {
      method: "POST",
      credentials: "omit",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(35000),
    });
    return { ok: response.ok, data: await response.json() };
  } catch {
    return { ok: false, data: { error: "snow_service_unavailable" } };
  }
}

export default function HeaderSession() {
  useEffect(() => {
    if (window.parent === window) return;

    let parentOrigin: string | undefined;
    let account = { name: "", internalTools: false };
    const publish = () => {
      if (parentOrigin) {
        window.parent.postMessage({ type: "linkoteq:header-account", ...account }, parentOrigin);
      }
    };
    function receive(event: MessageEvent) {
      if (event.source !== window.parent || !engineeringToolOrigins.includes(event.origin)) return;
      if (event.data?.type === "linkoteq:header-connect") {
        parentOrigin = event.origin;
        publish();
      } else if (event.origin === parentOrigin &&
          ["https://wind.linkoteq.com", "https://seismic.linkoteq.com", "https://wind-calculator.vercel.app", "https://linkoteq-seismic-preview.vercel.app"].includes(event.origin) &&
          event.data?.type === "linkoteq:tool-session-request") {
        const origin = event.origin;
        void getSupabase()?.auth.getSession().then(({ data }) => {
          window.parent.postMessage({ type: "linkoteq:tool-session", token: data.session?.access_token ?? null }, origin);
        });
      } else if (event.origin === modelOrigin && event.origin === parentOrigin &&
          event.data?.type === "linkoteq:snow-request" && typeof event.data.id === "string") {
        const id = event.data.id;
        void runSnow(event.data.payload).then(result => {
          window.parent.postMessage({ type: "linkoteq:snow-result", id, ...result }, modelOrigin);
        });
      } else if (event.origin === parentOrigin && event.data?.type === "linkoteq:header-signout") {
        const origin = event.origin;
        void signOutHeaderAccount().then(ok => {
          window.parent.postMessage({ type: "linkoteq:header-signout-result", ok }, origin);
        });
      }
    }

    window.addEventListener("message", receive);
    const unsubscribe = subscribeHeaderAccount(nextAccount => {
      account = nextAccount;
      publish();
    });
    // Retry the handshake when the frame's client code takes longer than its load event.
    for (const origin of engineeringToolOrigins) {
      window.parent.postMessage({ type: "linkoteq:header-ready" }, origin);
    }
    return () => {
      unsubscribe();
      window.removeEventListener("message", receive);
    };
  }, []);

  return null;
}

"use client";

import { useEffect } from "react";
import { engineeringToolOrigins, signOutHeaderAccount, subscribeHeaderAccount } from "@/lib/header-account";

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

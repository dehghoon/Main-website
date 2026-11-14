"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { headerAccountPath, signOutHeaderAccount, subscribeHeaderAccount } from "@/lib/header-account";

const InternalToolsContext = createContext(false);

export function useInternalToolsAccess() {
  return useContext(InternalToolsContext);
}

export default function HeaderAuthBridge({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [error, setError] = useState(false);
  const [internalTools, setInternalTools] = useState(false);

  useEffect(() => {
    if (window.location.pathname === headerAccountPath) return;
    const header = document.querySelector("linkoteq-header");
    if (!header) return;

    const unsubscribe = subscribeHeaderAccount(({ name, internalTools }) => {
      setInternalTools(internalTools);
      header.toggleAttribute("internal-tools", internalTools);
      if (name) header.setAttribute("account-name", name);
      else header.removeAttribute("account-name");
    });

    async function signOut() {
      setError(false);
      if (!(await signOutHeaderAccount())) {
        setError(true);
        return;
      }
      const pathname = window.location.pathname;
      if (pathname === "/blog/dashboard") router.replace("/blog/login");
      else if (pathname.startsWith("/admin/")) window.location.assign("/blog/login");
    }
    header.addEventListener("linkoteq-signout", signOut);
    return () => {
      unsubscribe();
      header.removeEventListener("linkoteq-signout", signOut);
    };
  }, [router]);

  return (
    <InternalToolsContext.Provider value={internalTools}>
      {error && <p role="alert">Sign-out could not be completed. Please try again.</p>}
      {children}
    </InternalToolsContext.Provider>
  );
}

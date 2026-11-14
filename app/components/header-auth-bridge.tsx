"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { headerAccountPath, signOutHeaderAccount, subscribeHeaderAccount } from "@/lib/header-account";

export default function HeaderAuthBridge() {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (window.location.pathname === headerAccountPath) return;
    const header = document.querySelector("linkoteq-header");
    if (!header) return;

    const unsubscribe = subscribeHeaderAccount(({ name, internalTools }) => {
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

  return error ? <p role="alert">Sign-out could not be completed. Please try again.</p> : null;
}

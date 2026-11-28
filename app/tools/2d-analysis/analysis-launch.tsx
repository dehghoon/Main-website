"use client";

import { useInternalToolsAccess } from "../../components/header-auth-bridge";

export default function Analysis2DLaunch() {
  const internalTools = useInternalToolsAccess();

  if (internalTools) {
    return <a className="primaryButton" href="https://linkoteq-2d-analysis.vercel.app/">Open 2D Analysis →</a>;
  }

  return <a className="primaryButton" href="/contact/support">Ask about 2D Analysis access →</a>;
}

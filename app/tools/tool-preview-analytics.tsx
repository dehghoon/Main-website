"use client";

import { useEffect, useRef } from "react";
import { trackToolFunnel } from "@/lib/tool-funnel-analytics";
import { toolRequestPath, type PublicTool } from "@/lib/tool-discovery";
import { useInternalToolsAccess } from "../components/header-auth-bridge";
import styles from "./tools.module.css";

export default function ToolPreviewAnalytics({
  toolKey,
  trialDays,
  url,
}: {
  toolKey: PublicTool["key"];
  trialDays: PublicTool["trialDays"];
  url: PublicTool["url"];
}) {
  const viewed = useRef(false);
  const accessType = trialDays ? "trial" : "beta";
  const internalTools = useInternalToolsAccess();

  useEffect(() => {
    if (viewed.current) return;
    viewed.current = true;
    trackToolFunnel("tool_preview_view", toolKey, accessType);
  }, [toolKey, accessType]);

  if (toolKey === "3d_model" && internalTools && url) {
    return <a className="primaryButton" href={url}>Open 3D Model</a>;
  }

  return (
    <>
      <a
        className="primaryButton"
        href={toolRequestPath(toolKey)}
        onClick={() => trackToolFunnel("tool_access_cta_click", toolKey, accessType)}
      >
        {trialDays ? `Request a ${trialDays}-day Trial` : "Request Beta access"}
      </a>
      <p className={styles.note}>
        {trialDays
          ? "Create an account or sign in, accept the engineering disclaimer, and submit a request for approval."
          : "Create an account or sign in, opt in to experimental tools, and submit a Beta request for approval."}
      </p>
    </>
  );
}

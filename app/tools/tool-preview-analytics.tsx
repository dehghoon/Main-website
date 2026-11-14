"use client";

import { useEffect, useRef } from "react";
import { trackToolFunnel } from "@/lib/tool-funnel-analytics";
import { toolRequestPath, type PublicTool } from "@/lib/tool-discovery";

export default function ToolPreviewAnalytics({
  toolKey,
  trialDays,
}: {
  toolKey: PublicTool["key"];
  trialDays: PublicTool["trialDays"];
}) {
  const viewed = useRef(false);
  const accessType = trialDays ? "trial" : "beta";

  useEffect(() => {
    if (viewed.current) return;
    viewed.current = true;
    trackToolFunnel("tool_preview_view", toolKey, accessType);
  }, [toolKey, accessType]);

  return (
    <a
      className="primaryButton"
      href={toolRequestPath(toolKey)}
      onClick={() => trackToolFunnel("tool_access_cta_click", toolKey, accessType)}
    >
      {trialDays ? `Request a ${trialDays}-day Trial` : "Request Beta access"}
    </a>
  );
}

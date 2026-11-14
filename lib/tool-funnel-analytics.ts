import type { EngineeringToolKey } from "./tool-access/catalog";

type ToolFunnelEvent =
  | "tool_preview_view"
  | "tool_access_cta_click"
  | "sign_up"
  | "tool_access_request_submitted";

export function trackToolFunnel(
  event: ToolFunnelEvent,
  toolKey: EngineeringToolKey,
  accessType: "trial" | "beta",
) {
  const { gtag } = window as Window & {
    gtag?: (command: "event", name: string, parameters: Record<string, string>) => void;
  };
  gtag?.("event", event, {
    tool_key: toolKey,
    access_type: accessType,
    page_location: window.location.origin + window.location.pathname,
    ...(event === "sign_up" ? { method: "email" } : {}),
  });
}

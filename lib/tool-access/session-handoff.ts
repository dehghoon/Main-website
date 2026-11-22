/** Transport policy only; backend execution entitlement remains authoritative. */
export const ACCOUNT_ORIGIN = "https://www.linkoteq.com";
export const TOOL_ORIGINS = {
  wind_load: ["https://wind.linkoteq.com", "https://wind-calculator.vercel.app"],
  earthquake: ["https://seismic.linkoteq.com", "https://linkoteq-seismic-preview.vercel.app"],
} as const;
export type HandoffTool = keyof typeof TOOL_ORIGINS;
export function validHandoff(tool: string | null, origin: string | null, state: string | null): tool is HandoffTool {
  return (tool === "wind_load" || tool === "earthquake") &&
    TOOL_ORIGINS[tool].some(value => value === origin) && typeof state === "string" && /^[a-f0-9]{64}$/.test(state);
}
export function safeAccountReturn(value: string | null): string | null {
  if (!value || /[\\\u0000-\u0020]/.test(value) || !value.startsWith("/account/tool-session?")) return null;
  try {
    const url = new URL(value, ACCOUNT_ORIGIN);
    if (url.origin !== ACCOUNT_ORIGIN || url.pathname !== "/account/tool-session" || url.hash) return null;
    return validHandoff(url.searchParams.get("tool"), url.searchParams.get("origin"), url.searchParams.get("state")) ? url.pathname + url.search : null;
  } catch { return null; }
}

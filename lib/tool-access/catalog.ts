/**
 * Central product readiness catalog. This is presentation metadata, NOT authorization.
 * Every tool backend must independently verify a signed-in user's entitlement.
 * Do not grant access from client-side flags, URLs, or this catalog.
 */
export type EngineeringToolKey = "snow_load" | "3d_model" | "w_section" | "wind_load" | "earthquake";
export type ToolReadiness = "released" | "beta" | "unverified";
export const BETA_WARNING = "This tool is under development and testing. Features may be incomplete or produce inaccurate results. Evaluation and feedback only; do not rely on it for professional engineering decisions.";
export const ENGINEERING_TOOLS: ReadonlyArray<{
  key: EngineeringToolKey;
  name: string;
  readiness: ToolReadiness;
  url: string | null;
  trialDays: number | null;
}> = [
  { key: "snow_load", name: "Snow Load", readiness: "released", url: "https://snow.linkoteq.com/", trialDays: 30 },
  { key: "3d_model", name: "3D Structural Model", readiness: "beta", url: "https://3dmodel.linkoteq.com/", trialDays: null },
  { key: "w_section", name: "W-Section", readiness: "unverified", url: "https://wsection.linkoteq.com/", trialDays: null },
  { key: "wind_load", name: "Wind Load", readiness: "beta", url: null, trialDays: null },
  { key: "earthquake", name: "Earthquake / Seismic", readiness: "beta", url: null, trialDays: null },
] as const;

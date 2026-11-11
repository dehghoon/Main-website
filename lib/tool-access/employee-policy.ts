/**
 * Employee entitlement policy shared by Linkoteq engineering tools.
 * This is a pure decision function, not an authentication mechanism.
 * Call only after the backend has verified the JWT and loaded the user's
 * active employee status from trusted server-side membership records.
 */
import type { EngineeringToolKey } from "./catalog";

export type VerifiedToolPrincipal =
  | { kind: "employee"; userId: string; active: true }
  | { kind: "customer"; userId: string };

export type CustomerToolGrant = {
  toolKey: EngineeringToolKey;
  active: boolean;
};

export function canUseEngineeringTool(
  principal: VerifiedToolPrincipal,
  toolKey: EngineeringToolKey,
  customerGrants: readonly CustomerToolGrant[],
): boolean {
  if (principal.kind === "employee") return true;
  return customerGrants.some(grant => grant.toolKey === toolKey && grant.active);
}

/**
 * Never derive employee status from client-submitted role, email domain,
 * signup metadata, or UI state. Each tool's API must enforce this policy
 * after checking trusted membership and customer entitlement records.
 */

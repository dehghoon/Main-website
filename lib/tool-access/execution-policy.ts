// The caller must first authenticate the JWT with Supabase getUser.
type RpcClient = {
  rpc(name: string, args?: Record<string, string>): PromiseLike<{ data: unknown; error: unknown }>;
};
export async function executionDecision(db: RpcClient, tool: "wind_load" | "earthquake" | "wood_design" | "concrete_beam") {
  try {
    const [owner, permissions] = await Promise.all([
      db.rpc("platform_access_is_owner"), db.rpc("platform_my_permissions"),
    ]);
    if (owner.error || permissions.error) return { status: 503, error: "authorization_unavailable" };
    if (owner.data === true || (Array.isArray(permissions.data) && permissions.data.includes("engineering_tools_internal"))) {
      return { status: 200, active: true, tool, accessType: "internal" };
    }
    const grant = await db.rpc("has_active_customer_beta", { p_tool_key: tool });
    if (grant.error) return { status: 503, error: "authorization_unavailable" };
    if (grant.data !== true) return { status: 403, active: false, tool, error: "beta_access_required" };
    return { status: 200, active: true, tool, accessType: "beta" };
  } catch { return { status: 503, error: "authorization_unavailable" }; }
}

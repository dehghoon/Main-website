import { test } from "node:test";
import assert from "node:assert/strict";
import { executionDecision } from "../lib/tool-access/execution-policy.ts";
function db(values: Record<string, unknown>, failures: string[] = []) {
  const calls: Array<[string, unknown]> = [];
  return { calls, rpc: async (name: string, args?: Record<string, string>) => {
    calls.push([name, args]); return { data: values[name], error: failures.includes(name) ? "unavailable" : null };
  } };
}
test("owner and explicitly granted employees may execute", async () => {
  for (const values of [{ platform_access_is_owner: true }, { platform_my_permissions: ["engineering_tools_internal"] }]) {
    const client = db(values);
    assert.equal((await executionDecision(client, "wind_load")).status, 200);
    assert.equal(client.calls.length, 2);
  }
});
test("ordinary authenticated users and unrelated permissions are denied", async () => {
  for (const values of [{}, { platform_my_permissions: ["blog.edit", "timesheet.view_own"] }, { has_active_customer_beta: "true" }]) {
    assert.equal((await executionDecision(db(values), "earthquake")).status, 403);
  }
});
test("approved customer grant is resolved for exactly the requested tool", async () => {
  const client = db({ has_active_customer_beta: true });
  assert.equal((await executionDecision(client, "earthquake")).status, 200);
  assert.deepEqual(client.calls.at(-1), ["has_active_customer_beta", { p_tool_key: "earthquake" }]);
});
test("revoked or expired grants and permission lookup failures fail closed", async () => {
  assert.equal((await executionDecision(db({ has_active_customer_beta: false }), "wind_load")).status, 403);
  for (const failure of ["platform_access_is_owner", "platform_my_permissions", "has_active_customer_beta"]) {
    assert.equal((await executionDecision(db({}, [failure]), "wind_load")).status, 503);
  }
  assert.equal((await executionDecision({ rpc: async () => { throw new Error("offline"); } }, "wind_load")).status, 503);
});

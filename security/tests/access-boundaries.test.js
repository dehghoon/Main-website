const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

test("Blog AI API has server-side employee authorization", () => {
  const src = read("app/api/blog-ai/route.ts");
  assert.match(src, /async function requireEmployee\s*\(/);
  assert.match(src, /\["member","manager","admin"\]\.includes\(role\)/);
  assert.match(src, /if\(!await requireEmployee\(req\)\)/);
  assert.match(src, /status:401/);
});

test("browser Supabase client does not use a service-role key", () => {
  const src = read("lib/supabase-browser.ts");
  assert.match(src, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(src, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.doesNotMatch(src, /SERVICE_ROLE/i);
  assert.doesNotMatch(src, /SUPABASE_SERVICE_KEY/i);
});

test("client workspace still declares authentication as not connected", () => {
  const src = read("app/customer-login/page.tsx");
  assert.match(src, /intentionally not connected to Supabase yet|Database connection will be enabled/);
});

test.todo("replace public employee self-signup with invitation/admin provisioning");
test.todo("enforce employee role on Blog dashboard/data path");
test.todo("replace Timesheet URL-fragment token handoff");
test.todo("add adversarial Supabase RLS tests for anonymous/client/member/manager/admin");
test.todo("prove Starter cannot directly invoke paid report/export/print/upload operations");
test.todo("sanitize Blog HTML and add XSS regression tests");

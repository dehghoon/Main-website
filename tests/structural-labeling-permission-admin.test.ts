import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path: string) {
  return readFileSync(`${process.cwd()}/${path}`, "utf8");
}

test("permission administration is owner/admin controlled and employee scoped", () => {
  const migration = source("supabase/migrations/20261006000200_structural_labeling_permission_admin.sql");

  assert.match(migration, /labeling_permission_admin_allowed/);
  assert.match(migration, /in \('owner', 'admin'\)/);
  assert.match(migration, /target_must_be_employee/);
  assert.match(migration, /labeling\.workspace/);
  assert.match(migration, /labeling\.upload/);
  assert.match(migration, /labeling\.annotate/);
  assert.match(migration, /labeling\.submit/);
  assert.doesNotMatch(
    migration.match(/if p_permission not in \([\s\S]*?\) then/)?.[0] ?? "",
    /labeling\.owner_review|labeling\.gpt7_export/,
  );
});

test("permission mutations are server-side, audited, and audit rows are immutable", () => {
  const migration = source("supabase/migrations/20261006000200_structural_labeling_permission_admin.sql");
  const route = source("app/api/structural-labeling/permissions/route.ts");

  assert.match(migration, /security definer/);
  assert.match(migration, /structural_labeling_permission_audit_events/);
  assert.match(migration, /before update or delete on public\.structural_labeling_permission_audit_events/);
  assert.match(migration, /prevent_structural_labeling_audit_mutation/);
  assert.match(migration, /revoke all on function public\.labeling_manage_employee_permission\(text,text,boolean\) from public, anon/);
  assert.match(route, /labeling_manage_employee_permission/);
  assert.match(route, /requireAuthenticatedUser/);
  assert.doesNotMatch(route, /structural_labeling_permissions"\).insert|structural_labeling_permissions"\).delete/);
});

test("permission UI exposes only operational employee permissions", () => {
  const page = source("app/structural-labeling/regionkit/page.tsx");
  const ui = source("app/structural-labeling/regionkit/StructuralLabelingPermissionAdmin.tsx");

  assert.match(page, /StructuralLabelingPermissionAdmin/);
  assert.match(ui, /labeling\.workspace/);
  assert.match(ui, /labeling\.upload/);
  assert.match(ui, /labeling\.annotate/);
  assert.match(ui, /labeling\.submit/);
  assert.doesNotMatch(ui, /labeling\.owner_review|labeling\.gpt7_export/);
  assert.match(ui, /Owner\/Admin only/);
  assert.match(ui, /permission audit log/);
});

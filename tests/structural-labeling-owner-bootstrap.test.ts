import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path: string) {
  return readFileSync(`${process.cwd()}/${path}`, "utf8");
}

test("owner bootstrap is explicit, first-owner only, and does not grant GPT-7 export", () => {
  const script = source("scripts/bootstrap-structural-labeling-owner.sql");
  const workflow = source(".github/workflows/structural-labeling-owner-bootstrap.yml");

  assert.match(script, /target_user_must_exist_exactly_once/);
  assert.match(script, /existing_owner_detected_bootstrap_refused/);
  assert.match(script, /jsonb_build_object\('role', 'owner', 'user_type', 'owner'\)/);
  assert.match(script, /labeling\.owner_review/);
  assert.doesNotMatch(script, /labeling\.gpt7_export/);
  assert.match(workflow, /BOOTSTRAP STRUCTURAL LABELING OWNER/);
  assert.match(workflow, /pre-owner-bootstrap-schema\.sql/);
  assert.match(workflow, /Historical import apply was not executed/);
  assert.match(workflow, /enablesTraining=false/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = process.cwd();

function source(path: string) {
  return readFileSync(`${root}/${path}`, "utf8");
}

test("owner approval queues a pinned GPT-7 intake handoff without enabling training", () => {
  const migration = source(
    "supabase/migrations/20261009000100_structural_labeling_gpt7_handoff_queue.sql",
  );
  const actionRoute = source("app/api/structural-labeling/action/route.ts");
  const handoffBuilder = source(
    "lib/structural-labeling/gpt7-handoff-server.ts",
  );

  assert.match(
    migration,
    /structural_labeling_gpt7_handoffs/,
  );
  assert.match(
    migration,
    /if n = 'owner-approved' then[\s\S]*insert into public\.structural_labeling_gpt7_handoffs/i,
  );
  assert.match(
    migration,
    /dataset_admission'[\s\S]*pending-gpt7/i,
  );
  assert.match(
    migration,
    /training_ready'[\s\S]*false/i,
  );
  assert.match(
    migration,
    /enablesTraining[\s\S]*false/i,
  );

  assert.match(actionRoute, /action !== "approve"/);
  assert.match(actionRoute, /prepareGpt7Handoff\(supabase, candidateId\)/);
  assert.match(actionRoute, /retry-gpt7-handoff/);
  assert.match(handoffBuilder, /buildGpt7IntakePackage/);
  assert.match(handoffBuilder, /validateGpt7IntakePackage/);
  assert.match(handoffBuilder, /datasetAdmission: pkg\.dataset_admission/);
  assert.match(handoffBuilder, /trainingReady: pkg\.training_ready/);

  assert.doesNotMatch(
    `${migration}\n${actionRoute}\n${handoffBuilder}`,
    /training_ready\s*[:=]\s*true/i,
  );
  assert.doesNotMatch(
    `${migration}\n${actionRoute}\n${handoffBuilder}`,
    /enablesTraining\s*[:=]\s*true/i,
  );
});

test("GPT-7 handoff queue is exposed only through the existing authenticated export boundary", () => {
  const migration = source(
    "supabase/migrations/20261009000100_structural_labeling_gpt7_handoff_queue.sql",
  );
  const queueRoute = source(
    "app/api/structural-labeling/gpt7-handoffs/route.ts",
  );

  assert.match(
    migration,
    /labeling_require\('labeling\.gpt7_export','owner'\)/,
  );
  assert.match(
    migration,
    /revoke all on table public\.structural_labeling_gpt7_handoffs from anon, authenticated/i,
  );
  assert.match(queueRoute, /requireAuthenticatedUser/);
  assert.match(queueRoute, /labeling_list_gpt7_handoffs/);
  assert.match(queueRoute, /datasetAdmission: "pending-gpt7"/);
  assert.match(queueRoute, /trainingReady: false/);
  assert.match(queueRoute, /datasetSplitAssigned: false/);
});

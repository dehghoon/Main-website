import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildGpt7ExportPath } from "../lib/structural-labeling/gpt7-export-path.ts";

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

  assert.match(migration, /structural_labeling_gpt7_handoffs/);
  assert.match(
    migration,
    /if n = 'owner-approved' then[\s\S]*insert into public\.structural_labeling_gpt7_handoffs/i,
  );
  assert.match(migration, /dataset_admission'[\s\S]*pending-gpt7/i);
  assert.match(migration, /training_ready'[\s\S]*false/i);
  assert.match(migration, /enablesTraining[\s\S]*false/i);

  assert.match(actionRoute, /action !== "approve"/);
  assert.match(actionRoute, /prepareGpt7Handoff\(supabase, candidateId\)/);
  assert.match(actionRoute, /retry-gpt7-handoff/);
  assert.match(handoffBuilder, /buildGpt7IntakePackage/);
  assert.match(handoffBuilder, /validateGpt7IntakePackage/);
  assert.match(handoffBuilder, /datasetAdmission: pkg\.dataset_admission/);
  assert.match(handoffBuilder, /trainingReady: pkg\.training_ready/);
  assert.match(handoffBuilder, /buildGpt7ExportPath/);
  assert.match(handoffBuilder, /export_path_scheme: "drawing-page-candidate-v1"/);

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

test("GPT-7 export folders are readable while preserving stable candidate identity", () => {
  assert.equal(
    buildGpt7ExportPath({
      originalFilename: "S3.0_ROOF_FRAMING_PLAN.pdf",
      pageIndex: 0,
      candidateId: "5f997e3e-9c7a-4cd4-98e2-c005f3c12d98",
    }),
    "datasets/manual-labeling-inbox/S3.0_ROOF_FRAMING_PLAN__page-0001__5f997e3e",
  );

  assert.equal(
    buildGpt7ExportPath({
      originalFilename: "S3.0_ROOF_FRAMING_PLAN.pdf",
      pageIndex: 1,
      candidateId: "a1234567-1111-2222-3333-444444444444",
    }),
    "datasets/manual-labeling-inbox/S3.0_ROOF_FRAMING_PLAN__page-0002__a1234567",
  );
});

test("annotated preview uses explicit readable class badges and stored export paths", () => {
  const renderer = source("lib/structural-labeling/gpt7-preview-renderer.ts");
  const previewServer = source("lib/structural-labeling/gpt7-preview-server.ts");
  const previewRoute = source(
    "app/api/structural-labeling/gpt7-handoffs/preview/route.ts",
  );

  assert.match(renderer, /toUpperCase\(\)/);
  assert.match(renderer, /fill-opacity="0\.96"/);
  assert.match(renderer, /font-weight="700"/);
  assert.match(previewServer, /readable-labels-v2/);
  assert.match(previewRoute, /gpt7_export_path/);
  assert.match(previewRoute, /exportPath/);
});

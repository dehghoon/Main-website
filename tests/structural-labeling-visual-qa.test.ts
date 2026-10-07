import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path: string) {
  return readFileSync(`${process.cwd()}/${path}`, "utf8");
}

test("RegionKit remains an external handoff and visual QA stays in LinkoTech", () => {
  const guide = source("app/structural-labeling/StructuralLabelingWorkflowGuide.tsx");
  const regionKitPage = source("app/structural-labeling/regionkit/page.tsx");
  const labelingPage = source("app/structural-labeling/page.tsx");

  assert.match(guide, /RegionKit-assisted external manual labeling/);
  assert.match(guide, /No RegionKit API, no embed, and no server-to-RegionKit publish/);
  assert.match(regionKitPage, /active="labeling"/);
  assert.match(labelingPage, /active="qa"/);
});

test("visual QA reuses the existing private-source overlay editor", () => {
  const editor = source("app/structural-labeling/AnnotationEditor.tsx");
  const workspace = source("app/structural-labeling/StructuralLabelingWorkspace.tsx");

  assert.match(editor, /\/api\/structural-labeling\/source\/\$\{candidate\.id\}/);
  assert.match(editor, /validateRoundTrip/);
  assert.match(editor, /transform_validation_state!==?"validated"|transform_validation_state!=="validated"/);
  assert.match(editor, /source_page_to_raster_affine/);
  assert.match(editor, /LABEL_CLASSES\.map/);
  assert.match(editor, /annotations\.map/);

  assert.match(workspace, /Submit for Owner QA/);
  assert.match(workspace, /Owner QA/);
  assert.match(workspace, /Revision Required/);
  assert.match(workspace, /reason\.trim\(\)/);
  assert.match(workspace, /Pending GPT-7 Admission/);
});

test("visual QA workflow preserves the approved labeling classes and authority boundary", () => {
  const guide = source("app/structural-labeling/StructuralLabelingWorkflowGuide.tsx");

  assert.match(guide, /column, beam, or wall/);
  assert.match(guide, /source-page PDF point boxes/);
  assert.match(guide, /Owner approval does not mean dataset admission or training readiness/);
});

test("RegionKit labeling page exposes the existing authenticated upload path for an empty queue", () => {
  const page = source("app/structural-labeling/regionkit/page.tsx");
  const uploadPanel = source("app/structural-labeling/regionkit/StructuralLabelingUploadPanel.tsx");
  const uploadRoute = source("app/api/structural-labeling/upload/route.ts");

  assert.match(page, /StructuralLabelingUploadPanel/);
  assert.match(uploadPanel, /\/api\/structural-labeling\/upload/);
  assert.match(uploadPanel, /labeling\.upload/);
  assert.match(uploadPanel, /Upload and Create Candidates/);
  assert.match(uploadRoute, /projectGroupId/);
  assert.match(uploadRoute, /labeling\.upload/);
});

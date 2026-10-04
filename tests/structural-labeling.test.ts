import test from "node:test";
import assert from "node:assert/strict";

import {
  GPT7_BOUNDARY,
  LABEL_CLASSES,
  canExportToGpt7,
  canTransition,
  isLabelClass,
  validateBBox,
  type TransformMetadata,
} from "../lib/structural-labeling/contract.ts";
import {
  assertEmployeeAction,
  assertOwnerAction,
} from "../lib/structural-labeling/permissions.ts";
import { validateRoundTrip } from "../lib/structural-labeling/coordinates.ts";

function metadata(rotation: 0 | 90 | 180 | 270): TransformMetadata {
  return {
    coordinate_space: "source-page",
    unit: "pdf-point",
    effective_page_width_pt: 612,
    effective_page_height_pt: 792,
    effective_crop_box_pdf: [0, 0, 612, 792],
    page_rotation_deg: rotation,
    raster_width_px: 1224,
    raster_height_px: 1584,
    display_width_px: 612,
    display_height_px: 792,
    raster_to_source_page_affine: [0.5, 0, 0, 0.5, 0, 0],
    source_page_to_raster_affine: [2, 0, 0, 2, 0, 0],
    display_to_raster_affine: [2, 0, 0, 2, 0, 0],
    render_version: `pdf-render-v1-r${rotation}`,
    transform_validation_state: "validated",
  };
}

test("class allowlist is exact", () => {
  assert.deepEqual(LABEL_CLASSES, ["column", "beam", "wall"]);
  assert.equal(isLabelClass("column"), true);
  assert.equal(isLabelClass("brace"), false);
});

test("workflow blocks invalid transitions", () => {
  assert.equal(canTransition("candidate", "suitable-for-labeling"), true);
  assert.equal(canTransition("candidate", "owner-approved"), false);
  assert.equal(canTransition("submitted-for-owner-qa", "owner-approved"), true);
  assert.equal(canTransition("owner-approved", "labeling-in-progress"), false);
});

test("bbox requires positive area and source-page bounds", () => {
  assert.deepEqual(validateBBox({ xmin: 1, ymin: 2, xmax: 10, ymax: 20 }, 612, 792), []);
  assert.ok(validateBBox({ xmin: 10, ymin: 2, xmax: 10, ymax: 20 }, 612, 792).includes("bbox-must-have-positive-area"));
  assert.ok(validateBBox({ xmin: -1, ymin: 2, xmax: 10, ymax: 20 }, 612, 792).includes("bbox-must-be-within-effective-page-bounds"));
});

test("employee privilege is permission-gated and cannot become owner review", () => {
  assert.doesNotThrow(() => assertEmployeeAction("employee", { "labeling.annotate": true }, "labeling.annotate"));
  assert.throws(() => assertEmployeeAction("employee", {}, "labeling.annotate"));
  assert.throws(() => assertEmployeeAction("client", { "labeling.annotate": true }, "labeling.annotate"));
  assert.throws(() => assertOwnerAction({ "labeling.annotate": true }, "labeling.owner_review"));
  assert.doesNotThrow(() => assertOwnerAction({ "labeling.owner_review": true }, "labeling.owner_review"));
});

test("round-trip validation is deterministic for all allowed rotation metadata values", () => {
  for (const rotation of [0, 90, 180, 270] as const) {
    assert.doesNotThrow(() => validateRoundTrip(metadata(rotation)));
  }
});

test("unvalidated transforms block GPT-7 handoff", () => {
  const valid = metadata(0);
  assert.equal(canExportToGpt7("owner-approved", valid), true);
  assert.equal(canExportToGpt7("submitted-for-owner-qa", valid), false);
  assert.equal(canExportToGpt7("owner-approved", { ...valid, transform_validation_state: "unvalidated" }), false);
  assert.equal(canExportToGpt7("owner-approved", null), false);
});

test("owner approval and dataset admission never imply training readiness", () => {
  assert.equal(GPT7_BOUNDARY.ownerApprovalImpliesDatasetAdmission, false);
  assert.equal(GPT7_BOUNDARY.datasetAdmissionImpliesTrainingReadiness, false);
  assert.equal(GPT7_BOUNDARY.enablesTraining, false);
});

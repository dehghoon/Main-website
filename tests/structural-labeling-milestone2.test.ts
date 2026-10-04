import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyAffine, rasterBBoxToSourcePage, validateRoundTrip } from "../lib/structural-labeling/coordinates.ts";
import type { Annotation, PdfPointBBox, TransformMetadata } from "../lib/structural-labeling/contract.ts";
import { validateAnnotations } from "../lib/structural-labeling/validation.ts";
import { buildGpt7IntakePackage, validateGpt7IntakePackage } from "../lib/structural-labeling/gpt7.ts";

function tx(r: 0|90|180|270): TransformMetadata {
  const w = r===90||r===270 ? 792 : 612, h = r===90||r===270 ? 612 : 792;
  return { coordinate_space:"source-page", unit:"pdf-point", effective_page_width_pt:w,
    effective_page_height_pt:h, effective_crop_box_pdf:[18,36,18+w,36+h], page_rotation_deg:r,
    raster_width_px:w*2, raster_height_px:h*2, display_width_px:w, display_height_px:h,
    raster_to_source_page_affine:[.5,0,0,.5,0,0], source_page_to_raster_affine:[2,0,0,2,0,0],
    display_to_raster_affine:[2,0,0,2,0,0], render_version:`pdfjs-6.3.289-r${r}`,
    transform_validation_state:"validated" };
}
function ann(t: TransformMetadata): Annotation {
  return { annotation_id:"a1", class:"beam", bbox:{xmin:t.effective_page_width_pt*.1,ymin:t.effective_page_height_pt*.2,
    xmax:t.effective_page_width_pt*.55,ymax:t.effective_page_height_pt*.6}, annotation_spec_version:"v0.2", flags:{} };
}
function toRaster(b: PdfPointBBox,t: TransformMetadata): PdfPointBBox {
  const p=[[b.xmin,b.ymin],[b.xmax,b.ymin],[b.xmin,b.ymax],[b.xmax,b.ymax]]
    .map(([x,y])=>applyAffine(t.source_page_to_raster_affine,{x,y}));
  return {xmin:Math.min(...p.map(v=>v.x)),ymin:Math.min(...p.map(v=>v.y)),
    xmax:Math.max(...p.map(v=>v.x)),ymax:Math.max(...p.map(v=>v.y))};
}
for (const r of [0,90,180,270] as const) test(`bbox round trip rotation ${r}`,()=>{
  const t=tx(r), b=ann(t).bbox; validateRoundTrip(t,1e-8);
  assert.deepEqual(rasterBBoxToSourcePage(toRaster(b,t),t),b);
});
test("invalid class/bbox/transform rejected",()=>{
  const t=tx(0);
  assert.match(validateAnnotations([{...ann(t),class:"brace" as "beam"}],t).join(" "),/invalid class/);
  assert.match(validateAnnotations([{...ann(t),bbox:{xmin:2,ymin:2,xmax:2,ymax:3}}],t).join(" "),/positive area/);
  const bad={...t,transform_validation_state:"unvalidated" as const};
  assert.match(validateAnnotations([ann(t)],bad).join(" "),/validated/);
});
test("GPT7 package remains pending admission and never training-ready",()=>{
  const t=tx(0);
  const pkg=buildGpt7IntakePackage({candidate:{id:"c1",source_id:"s1",page_id:"p1",project_group_id:"g1",
    source_ref:"qa-run:r1/a.png",source_sha256:"a".repeat(64),original_filename:"a.png",source_kind:"qa-run",
    workflow_state:"owner-approved",provenance:{},historical_metadata:{}},
    source:{origin_kind:"qa-run",preserved_artifact:true},annotations:[ann(t)],transform:t,audit:[],toolVersion:"m2-test"});
  assert.deepEqual(validateGpt7IntakePackage(pkg),[]);
  assert.equal(pkg.boundary.enablesTraining,false);
  assert.equal(pkg.boundary.ownerApprovalImpliesDatasetAdmission,false);
  assert.equal("dataset_split" in pkg,false);
});
test("database path blocks arbitrary direct mutations and separates privileges",()=>{
  const root=process.cwd();
  const schema=readFileSync(`${root}/supabase/migrations/20261004_structural_labeling_milestone2_authorization.sql`,"utf8");
  const core=readFileSync(`${root}/supabase/migrations/20261004_structural_labeling_milestone2_rpc_core.sql`,"utf8");
  const review=readFileSync(`${root}/supabase/migrations/20261004_structural_labeling_milestone2_rpc_review.sql`,"utf8");
  const foundation=readFileSync(`${root}/supabase/migrations/20261004_structural_labeling_foundation.sql`,"utf8");
  assert.match(schema,/revoke insert,update,delete on public\.structural_labeling_candidates from anon,authenticated/i);
  assert.match(schema,/revoke insert,update,delete on public\.structural_labeling_annotation_revisions from anon,authenticated/i);
  assert.match(core,/employee_cannot_execute_owner_action/);
  assert.match(core,/labeling_require\('labeling\.upload'/);
  assert.match(core,/labeling_require\('labeling\.annotate'/);
  assert.match(review,/labeling\.owner_review/);
  assert.match(review,/labeling\.gpt7_export/);
  assert.match(review,/adjudicates_revision_id/);
  assert.match(foundation,/before update or delete on public\.structural_labeling_audit_events/i);
  assert.doesNotMatch(`${core}\n${review}`,/labeling_require\('labeling\.workspace'/);
});

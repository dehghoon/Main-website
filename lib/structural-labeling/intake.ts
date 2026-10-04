import { LABEL_CLASSES, MANUAL_LABELING_CONTRACT, validateBBox, type TransformMetadata } from "./contract";
import { validateRoundTrip } from "./coordinates";

export type IntakeAnnotation = {
  annotation_id: string;
  class: "column" | "beam" | "wall";
  blox: { xmin: number; ymin: number; xmax: number; ymax: number };
  annotation_spec_version: "v0.2";
  flags: Record<string, unknown>;
};

export type ManualLabelingIntakePackage = {
  schema_version: "manual-labeling-intake-v0.1";
  candidate_id: string;
  source_id: string;
  page_id: string;
  project_group_id: string;
  source: {
    origin: string;
    origin_ref: string;
    sha256: string;
    original_filename: string;
    page_index: number;
    preserved_artifact: true;
  };
  page_geometry: {
    coordinate_space: "source-page";
    unit: "pdf-point";
    effective_page_width_pt: number;
    effective_page_height_pt: number;
    effective_crop_box_pdf: readonly [number, number, number, number];
    page_rotation_deg: 0 | 90 | 180 | 270;
  };
  transform: TransformMetadata;
  annotations: IntakeAnnotation[];
  workflow: {
    state: "owner-approved";
    operator_id: string;
    operator_submitted_at: string;
    owner_id: string;
    owner_decided_at: string;
    owner_disposition: "Owner Approved";
    owner_reason: string | null;
  };
  adjudication_history: Array<Record<string, unknown>>;
  annotation_tool: { name: "Linkoteq Structural Labeling"; version: string };
  provenance_history: Array<Record<string, unknown>>;
  boundary: {
    emitsCanonicalEngineeringGeometry: false;
    enablesTraining: false;
    dataset_admission_status: "pending-gpt7-admission";
  };
};

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateIntakePackage(package: ManualLabelingIntakePackage): string[] {
  const errors: string[] = [];
  if (package.schema_version !== MANUAL_LABELING_CONTRACT.schemaVersion) errors.push("schema_version");
  for (const [id, value] of Object.entries({
    candidate_id: package.candidate_id, source_id: package.source_id, page_id: package.page_id, project_group_id: package.project_group_id,
  })) if (!nonEmpty(value)) errors.push(`invalid_${id}`);
  if (!/^[0-9a-f]{64}$/.test(package.source.sha256)) errors.push("invalid_sha256");
  if (package.source.preserved_artifact !== true) errors.push("source_must_be_preserved");
  if (package.workflow.state !== "owner-approved") errors.push("owner_approval_required");
  if (package.boundary.enablesTraining !== false) errors.push("enablesTraining_must_be_false");
  if (package.boundary.emitsCanonicalEngineeringGeometry !== false) errors.push("emitsCanonicalEngineeringGeometry_must_be_false");
  if (package.page_geometry.coordinate_space !== "source-page" || package.page_geometry.unit !== "pdf-point") errors.push("coordinate_contract");
  try { validateRoundTrip(package.transform, 0.01); } catch { errors.push("invalid_transform_round_trip"); }
  for (const annotation of package.annotations) {
    if (!LABEL_CLASSES.includes(annotation.class)) errors.push(`invalid_class:${annotation.annotation_id}`);
    if (annotation.annotation_spec_version !== "v0.2") errors.push(`invalid_annotation_spec:${annotation.annotation_id}`);
    errors.push(...validateBBox(annotation.bbox, package.page_geometry.effective_page_width_pt, package.page_geometry.effective_page_height_pt));
  }
  return Array.from(new Set(errors));
}

export function deterministicIntakeJson(package: ManualLabelingIntakePackage): string {
  const sorted = { ...package, annotations: [...package.annotations].sort((a, b) => a.annotation_id.localeCompare(b.annotation_id)) };
  return JSON.stringify(sorted, null, 2) + "\n";
}

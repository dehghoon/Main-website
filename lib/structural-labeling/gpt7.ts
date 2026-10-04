import { GPT7_BOUNDARY, MANUAL_LABELING_CONTRACT, type Annotation, type TransformMetadata } from "./contract";
import { assertAnnotationsValid } from "./validation";

export type Gpt7IntakePackage = {
  schema_version: "manual-labeling-intake-v0.1";
  candidate_id: string;
  source_id: string;
  page_id: string;
  project_group_id: string;
  source_origin: string;
  source_ref: string;
  source_sha256: string;
  original_filename: string;
  preserved_artifact: true;
  coordinate_space: "source-page";
  unit: "pdf-point";
  transform: TransformMetadata;
  annotations: Annotation[];
  workflow_state: "owner-approved";
  owner_disposition: "owner-approved";
  adjudication_history: unknown[];
  provenance_history: unknown[];
  annotation_tool: { name: "linkoteq-structural-labeling"; version: string };
  boundary: typeof GPT7_BOUNDARY;
};

export function buildGpt7IntakePackage(input: {
  candidate: Record<string, unknown>;
  source: Record<string, unknown>;
  annotations: Annotation[];
  transform: TransformMetadata;
  audit: unknown[];
  toolVersion: string;
}): Gpt7IntakePackage {
  const { candidate, source, annotations, transform, audit, toolVersion } = input;
  const required = ["id", "source_id", "page_id", "project_group_id", "source_ref", "source_sha256", "original_filename"];
  for (const key of required) {
    if (!candidate[key] || typeof candidate[key] !== "string") throw new Error(`missing_required_candidate_field:${key}`);
  }
  if (candidate.workflow_state !== "owner-approved") throw new Error("owner_approval_required");
  if (!/^[0-9a-f]{64}$/.test(String(candidate.source_sha256))) throw new Error("valid_source_hash_required");
  if (source.preserved_artifact !== true) throw new Error("preserved_source_artifact_required");
  assertAnnotationsValid(annotations, transform);

  return {
    schema_version: MANUAL_LABELING_CONTRACT.schemaVersion,
    candidate_id: String(candidate.id),
    source_id: String(candidate.source_id),
    page_id: String(candidate.page_id),
    project_group_id: String(candidate.project_group_id),
    source_origin: String(source.origin_kind ?? candidate.source_kind),
    source_ref: String(candidate.source_ref),
    source_sha256: String(candidate.source_sha256),
    original_filename: String(candidate.original_filename),
    preserved_artifact: true,
    coordinate_space: "source-page",
    unit: "pdf-point",
    transform,
    annotations,
    workflow_state: "owner-approved",
    owner_disposition: "owner-approved",
    adjudication_history: audit,
    provenance_history: [source.provenance ?? {}, candidate.provenance ?? {}, candidate.historical_metadata ?? {}],
    annotation_tool: { name: "linkoteq-structural-labeling", version: toolVersion },
    boundary: GPT7_BOUNDARY,
  };
}

export function validateGpt7IntakePackage(value: Gpt7IntakePackage): string[] {
  const errors: string[] = [];
  if (value.schema_version !== "manual-labeling-intake-v0.1") errors.push("schema_version");
  if (!value.candidate_id || !value.source_id || !value.page_id || !value.project_group_id) errors.push("stable_identity");
  if (!/^[0-9a-f]{64}$/.test(value.source_sha256)) errors.push("source_sha256");
  if (value.workflow_state !== "owner-approved" || value.owner_disposition !== "owner-approved") errors.push("owner_approval");
  if (value.coordinate_space !== "source-page" || value.unit !== "pdf-point") errors.push("coordinate_boundary");
  if (!value.preserved_artifact) errors.push("preserved_artifact");
  if (value.boundary.enablesTraining !== false) errors.push("enablesTraining");
  try { assertAnnotationsValid(value.annotations, value.transform); } catch (error) {
    errors.push(error instanceof Error ? error.message : "annotation_validation");
  }
  return errors;
}

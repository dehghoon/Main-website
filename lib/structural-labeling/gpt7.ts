import pinnedRules from "../../contracts/gpt7/manual-labeling-intake-validation-rules-v0.1.json";
import {
  GPT7_BOUNDARY,
  MANUAL_LABELING_CONTRACT,
  type Annotation,
  type TransformMetadata,
} from "./contract";
import { assertAnnotationsValid, validateTransformMetadata } from "./validation";

type PinnedRules = typeof pinnedRules;

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
  observed_evidence: {
    gpt6_proposal_observed_gt: false;
    synthetic_overlay_observed_gt: false;
  };
  duplicate_candidates_preserved: true;
  project_group_preserved: true;
  dataset_admission: "pending-gpt7";
  training_ready: false;
  dataset_split_assigned: false;
  boundary: typeof GPT7_BOUNDARY;
};

export const PINNED_GPT7_RULES: PinnedRules = pinnedRules;

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
    if (!candidate[key] || typeof candidate[key] !== "string") {
      throw new Error(`missing_required_candidate_field:${key}`);
    }
  }
  if (candidate.workflow_state !== "owner-approved") throw new Error("owner_approval_required");
  if (!new RegExp(pinnedRules.sha256_pattern).test(String(candidate.source_sha256))) {
    throw new Error("valid_source_hash_required");
  }
  if (source.preserved_artifact !== true) throw new Error("preserved_source_artifact_required");
  assertAnnotationsValid(annotations, transform);

  const pkg: Gpt7IntakePackage = {
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
    coordinate_space: pinnedRules.coordinate.space as "source-page",
    unit: pinnedRules.coordinate.unit as "pdf-point",
    transform,
    annotations,
    workflow_state: "owner-approved",
    owner_disposition: "owner-approved",
    adjudication_history: audit,
    provenance_history: [source.provenance ?? {}, candidate.provenance ?? {}, candidate.historical_metadata ?? {}],
    annotation_tool: { name: "linkoteq-structural-labeling", version: toolVersion },
    observed_evidence: {
      gpt6_proposal_observed_gt: false,
      synthetic_overlay_observed_gt: false,
    },
    duplicate_candidates_preserved: true,
    project_group_preserved: true,
    dataset_admission: "pending-gpt7",
    training_ready: false,
    dataset_split_assigned: false,
    boundary: GPT7_BOUNDARY,
  };

  const errors = validateGpt7IntakePackage(pkg);
  if (errors.length) throw new Error(`pinned_contract_validation_failed:${errors.join(",")}`);
  return pkg;
}

export function validateGpt7IntakePackage(value: Gpt7IntakePackage): string[] {
  const errors: string[] = [];
  const rules = pinnedRules;

  if (rules.contract !== value.schema_version || rules.status !== "active") errors.push("contract");
  for (const field of rules.required_ids) if (!value[field as keyof Gpt7IntakePackage]) errors.push(`required_id:${field}`);
  if (!new RegExp(rules.sha256_pattern).test(value.source_sha256)) errors.push("source_sha256");
  if (value.coordinate_space !== rules.coordinate.space || value.unit !== rules.coordinate.unit) errors.push("coordinate");
  if (value.transform.transform_validation_state !== rules.transform.validated_state) errors.push("transform_validation_state");
  if (!rules.transform.rotation.includes(value.transform.page_rotation_deg)) errors.push("rotation");
  for (const field of rules.transform.fields) if (!(field in value.transform)) errors.push(`transform_field:${field}`);
  if (value.transform.raster_to_source_page_affine.length !== rules.transform.affine_length) errors.push("raster_affine");
  if (value.transform.source_page_to_raster_affine.length !== rules.transform.affine_length) errors.push("inverse_affine");
  if (!rules.active_classes.every((label) => ["column", "beam", "wall"].includes(label))) errors.push("class_rules");
  if (value.annotations.some((annotation) => !rules.active_classes.includes(annotation.class))) errors.push("annotation_class");
  if (value.annotations.some((annotation) => annotation.annotation_spec_version !== rules.annotation_spec_version)) errors.push("annotation_spec");
  if (value.observed_evidence.gpt6_proposal_observed_gt !== rules.gpt6_proposal_observed_gt) errors.push("gpt6_evidence");
  if (value.observed_evidence.synthetic_overlay_observed_gt !== rules.synthetic_overlay_observed_gt) errors.push("synthetic_evidence");
  if (value.duplicate_candidates_preserved !== rules.duplicate_candidates_preserved) errors.push("duplicates");
  if (value.project_group_preserved !== rules.project_group_preserved) errors.push("project_group");
  if (rules.owner_approval_implies_admission !== false || value.dataset_admission !== "pending-gpt7") errors.push("dataset_admission");
  if (rules.admission_implies_training_ready !== false || value.training_ready !== false) errors.push("training_ready");
  if (rules.boundary.enablesTraining !== false || value.boundary.enablesTraining !== false) errors.push("enablesTraining");
  if (value.dataset_split_assigned !== false) errors.push("dataset_split");
  if (rules.transform.pixel_only_admissible !== false) errors.push("pixel_rule");
  const transformErrors = validateTransformMetadata(value.transform);
  errors.push(...transformErrors.map((error) => `transform:${error}`));
  try { assertAnnotationsValid(value.annotations, value.transform); }
  catch (error) { errors.push(error instanceof Error ? error.message : "annotation_validation"); }
  return errors;
}

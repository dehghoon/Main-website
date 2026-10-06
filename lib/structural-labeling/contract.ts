export const MANUAL_LABELING_CONTRACT = {
  repository: "dehghoon/linkoteq-structural-detection",
  activationCommit: "9c3fb7df68f31c7844e8ca357d70fe636d91683a",
  contractPath: "contracts/manual-labeling-intake-v0.1.md",
  validationRulesPath: "contracts/manual-labeling-intake-validation-rules-v0.1.json",
  schemaVersion: "manual-labeling-intake-v0.1",
  annotationSpecVersion: "v0.2",
} as const;

export const LABEL_CLASSES = ["column", "beam", "wall"] as const;
export type LabelClass = (typeof LABEL_CLASSES)[number];

export const WORKFLOW_STATES = [
  "candidate",
  "suitable-for-labeling",
  "unsuitable-for-labeling",
  "labeling-in-progress",
  "submitted-for-owner-qa",
  "owner-approved",
  "owner-rejected",
  "revision-required",
] as const;
export type WorkflowState = (typeof WORKFLOW_STATES)[number];

const TRANSITIONS: Readonly<Record<WorkflowState, readonly WorkflowState[]>> = {
  candidate: ["suitable-for-labeling", "unsuitable-for-labeling"],
  "suitable-for-labeling": ["labeling-in-progress"],
  "unsuitable-for-labeling": [],
  "labeling-in-progress": ["submitted-for-owner-qa"],
  "submitted-for-owner-qa": ["owner-approved", "owner-rejected", "revision-required"],
  "owner-approved": [],
  "owner-rejected": [],
  "revision-required": ["labeling-in-progress"],
};

export function isLabelClass(value: string): value is LabelClass {
  return (LABEL_CLASSES as readonly string[]).includes(value);
}

export function canTransition(from: WorkflowState, to: WorkflowState): boolean {
  return TRANSITIONS[from].includes(to);
}

export type PdfPointBBox = {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
};

export type Affine6 = readonly [number, number, number, number, number, number];

export type TransformMetadata = {
  coordinate_space: "source-page";
  unit: "pdf-point";
  effective_page_width_pt: number;
  effective_page_height_pt: number;
  effective_crop_box_pdf: readonly [number, number, number, number];
  page_rotation_deg: 0 | 90 | 180 | 270;
  raster_width_px: number;
  raster_height_px: number;
  display_width_px?: number;
  display_height_px?: number;
  raster_to_source_page_affine: Affine6;
  source_page_to_raster_affine: Affine6;
  display_to_raster_affine?: Affine6;
  render_version: string;
  transform_validation_state: "validated" | "unvalidated";
};

export type Annotation = {
  annotation_id: string;
  class: LabelClass;
  bbox: PdfPointBBox;
  annotation_spec_version: "v0.2";
  flags: Record<string, boolean | string | number | null>;
};

export function validateBBox(bbox: PdfPointBBox, widthPt: number, heightPt: number): string[] {
  const values = [bbox.xmin, bbox.ymin, bbox.xmax, bbox.ymax, widthPt, heightPt];
  if (!values.every(Number.isFinite)) return ["bbox-and-page-values-must-be-finite"];
  const errors: string[] = [];
  if (!(bbox.xmin < bbox.xmax && bbox.ymin < bbox.ymax)) {
    errors.push("bbox-must-have-positive-area");
  }
  if (bbox.xmin < 0 || bbox.ymin < 0 || bbox.xmax > widthPt || bbox.ymax > heightPt) {
    errors.push("bbox-must-be-within-effective-page-bounds");
  }
  return errors;
}

export function canExportToGpt7(state: WorkflowState, transform: TransformMetadata | null): boolean {
  return state === "owner-approved" && transform?.transform_validation_state === "validated";
}

// Owner approval is intentionally not dataset admission and never implies training readiness.
export const GPT7_BOUNDARY = {
  ownerApprovalImpliesDatasetAdmission: false,
  datasetAdmissionImpliesTrainingReadiness: false,
  enablesTraining: false,
  emitsCanonicalEngineeringGeometry: false,
} as const;

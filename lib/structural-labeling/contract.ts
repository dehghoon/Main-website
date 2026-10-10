export const MANUAL_LABELING_CONTRACT = {
  repository: "dehghoon/linkoteq-structural-detection",
  activationCommit: "755c50aad8ab791d456e106eaa098f7cd415720e",
  contractPath: "contracts/manual-labeling-intake-v0.2.md",
  annotationSpecPath: "contracts/annotation-spec-v0.3.md",
  validationRulesPath: "contracts/manual-labeling-intake-validation-rules-v0.1.json",
  schemaVersion: "manual-labeling-intake-v0.2",
  annotationSpecVersion: "v0.3",
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

export type OrientedBBox = {
  center_x: number;
  center_y: number;
  width: number;
  height: number;
  rotation_deg: number;
};

export type Point2D = { x: number; y: number };

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
  oriented_bbox?: OrientedBBox;
  annotation_spec_version: "v0.2" | "v0.3";
  flags: Record<string, boolean | string | number | null>;
};

export function normalizeRotationDeg(value: number): number {
  if (!Number.isFinite(value)) return value;
  let normalized = ((value + 180) % 360 + 360) % 360 - 180;
  if (Object.is(normalized, -0)) normalized = 0;
  return normalized;
}

export function orientedBBoxCorners(box: OrientedBBox): readonly Point2D[] {
  const angle = (normalizeRotationDeg(box.rotation_deg) * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const hx = box.width / 2;
  const hy = box.height / 2;
  return [
    { x: box.center_x + (-hx * cos - -hy * sin), y: box.center_y + (-hx * sin + -hy * cos) },
    { x: box.center_x + (hx * cos - -hy * sin), y: box.center_y + (hx * sin + -hy * cos) },
    { x: box.center_x + (hx * cos - hy * sin), y: box.center_y + (hx * sin + hy * cos) },
    { x: box.center_x + (-hx * cos - hy * sin), y: box.center_y + (-hx * sin + hy * cos) },
  ];
}

export function bboxFromOrientedBBox(box: OrientedBBox): PdfPointBBox {
  const corners = orientedBBoxCorners(box);
  return {
    xmin: Math.min(...corners.map((point) => point.x)),
    ymin: Math.min(...corners.map((point) => point.y)),
    xmax: Math.max(...corners.map((point) => point.x)),
    ymax: Math.max(...corners.map((point) => point.y)),
  };
}

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

export function validateOrientedBBox(
  box: OrientedBBox,
  envelope: PdfPointBBox,
  widthPt: number,
  heightPt: number,
  tolerance = 0.01,
): string[] {
  const values = [box.center_x, box.center_y, box.width, box.height, box.rotation_deg];
  if (!values.every(Number.isFinite)) return ["oriented-bbox-values-must-be-finite"];
  const errors: string[] = [];
  if (!(box.width > 0 && box.height > 0)) errors.push("oriented-bbox-must-have-positive-area");

  const corners = orientedBBoxCorners(box);
  if (corners.some((point) => point.x < -tolerance || point.y < -tolerance || point.x > widthPt + tolerance || point.y > heightPt + tolerance)) {
    errors.push("oriented-bbox-must-be-within-effective-page-bounds");
  }

  const expected = bboxFromOrientedBBox(box);
  if (
    Math.abs(expected.xmin - envelope.xmin) > tolerance ||
    Math.abs(expected.ymin - envelope.ymin) > tolerance ||
    Math.abs(expected.xmax - envelope.xmax) > tolerance ||
    Math.abs(expected.ymax - envelope.ymax) > tolerance
  ) {
    errors.push("bbox-must-enclose-oriented-bbox");
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

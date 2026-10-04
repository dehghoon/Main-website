import { isLabelClass, type Annotation, type TransformMetadata, validateBBox } from "./contract";
import { validateRoundTrip } from "./coordinates";

export function validateTransformMetadata(transform: TransformMetadata): string[] {
  const errors: string[] = [];
  if (transform.coordinate_space !== "source-page") errors.push("coordinate_space must be source-page");
  if (transform.unit !== "pdf-point") errors.push("unit must be pdf-point");
  if (![0, 90, 180, 270].includes(transform.page_rotation_deg)) errors.push("invalid page rotation");
  if (!(transform.effective_page_width_pt > 0) || !(transform.effective_page_height_pt > 0)) errors.push("invalid effective page dimensions");
  if (!(transform.raster_width_px > 0) || !(transform.raster_height_px > 0)) errors.push("invalid raster dimensions");
  if (transform.raster_to_source_page_affine.length !== 6 || transform.source_page_to_raster_affine.length !== 6) errors.push("affine length must be 6");
  if (transform.display_to_raster_affine && transform.display_to_raster_affine.length !== 6) errors.push("display affine length must be 6");
  if (transform.transform_validation_state !== "validated") errors.push("transform_validation_state must be validated");
  try { validateRoundTrip(transform, 0.01); } catch (error) { errors.push(error instanceof Error ? error.message : "round-trip validation failed"); }
  return errors;
}

export function validateAnnotations(annotations: Annotation[], transform: TransformMetadata): string[] {
  const errors = validateTransformMetadata(transform);
  const seen = new Set<string>();
  for (const annotation of annotations) {
    if (!annotation.annotation_id || seen.has(annotation.annotation_id)) errors.push("annotation_id must be stable and unique");
    seen.add(annotation.annotation_id);
    if (!isLabelClass(annotation.class)) errors.push(`invalid class: ${String(annotation.class)}`);
    if (annotation.annotation_spec_version !== "v0.2") errors.push("annotation_spec_version must be v0.2");
    errors.push(...validateBBox(annotation.bbox, transform.effective_page_width_pt, transform.effective_page_height_pt));
  }
  return errors;
}

export function assertAnnotationsValid(annotations: Annotation[], transform: TransformMetadata) {
  const errors = validateAnnotations(annotations, transform);
  if (errors.length) throw new Error(errors.join("; "));
}

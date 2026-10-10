export const STRUCTURAL_LABELING_SOURCE_BUCKET = "structural-labeling-sources";
export const STRUCTURAL_LABELING_MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
export const STRUCTURAL_LABELING_DIRECT_UPLOAD_THRESHOLD_BYTES = 4 * 1024 * 1024;

export const STRUCTURAL_LABELING_ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export function sanitizeStructuralLabelingFilename(name: string) {
  return name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 180) || "drawing";
}

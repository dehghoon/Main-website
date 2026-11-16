// Reviewed image excerpts only. The source workbooks remain in private storage.
const reviewedPreviews = new Set([
  'fillet-weld-strength',
  'concrete-beam-reinforcement',
  'masonry-pier-checks',
]);

export function localWorkbookPreview(id: string) {
  return reviewedPreviews.has(id) ? `/learning/workbook-previews/${id}.png` : undefined;
}

export function safeGpt7PathSegment(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_") || "drawing";
}

function filenameStem(filename: string): string {
  const safe = safeGpt7PathSegment(filename || "drawing");
  const lastDot = safe.lastIndexOf(".");
  return lastDot > 0 ? safe.slice(0, lastDot) : safe;
}

export function buildGpt7ExportPath(input: {
  originalFilename: string;
  pageIndex: number | null;
  candidateId: string;
}): string {
  const stem = filenameStem(input.originalFilename);
  const page = String((input.pageIndex ?? 0) + 1).padStart(4, "0");
  const shortId = safeGpt7PathSegment(input.candidateId).slice(0, 8);
  return `datasets/manual-labeling-inbox/${stem}__page-${page}__${shortId}`;
}

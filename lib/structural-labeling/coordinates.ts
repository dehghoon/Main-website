import type { Affine6, PdfPointBBox, TransformMetadata } from "./contract";

export type Point = { x: number; y: number };

export function applyAffine(matrix: Affine6, point: Point): Point {
  const [a, b, c, d, e, f] = matrix;
  return { x: a * point.x + c * point.y + e, y: b * point.x + d * point.y + f };
}

export function determinant(matrix: Affine6): number {
  const [a, b, c, d] = matrix;
  return a * d - b * c;
}

export function assertFiniteInvertible(matrix: Affine6): void {
  if (!matrix.every(Number.isFinite)) throw new Error("Affine coefficients must be finite");
  if (Math.abs(determinant(matrix)) <= Number.EPSILON) throw new Error("Affine transform must be invertible");
}

export function validateRoundTrip(metadata: TransformMetadata, tolerance = 0.01): void {
  if (metadata.transform_validation_state !== "validated") throw new Error("Transform must be explicitly validated");
  assertFiniteInvertible(metadata.raster_to_source_page_affine);
  assertFiniteInvertible(metadata.source_page_to_raster_affine);
  if (metadata.display_to_raster_affine) assertFiniteInvertible(metadata.display_to_raster_affine);

  const points: Point[] = [
    { x: 0, y: 0 },
    { x: metadata.raster_width_px, y: 0 },
    { x: 0, y: metadata.raster_height_px },
    { x: metadata.raster_width_px, y: metadata.raster_height_px },
    { x: metadata.raster_width_px / 2, y: metadata.raster_height_px / 2 },
  ];
  for (const point of points) {
    const source = applyAffine(metadata.raster_to_source_page_affine, point);
    const back = applyAffine(metadata.source_page_to_raster_affine, source);
    if (Math.abs(back.x - point.x) > tolerance || Math.abs(back.y - point.y) > tolerance) {
      throw new Error("Raster/source-page affine round trip exceeds tolerance");
    }
  }
}

export function rasterBBoxToSourcePage(bbox: PdfPointBBox, metadata: TransformMetadata): PdfPointBBox {
  validateRoundTrip(metadata);
  const corners = [
    applyAffine(metadata.raster_to_source_page_affine, { x: bbox.xmin, y: bbox.ymin }),
    applyAffine(metadata.raster_to_source_page_affine, { x: bbox.xmax, y: bbox.ymin }),
    applyAffine(metadata.raster_to_source_page_affine, { x: bbox.xmin, y: bbox.ymax }),
    applyAffine(metadata.raster_to_source_page_affine, { x: bbox.xmax, y: bbox.ymax }),
  ];
  return {
    xmin: Math.min(...corners.map((p) => p.x)),
    ymin: Math.min(...corners.map((p) => p.y)),
    xmax: Math.max(...corners.map((p) => p.x)),
    ymax: Math.max(...corners.map((p) => p.y)),
  };
}

export function displayPointToRaster(point: Point, metadata: TransformMetadata): Point {
  const dw = metadata.display_width_px;
  const dh = metadata.display_height_px;
  if (dw === undefined || dh === undefined || (dw === metadata.raster_width_px && dh === metadata.raster_height_px)) return point;
  if (!metadata.display_to_raster_affine) {
    throw new Error("Display/raster dimensions differ but deterministic display-to-raster mapping is missing");
  }
  return applyAffine(metadata.display_to_raster_affine, point);
}

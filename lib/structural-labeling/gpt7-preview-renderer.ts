import sharp from "sharp";
import { applyAffine } from "./coordinates";
import {
  orientedBBoxCorners,
  type Annotation,
  type LabelClass,
  type Point2D,
  type TransformMetadata,
} from "./contract";

const COLORS: Record<LabelClass, string> = {
  column: "#2563eb",
  beam: "#d97706",
  wall: "#dc2626",
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function corners(annotation: Annotation): Point2D[] {
  if (annotation.oriented_bbox) return [...orientedBBoxCorners(annotation.oriented_bbox)];
  const { xmin, ymin, xmax, ymax } = annotation.bbox;
  return [
    { x: xmin, y: ymin },
    { x: xmax, y: ymin },
    { x: xmax, y: ymax },
    { x: xmin, y: ymax },
  ];
}

export async function renderReadableAnnotatedPreviewPng(input: {
  image: Uint8Array;
  annotations: Annotation[];
  transform: TransformMetadata;
}): Promise<Uint8Array> {
  const metadata = await sharp(input.image).metadata();
  const width = metadata.width ?? input.transform.raster_width_px;
  const height = metadata.height ?? input.transform.raster_height_px;

  if (!width || !height) {
    throw new Error("preview_image_dimensions_missing");
  }

  const scaleX = width / input.transform.raster_width_px;
  const scaleY = height / input.transform.raster_height_px;
  const strokeWidth = clamp(Math.round(Math.min(width, height) / 900), 2, 5);
  const fontSize = clamp(Math.round(Math.min(width, height) / 220), 12, 20);
  const padX = clamp(Math.round(fontSize * 0.35), 4, 7);
  const padY = clamp(Math.round(fontSize * 0.18), 2, 4);

  const overlay = input.annotations
    .map((annotation) => {
      const mapped = corners(annotation).map((point) => {
        const raster = applyAffine(
          input.transform.source_page_to_raster_affine,
          point,
        );
        return { x: raster.x * scaleX, y: raster.y * scaleY };
      });

      const color = COLORS[annotation.class];
      const polygon = mapped
        .map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
        .join(" ");

      const minX = clamp(Math.min(...mapped.map((point) => point.x)), 0, width);
      const minY = clamp(Math.min(...mapped.map((point) => point.y)), 0, height);
      const label = annotation.class.toUpperCase();
      const badgeWidth = label.length * fontSize * 0.62 + padX * 2;
      const badgeHeight = fontSize + padY * 2;
      const badgeX = clamp(minX + strokeWidth, 0, Math.max(0, width - badgeWidth));
      const badgeY = clamp(
        minY + strokeWidth,
        0,
        Math.max(0, height - badgeHeight),
      );

      return [
        `<polygon points="${polygon}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" vector-effect="non-scaling-stroke"/>`,
        `<rect x="${badgeX.toFixed(1)}" y="${badgeY.toFixed(1)}" width="${badgeWidth.toFixed(1)}" height="${badgeHeight.toFixed(1)}" rx="3" fill="${color}" fill-opacity="0.78"/>`,
        `<text x="${(badgeX + padX).toFixed(1)}" y="${(badgeY + badgeHeight / 2).toFixed(1)}" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" fill="#ffffff">${label}</text>`,
      ].join("");
    })
    .join("");

  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${overlay}</svg>`,
  );

  const result = await sharp(input.imae)
    .composite([{ input: svg, top: 0, left: 0 }])
    .png()
    .toBuffer();

  return new Uint8Array(result);
}

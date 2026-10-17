import sharp from "sharp";
import { applyAffine } from "./coordinates";
import { orientedBBoxCorners, type Annotation, type LabelClass, type Point2D, type TransformMetadata } from "./contract";

const COLORS: Record<LabelClass, string> = { column: "#2563eb", beam: "#d97706", wall: "#dc2626" };

function pts(a: Annotation): Point2D[] {
  if (a.oriented_bbox) return [...orientedBBoxCorners(a.oriented_bbox)];
  return [
    { x: a.bbox.xmin, y: a.bbox.ymin },
    { x: a.bbox.xmax, y: a.bbox.ymin },
    { x: a.bbox.xmax, y: a.bbox.ymax },
    { x: a.bbox.xmin, y: a.bbox.ymax },
  ];
}

export async function renderReadableAnnotatedPreviewPng(input: {
  image: Uint8Array;
  annotations: Annotation[];
  transform: TransformMetadata;
}): Promise<Uint8Array> {
  const meta = await sharp(input.image).metadata();
  const width = meta.width ?? input.transform.raster_width_px;
  const height = meta.height ?? input.transform.raster_height_px;
  if (!width || !height) throw new Error("preview_image_dimensions_missing");
  const sx = width / input.transform.raster_width_px;
  const sy = height / input.transform.raster_height_px;
  const stroke = Math.max(3, Math.round(Math.min(width, height) / 600));
  const font = Math.max(22, Math.round(Math.min(width, height) / 36));

  const overlay = input.annotations.map((a) => {
    const mapped = pts(a).map((p) => {
      const r = applyAffine(input.transform.source_page_to_raster_affine, p);
      return { x: r.x * sx, y: r.y * sy };
    });
    const color = COLORS[a.class];
    const polygon = mapped.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const x = Math.max(0, Math.min(...mapped.map((p) => p.x)));
    const y0 = Math.max(0, Math.min(...mapped.map((p) => p.y)));
    const label = a.class.toUpperCase();
    const badgeW = Math.max(font * 3.2, label.length * font * 0.8);
    const badgeH = font * 1.5;
    const y = y0 >= badgeH + stroke ? y0 - badgeH - stroke : y0 + stroke;
    return `<polygon points="${polygon}" fill="none" stroke="${color}" stroke-width="${stroke}"/>` +
      `<rect x="${x}" y="${y}" width="${badgeW}" height="${badgeH}" rx="4" fill="${color}" fill-opacity="0.96"/>` +
      `<text x="${x + font * 0.35}" y="${y + badgeH / 2}" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="${font}" font-weight="700" fill="#fff">${label}</text>`;
  }).join("");

  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${overlay}</svg>`);
  const result = await sharp(input.image).composite([{ input: svg, top: 0, left: 0 }]).png().toBuffer();
  return new Uint8Array(result);
}

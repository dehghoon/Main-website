"use client";

import type { PointerEvent as PE } from "react";
import { applyAffine } from "../../lib/structural-labeling/coordinates";
import {
  orientedBBoxCorners,
  type Annotation,
  type LabelClass,
  type Point2D,
  type TransformMetadata,
} from "../../lib/structural-labeling/contract";

const COLORS: Record<LabelClass, { stroke: string; fill: string }> = {
  column: { stroke: "#2563eb", fill: "rgba(37,99,235,.12)" },
  beam: { stroke: "#d97706", fill: "rgba(217,119,6,.12)" },
  wall: { stroke: "#dc2626", fill: "rgba(220,38,38,.12)" },
};

function corners(annotation: Annotation): Point2D[] {
  if (annotation.oriented_bbox) return [...orientedBBoxCorners(annotation.oriented_bbox)];
  const b = annotation.bbox;
  return [
    { x: b.xmin, y: b.ymin },
    { x: b.xmax, y: b.ymin },
    { x: b.xmax, y: b.ymax },
    { x: b.xmin, y: b.ymax },
  ];
}

export default function RotatedAnnotationOverlay({
  annotation,
  transform,
  scale,
  lineWidth,
  fontSize,
  selected,
  interactive,
  rotationEnabled,
  onSelect,
  onBeginRotate,
}: {
  annotation: Annotation;
  transform: TransformMetadata;
  scale: number;
  lineWidth: number;
  fontSize: number;
  selected: boolean;
  interactive: boolean;
  rotationEnabled: boolean;
  onSelect: () => void;
  onBeginRotate: (event: PE<SVGCircleElement>) => void;
}) {
  const mapped = corners(annotation).map((point) => {
    const p = applyAffine(transform.source_page_to_raster_affine, point);
    return { x: p.x * scale, y: p.y * scale };
  });
  const sourceCenter = annotation.oriented_bbox
    ? { x: annotation.oriented_bbox.center_x, y: annotation.oriented_bbox.center_y }
    : {
        x: (annotation.bbox.xmin + annotation.bbox.xmax) / 2,
        y: (annotation.bbox.ymin + annotation.bbox.ymax) / 2,
      };
  const rc = applyAffine(transform.source_page_to_raster_affine, sourceCenter);
  const center = { x: rc.x * scale, y: rc.y * scale };
  const top = {
    x: (mapped[0].x + mapped[1].x) / 2,
    y: (mapped[0].y + mapped[1].y) / 2,
  };
  const vx = top.x - center.x;
  const vy = top.y - center.y;
  const len = Math.max(1, Math.hypot(vx, vy));
  const handle = { x: top.x + (vx / len) * 24, y: top.y + (vy / len) * 24 };
  const color = COLORS[annotation.class];

  return (
    <g>
      <polygon
        points={mapped.map((p) => `${p.x},${p.y}`).join(" ")}
        fill={color.fill}
        stroke={color.stroke}
        strokeWidth={lineWidth}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        onPointerDown={(event) => {
          if (!interactive) return;
          event.stopPropagation();
          onSelect();
        }}
        onKeyDown={(event) => {
          if (interactive && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            onSelect();
          }
        }}
        style={{
          cursor: interactive ? "pointer" : "default",
          outline: selected ? "2px dashed #111827" : undefined,
        }}
      />
      <text
        x={center.x}
        y={center.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fontSize}
        fontWeight={600}
        fill={color.stroke}
        stroke="#fff"
        strokeWidth={3}
        paintOrder="stroke"
        pointerEvents="none"
      >
        {annotation.class}
      </text>
      {rotationEnabled && selected && (
        <>
          <line
            x1={top.x}
            y1={top.y}
            x2={handle.x}
            y2={handle.y}
            stroke="#111827"
            strokeWidth={2}
            pointerEvents="none"
          />
          <circle
            cx={handle.x}
            cy={handle.y}
            r={7}
            fill="#fff"
            stroke="#111827"
            strokeWidth={2}
            style={{ cursor: "grab" }}
            onPointerDown={onBeginRotate}
          />
        </>
      )}
    </g>
  );
}

import sharp from "sharp";
import { applyAffine } from "./coordinates";
import {
  orientedBBoxCorners,
  type Annotation,
  type LabelClass,
  type Point2D,
  type TransformMetadata,
} from "./contract";

type PreviewCommitInput = {
  candidateId: string;
  pageIndex: number;
  previewPng: Uint8Array;
};

type GithubJson = Record<string, unknown>;

const PREVIEW_COLORS: Record<LabelClass, string> = {
  column: "#2563eb",
  beam: "#d97706",
  wall: "#dc2626",
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`missing_server_env:${name}`);
  return value;
}

function annotationCorners(annotation: Annotation): Point2D[] {
  if (annotation.oriented_bbox) return [...orientedBBoxCorners(annotation.oriented_bbox)];
  const box = annotation.bbox;
  return [
    { x: box.xmin, y: box.ymin },
    { x: box.xmax, y: box.ymin },
    { x: box.xmax, y: box.ymax },
    { x: box.xmin, y: box.ymax },
  ];
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function renderAnnotatedPreviewPng(input: {
  image: Uint8Array;
  annotations: Annotation[];
  transform: TransformMetadata;
}): Promise<Uint8Array> {
  const metadata = await sharp(input.image).metadata();
  const width = metadata.width ?? input.transform.raster_width_px;
  const height = metadata.height ?? input.transform.raster_height_px;
  if (!width || !height) throw new Error("preview_image_dimensions_missing");

  const sx = width / input.transform.raster_width_px;
  const sy = height / input.transform.raster_height_px;
  const strokeWidth = Math.max(2, Math.round(Math.min(width, height) / 700));
  const fontSize = Math.max(14, Math.round(Math.min(width, height) / 55));

  const overlay = input.annotations
    .map((annotation) => {
      const mapped = annotationCorners(annotation).map((point) => {
        const raster = applyAffine(input.transform.source_page_to_raster_affine, point);
        return { x: raster.x * sx, y: raster.y * sy };
      });
      const center = {
        x: mapped.reduce((sum, point) => sum + point.x, 0) / mapped.length,
        y: mapped.reduce((sum, point) => sum + point.y, 0) / mapped.length,
      };
      const color = PREVIEW_COLORS[annotation.class];
      const points = mapped.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
      const label = escapeXml(annotation.class);
      return [
        `<polygon points="${points}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" vector-effect="non-scaling-stroke"/>`,
        `<text x="${center.x.toFixed(2)}" y="${center.y.toFixed(2)}" text-anchor="middle" dominant-baseline="middle"`,
        ` font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" fill="${color}"`,
        ` stroke="#ffffff" stroke-width="${Math.max(2, Math.round(strokeWidth * 0.9))}" paint-order="stroke">${label}</text>`,
      ].join("");
    })
    .join("");

  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${overlay}</svg>`,
  );

  const result = await sharp(input.image)
    .composite([{ input: svg, top: 0, left: 0 }])
    .png()
    .toBuffer();

  return new Uint8Array(result);
}

async function githubRequest<T extends GithubJson>(
  url: string,
  init: RequestInit,
  token: string,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`github_preview_export_failed:${response.status}:${text.slice(0, 500)}`);
  }

  return (await response.json()) as T;
}

export async function loadGpt7Image(path: string): Promise<Uint8Array> {
  const token = requireEnv("GPT7_GITHUB_TOKEN");
  const owner = process.env.GPT7_GITHUB_OWNER?.trim() || "dehghoon";
  const repo = process.env.GPT7_GITHUB_REPO?.trim() || "linkoteq-structural-detection";
  const branch = process.env.GPT7_GITHUB_BRANCH?.trim() || "main";
  const apiBase = "https://api.github.com";

  const file = await githubRequest<{ content: string; encoding: string }>(
    `${apiBase}/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`,
    { method: "GET" },
    token,
  );

  if (file.encoding !== "base64") throw new Error("gpt7_preview_source_encoding_unsupported");
  return new Uint8Array(Buffer.from(file.content.replace(/\s/g, ""), "base64"));
}

export async function commitGpt7AnnotatedPreview(
  input: PreviewCommitInput,
): Promise<{ repository: string; commitSha: string; previewPath: string }> {
  const token = requireEnv("GPT7_GITHUB_TOKEN");
  const owner = process.env.GPT7_GITHUB_OWNER?.trim() || "dehghoon";
  const repo = process.env.GPT7_GITHUB_REPO?.trim() || "linkoteq-structural-detection";
  const branch = process.env.GPT7_GITHUB_BRANCH?.trim() || "main";
  const repository = `${owner}/${repo}`;
  const apiBase = "https://api.github.com";
  const exportPath = `datasets/manual-labeling-inbox/${input.candidateId}`;
  const previewPath =
    `${exportPath}/preview/annotated-page-${String(input.pageIndex + 1).padStart(4, "0")}.png`;
  const manifestPath = `${exportPath}/manifest.json`;

  const ref = await githubRequest<{ object: { sha: string } }>(
    `${apiBase}/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`,
    { method: "GET" },
    token,
  );

  const parentCommit = await githubRequest<{ tree: { sha: string } }>(
    `${apiBase}/repos/${owner}/${repo}/git/commits/${ref.object.sha}`,
    { method: "GET" },
    token,
  );

  const manifestResponse = await githubRequest<{ content: string; encoding: string }>(
    `${apiBase}/repos/${owner}/${repo}/contents/${manifestPath}?ref=${encodeURIComponent(branch)}`,
    { method: "GET" },
    token,
  );

  if (manifestResponse.encoding !== "base64") {
    throw new Error("gpt7_manifest_encoding_unsupported");
  }

  const manifest = JSON.parse(
    Buffer.from(manifestResponse.content.replace(/\s/g, ""), "base64").toString("utf8"),
  ) as Record<string, unknown>;

  const existing = Array.isArray(manifest.preview_files) ? manifest.preview_files : [];
  manifest.preview_files = [
    ...existing.filter((item) => {
      if (!item || typeof item !== "object") return true;
      return (item as { page_index?: unknown }).page_index !== input.pageIndex;
    }),
    {
      page_index: input.pageIndex,
      page_number: input.pageIndex + 1,
      path: previewPath,
      mime_type: "image/png",
      purpose: "human-qa-only",
    },
  ];

  const previewBlob = await githubRequest<{ sha: string }>(
    `${apiBase}/repos/${owner}/${repo}/git/blobs`,
    {
      method: "POST",
      body: JSON.stringify({
        content: Buffer.from(input.previewPng).toString("base64"),
        encoding: "base64",
      }),
    },
    token,
  );

  const manifestBlob = await githubRequest<{ sha: string }>(
    `${apiBase}/repos/${owner}/${repo}/git/blobs`,
    {
      method: "POST",
      body: JSON.stringify({
        content: `${JSON.stringify(manifest, null, 2)}\n`,
        encoding: "utf-8",
      }),
    },
    token,
  );

  const tree = await githubRequest<{ sha: string }>(
    `${apiBase}/repos/${owner}/${repo}/git/trees`,
    {
      method: "POST",
      body: JSON.stringify({
        base_tree: parentCommit.tree.sha,
        tree: [
          { path: previewPath, mode: "100644", type: "blob", sha: previewBlob.sha },
          { path: manifestPath, mode: "100644", type: "blob", sha: manifestBlob.sha },
        ],
      }),
    },
    token,
  );

  const commit = await githubRequest<{ sha: string }>(
    `${apiBase}/repos/${owner}/${repo}/git/commits`,
    {
      method: "POST",
      body: JSON.stringify({
        message: `Add annotated preview for manual labeling candidate ${input.candidateId}`,
        tree: tree.sha,
        parents: [ref.object.sha],
      }),
    },
    token,
  );

  await githubRequest(
    `${apiBase}/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ sha: commit.sha, force: false }),
    },
    token,
  );

  return { repository, commitSha: commit.sha, previewPath };
}

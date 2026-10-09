import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildGpt7IntakePackage,
  validateGpt7IntakePackage,
  type Gpt7IntakePackage,
} from "./gpt7";
import { renderPdfPageToPng } from "./pdf-render-server";
import type { Annotation, TransformMetadata } from "./contract";

type CandidateRow = Record<string, unknown> & {
  id: string;
  source_id: string;
  page_id: string;
  page_index: number | null;
  project_group_id: string;
  source_ref: string;
  source_sha256: string;
  original_filename: string;
  workflow_state: string;
};

type SourceRow = Record<string, unknown> & {
  source_id: string;
  storage_path: string;
  mime_type: string;
  original_filename: string;
};

type RevisionRow = {
  annotations: Annotation[];
  transform_metadata: TransformMetadata;
};

type GithubFile = {
  path: string;
  content: string;
  encoding: "utf-8" | "base64";
};

export type Gpt7HandoffResult = {
  repository: string;
  commitSha: string;
  exportPath: string;
  sourcePath: string;
  yoloImagePath: string;
  annotationsPath: string;
  manifestPath: string;
  package: Gpt7IntakePackage;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`missing_server_env:${name}`);
  return value;
}

function safeSegment(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "") || "source";
}

function sourceFilename(source: SourceRow): string {
  const original = safeSegment(source.original_filename || "source");
  if (original.includes(".")) return original;

  const ext =
    source.mime_type === "application/pdf"
      ? ".pdf"
      : source.mime_type === "image/png"
        ? ".png"
        : source.mime_type === "image/jpeg"
          ? ".jpg"
          : source.mime_type === "image/webp"
            ? ".webp"
            : "";

  return `${original}${ext}`;
}

async function githubJson<T>(
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
    throw new Error(
      `github_export_failed:${response.status}:${text.slice(0, 500)}`,
    );
  }

  return (await response.json()) as T;
}

async function createBlob(input: {
  apiBase: string;
  token: string;
  owner: string;
  repo: string;
  file: GithubFile;
}): Promise<{ sha: string }> {
  return githubJson<{ sha: string }>(
    `${input.apiBase}/repos/${input.owner}/${input.repo}/git/blobs`,
    {
      method: "POST",
      body: JSON.stringify({
        content: input.file.content,
        encoding: input.file.encoding,
      }),
    },
    input.token,
  );
}

async function commitGithubBundle(input: {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  files: GithubFile[];
  message: string;
}): Promise<string> {
  const apiBase = "https://api.github.com";

  const ref = await githubJson<{ object: { sha: string } }>(
    `${apiBase}/repos/${input.owner}/${input.repo}/git/ref/heads/${encodeURIComponent(input.branch)}`,
    { method: "GET" },
    input.token,
  );

  const parentCommit = await githubJson<{ tree: { sha: string } }>(
    `${apiBase}/repos/${input.owner}/${input.repo}/git/commits/${ref.object.sha}`,
    { method: "GET" },
    input.token,
  );

  const blobs = await Promise.all(
    input.files.map(async (file) => ({
      file,
      blob: await createBlob({
        apiBase,
        token: input.token,
        owner: input.owner,
        repo: input.repo,
        file,
      }),
    })),
  );

  const tree = await githubJson<{ sha: string }>(
    `${apiBase}/repos/${input.owner}/${input.repo}/git/trees`,
    {
      method: "POST",
      body: JSON.stringify({
        base_tree: parentCommit.tree.sha,
        tree: blobs.map(({ file, blob }) => ({
          path: file.path,
          mode: "100644",
          type: "blob",
          sha: blob.sha,
        })),
      }),
    },
    input.token,
  );

  const commit = await githubJson<{ sha: string }>(
    `${apiBase}/repos/${input.owner}/${input.repo}/git/commits`,
    {
      method: "POST",
      body: JSON.stringify({
        message: input.message,
        tree: tree.sha,
        parents: [ref.object.sha],
      }),
    },
    input.token,
  );

  await githubJson(
    `${apiBase}/repos/${input.owner}/${input.repo}/git/refs/heads/${encodeURIComponent(input.branch)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ sha: commit.sha, force: false }),
    },
    input.token,
  );

  return commit.sha;
}

export async function prepareGpt7Handoff(
  supabase: SupabaseClient,
  candidateId: string,
): Promise<Gpt7HandoffResult> {
  const [
    { data: candidate, error: candidateError },
    { data: revision, error: revisionError },
    { data: audit, error: auditError },
  ] = await Promise.all([
    supabase
      .from("structural_labeling_candidates")
      .select("*")
      .eq("id", candidateId)
      .single(),
    supabase
      .from("structural_labeling_annotation_revisions")
      .select("annotations,transform_metadata")
      .eq("candidate_id", candidateId)
      .order("revision_no", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("structural_labeling_audit_events")
      .select("*")
      .eq("candidate_id", candidateId)
      .order("created_at", { ascending: true }),
  ]);

  if (candidateError || !candidate) {
    throw new Error(candidateError?.message ?? "candidate_not_found");
  }
  if (revisionError || !revision) {
    throw new Error(revisionError?.message ?? "annotation_revision_required");
  }
  if (auditError) throw new Error(auditError.message);

  const typedCandidate = candidate as CandidateRow;
  if (typedCandidate.workflow_state !== "owner-approved") {
    throw new Error("owner_approval_required");
  }

  const { data: source, error: sourceError } = await supabase
    .from("structural_labeling_sources")
    .select("*")
    .eq("source_id", typedCandidate.source_id)
    .single();

  if (sourceError || !source) {
    throw new Error(sourceError?.message ?? "source_not_found");
  }

  const typedSource = source as SourceRow;
  const { data: sourceBlob, error: downloadError } = await supabase.storage
    .from("structural-labeling-sources")
    .download(typedSource.storage_path);

  if (downloadError || !sourceBlob) {
    throw new Error(downloadError?.message ?? "source_download_failed");
  }

  const sourceBytes = new Uint8Array(await sourceBlob.arrayBuffer());
  const typedRevision = revision as RevisionRow;

  const pkg = buildGpt7IntakePackage({
    candidate: typedCandidate,
    source: typedSource,
    annotations: typedRevision.annotations,
    transform: typedRevision.transform_metadata,
    audit: audit ?? [],
    toolVersion: "github-handoff-v2-raster",
  });

  const validationErrors = validateGpt7IntakePackage(pkg);
  if (validationErrors.length > 0) {
    throw new Error(
      `pinned_contract_validation_failed:${validationErrors.join(",")}`,
    );
  }

  const token = requireEnv("GPT7_GITHUB_TOKEN");
  const owner = process.env.GPT7_GITHUB_OWNER?.trim() || "dehghoon";
  const repo =
    process.env.GPT7_GITHUB_REPO?.trim() || "linkoteq-structural-detection";
  const branch = process.env.GPT7_GITHUB_BRANCH?.trim() || "main";
  const repository = `${owner}/${repo}`;

  const exportPath = `datasets/manual-labeling-inbox/${candidateId}`;
  const originalSourcePath =
    `${exportPath}/original/${sourceFilename(typedSource)}`;
  const annotationsPath = `${exportPath}/annotations.json`;
  const manifestPath = `${exportPath}/manifest.json`;

  const files: GithubFile[] = [
    {
      path: originalSourcePath,
      content: Buffer.from(sourceBytes).toString("base64"),
      encoding: "base64",
    },
  ];

  let yoloImagePath = originalSourcePath;
  let renderedImage:
    | {
        path: string;
        page_index: number;
        width_px: number;
        height_px: number;
        render_scale: number;
        mime_type: "image/png";
      }
    | null = null;

  if (typedSource.mime_type === "application/pdf") {
    const pageIndex = typedCandidate.page_index ?? 0;
    const rendered = await renderPdfPageToPng(sourceBytes, pageIndex);
    yoloImagePath =
      `${exportPath}/rendered/page-${String(pageIndex + 1).padStart(4, "0")}.png`;

    renderedImage = {
      path: yoloImagePath,
      page_index: pageIndex,
      width_px: rendered.widthPx,
      height_px: rendered.heightPx,
      render_scale: rendered.scale,
      mime_type: "image/png",
    };

    files.push({
      path: yoloImagePath,
      content: Buffer.from(rendered.png).toString("base64"),
      encoding: "base64",
    });
  }

  const annotationDocument = {
    schema_version: pkg.schema_version,
    candidate_id: pkg.candidate_id,
    source_id: pkg.source_id,
    page_id: pkg.page_id,
    coordinate_space: pkg.coordinate_space,
    unit: pkg.unit,
    transform: pkg.transform,
    raster_target: {
      path: yoloImagePath,
      width_px: renderedImage?.width_px ?? pkg.transform.raster_width_px,
      height_px: renderedImage?.height_px ?? pkg.transform.raster_height_px,
    },
    annotations: pkg.annotations,
  };

  const manifest = {
    handoff_version: "github-manual-labeling-v2",
    source_repository: "dehghoon/Main-website",
    destination_repository: repository,
    candidate_id: pkg.candidate_id,
    source_id: pkg.source_id,
    project_group_id: pkg.project_group_id,
    source_sha256: pkg.source_sha256,
    original_filename: pkg.original_filename,
    source_mime_type: typedSource.mime_type,
    page_index: typedCandidate.page_index ?? 0,
    workflow_state: pkg.workflow_state,
    owner_disposition: pkg.owner_disposition,
    dataset_admission: "pending-gpt7",
    training_ready: false,
    dataset_split_assigned: false,
    original_source_file: originalSourcePath,
    yolo_image_file: yoloImagePath,
    rendered_image: renderedImage,
    annotations_file: annotationsPath,
    annotation_coordinate_space: pkg.coordinate_space,
    annotation_unit: pkg.unit,
    transform: pkg.transform,
    note:
      typedSource.mime_type === "application/pdf"
        ? "Original PDF is preserved for provenance. GPT-7/YOLO consumes the rendered PNG page referenced by yolo_image_file."
        : "Original raster image is the GPT-7/YOLO image candidate.",
    created_at: new Date().toISOString(),
  };

  files.push(
    {
      path: annotationsPath,
      content: `${JSON.stringify(annotationDocument, null, 2)}\n`,
      encoding: "utf-8",
    },
    {
      path: manifestPath,
      content: `${JSON.stringify(manifest, null, 2)}\n`,
      encoding: "utf-8",
    },
  );

  const commitSha = await commitGithubBundle({
    token,
    owner,
    repo,
    branch,
    message: `Add approved manual labeling candidate ${candidateId}`,
    files,
  });

  const receipt = await supabase.rpc("labeling_record_gpt7_github_export", {
    p_id: candidateId,
    p_repository: repository,
    p_commit_sha: commitSha,
    p_export_path: exportPath,
  });

  if (receipt.error) throw new Error(receipt.error.message);

  return {
    repository,
    commitSha,
    exportPath,
    sourcePath: originalSourcePath,
    yoloImagePath,
    annotationsPath,
    manifestPath,
    package: pkg,
  };
}

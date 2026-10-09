import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildGpt7IntakePackage,
  validateGpt7IntakePackage,
  type Gpt7IntakePackage,
} from "./gpt7";
import type { Annotation, TransformMetadata } from "./contract";

type CandidateRow = Record<string, unknown> & {
  id: string;
  source_id: string;
  page_id: string;
  project_group_id: string;
  source_ref: string;
  source_sha256: string;
  original_filename: string;
  workflow_state: string;
  gpt7_commit_sha?: string | null;
  gpt7_export_path?: string | null;
  gpt7_repository?: string | null;
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

export type Gpt7HandoffResult = {
  repository: string;
  commitSha: string;
  exportPath: string;
  sourcePath: string;
  annotationsPath: string;
  manifestPath: string;
  package: Gpt7IntakePackage;
};

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`missing_server_env:${name}`);
  return value;
}

function safeSegment(value: string) {
  return value.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "") || "source";
}

function sourceFilename(source: SourceRow) {
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

async function githubJson<T>(url: string, init: RequestInit, token: string): Promise<T> {
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
    throw new Error(`github_export_failed:${response.status}:${text.slice(0, 500)}`);
  }

  return (await response.json()) as T;
}

async function createBlob(
  apiBase: string,
  token: string,
  owner: string,
  repo: string,
  content: string,
  encoding: "utf-8" | "base64",
) {
  return githubJson<{ sha: string }>(
    `${apiBase}/repos/${owner}/${repo}/git/blobs`,
    {
      method: "POST",
      body: JSON.stringify({ content, encoding }),
    },
    token,
  );
}

async function commitGithubBundle(input: {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  files: Array<{ path: string; content: string; encoding: "utf-8" | "base64" }>;
  message: string;
}) {
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
      blob: await createBlob(
        apiBase,
        input.token,
        input.owner,
        input.repo,
        file.content,
        file.encoding,
      ),
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
  const [{ data: candidate, error: candidateError }, { data: revision, error: revisionError }, { data: audit, error: auditError }] =
    await Promise.all([
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

  if (candidateError || !candidate) throw new Error(candidateError?.message ?? "candidate_not_found");
  if (revisionError || !revision) throw new Error(revisionError?.message ?? "annotation_revision_required");
  if (auditError) throw new Error(auditError.message);

  const typedCandidate = candidate as CandidateRow;
  if (typedCandidate.workflow_state !== "owner-approved") throw new Error("owner_approval_required");

  const { data: source, error: sourceError } = await supabase
    .from("structural_labeling_sources")
    .select("*")
    .eq("source_id", typedCandidate.source_id)
    .single();

  if (sourceError || !source) throw new Error(sourceError?.message ?? "source_not_found");
  const typedSource = source as SourceRow;

  const { data: sourceBlob, error: downloadError } = await supabase.storage
    .from("structural-labeling-sources")
    .download(typedSource.storage_path);

  if (downloadError || !sourceBlob) throw new Error(downloadError?.message ?? "source_download_failed");

  const sourceBytes = new Uint8Array(await sourceBlob.arrayBuffer());
  const typedRevision = revision as RevisionRow;

  const pkg = buildGpt7IntakePackage({
    candidate: typedCandidate,
    source: typedSource,
    annotations: typedRevision.annotations,
    transform: typedRevision.transform_metadata,
    audit: audit ?? [],
    toolVersion: "github-handoff-v1",
  });

  const validationErrors = validateGpt7IntakePackage(pkg);
  if (validationErrors.length) {
    throw new Error( pinned_contract_validation_failed:${validationErrors.join(",")}`);
  }

  const token = requireEnv("GPT7_GITHUB_TOKEN");
  const owner = process.env.GPT7_GITHUB_OWNER?.trim() || "dehghoon";
  const repo = process.env.GPT7_GITHUB_REPO?.trim() || "linkoteq-structural-detection";
  const branch = process.env.GPT7_GITHUB_BRANCH?.trim() || "main";
  const repository = `${owner}/${repo}`;
  const exportPath = `datasets/manual-labeling-inbox/${candidateId}`;
  const originalSourcePath = `${exportPath}/${sourceFileName(typedSource)}`;
  const annotationsPath = `${exportPath}/annotations.json`;
  const manifestPath = `${exportPath}/manifest.json`;

  const annotationDocument = {
    schema_version: pkg.schema_version,
    candidate_id: pkg.candidate_id,
    source_id: pkg.source_id,
    page_id: pkg.page_id,
    coordinate_space: pkg.coordinate_space,
    unit: pkg.unit,
    transform: pkg.transform,
    annotations: pkg.annotations,
  };

  const manifest = {
    handoff_version: "github-manual-labeling-v1",
    source_repository: "dehghoon/Main-website",
    destination_repository: repository,
    candidate_id: pkg.candidate_id,
    source_id: pkg.source_id,
    project_group_id: pkg.project_group_id,
    source_sha256: pkg.source_sha256,
    original_filename: pkg.original_filename,
    workflow_state: pkg.workflow_state,
    owner_disposition: pkg.owner_disposition,
    dataset_admission: "pending-gpt7",
    training_ready: false,
    dataset_split_assigned: false,
    source_file: originalSourcePath,
    annotations_file: annotationsPath,
    created_at: new Date().toISOString(),
  };

  const sourceBase64 = Buffer.from(sourceBytes).toString("base64");
  const commitSha = await commitGithubBundle({
    token,
    owner,
    repo,
    branch,
    message: `Add approved manual labeling candidate ${candidateId}`,
    files: [
      { path: originalSourcePath, content: sourceBase64, encoding: "base64" },
      { path: annotationsPath, content: `${JSON.stringify(annotationDocument, null, 2)}\n`, encoding: "utf-8" },
      { path: manifestPath, content: `${JSON.stringify(manifest, null, 2)}\n`, encoding: "utf-8" },
    ],
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
    annotationsPath,
    manifestPath,
    package: pkg,
  };
}

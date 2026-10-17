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

export type PreRenderedPdfPage = {
  png: Uint8Array;
  widthPx: number;
  heightPx: number;
  scale: number;
  pageIndex: number;
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
  preRenderedPdfPage?: PreRenderedPdfPage | null,
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
    throw new Error "owner_approval_required";
}

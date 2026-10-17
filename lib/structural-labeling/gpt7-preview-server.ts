import { renderReadableAnnotatedPreviewPng } from "./gpt7-preview-renderer";

type PreviewCommitInput = {
  candidateId: string;
  pageIndex: number;
  previewPng: Uint8Array;
  exportPath?: string | null;
};

type GithubJson = Record<string, unknown>;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`missing_server_env:${name}`);
  return value;
}

function config() {
  return {
    token: requireEnv("GPT7_GITHUB_TOKEN"),
    owner: process.env.GPT7_GITHUB_OWNER?.trim() || "dehghoon",
    repo: process.env.GPT7_GITHUB_REPO?.trim() || "linkoteq-structural-detection",
    branch: process.env.GPT7_GITHUB_BRANCH?.trim() || "main",
    apiBase: "https://api.github.com",
  };
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

export const renderAnnotatedPreviewPng = renderReadableAnnotatedPreviewPng;

export async function loadGpt7Image(path: string): Promise<Uint8Array> {
  const { token, owner, repo, branch, apiBase } = config();
  const response = await fetch(
    `${apiBase}/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/vnd.github.raw+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`gpt7_preview_source_load_failed:${response.status}:${text.slice(0, 500)}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

export async function commitGpt7AnnotatedPreview(
  input: PreviewCommitInput,
): Promise<{ repository: string; commitSha: string; previewPath: string }> {
  const { token, owner, repo, branch, apiBase } = config();
  const repository = `${owner}/${repo}`;
  const exportPath =
    input.exportPath?.trim() || `datasets/manual-labeling-inbox/${input.candidateId}`;
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
      renderer_version: "bitmap-labels-v4",
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
        message: `Add readable annotated preview for manual labeling candidate ${input.candidateId}`,
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

import { createHash } from "node:crypto";
import { unzipSync } from "fflate";

const OWNER = "dehghoon";
const REPO = "linkoteq-structural-detection";
const RUNS_REF = process.env.DETECTION_RUNS_REF || "qa-review-artifacts";
const RUNS_PATH = process.env.DETECTION_RUNS_PATH || "runs";
const ZIP_REF = process.env.DETECTION_ZIP_REF || "main";
const ZIP_PATH = process.env.DETECTION_ZIP_PATH || "remaing-15-existing-images.zip";
const IMAGE_RE = /\.(png|jpe?g|webp)$/i;
const JSON_RE = /\.json(l)?$/i;

function headers() {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "linkoteq-labeling-discovery",
    ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
  };
}

async function api(path) {
  const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}${path}`, {
    headers: headers(),
  });
  if (!response.ok) {
    throw new Error(`GitHub ${response.status} ${path}: ${(await response.text()).slice(0, 300)}`);
  }
  return response.json();
}

async function treeForRef(ref) {
  const branch = await api(`/branches/${encodeURIComponent(ref)}`);
  const treeSha = branch.commit.commit.tree.sha;
  const tree = await api(`/git/trees/${treeSha}?recursive=1`);
  if (tree.truncated) throw new Error(`Git tree for ${ref} is truncated`);
  return tree.tree;
}

async function rawBytes(ref, path) {
  const url = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${encodeURIComponent(ref)}/${path.split("/").map(encodeURIComponent).join("/")}`;
  const response = await fetch(url, { headers: process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {} });
  if (!response.ok) throw new Error(`Download ${response.status}: ${ref}:${path}`);
  return new Uint8Array(await response.arrayBuffer());
}

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function main() {
  const runTree = await treeForRef(RUNS_REF);
  const runPrefix = `${RUNS_PATH}/`;
  const runIds = [...new Set(
    runTree
      .filter((entry) => entry.path.startsWith(runPrefix))
      .map((entry) => entry.path.slice(runPrefix.length).split("/")[0])
      .filter(Boolean),
  )].sort();

  const runs = runIds.map((runId) => {
    const prefix = `${RUNS_PATH}/${runId}/`;
    const files = runTree.filter((entry) => entry.type === "blob" && entry.path.startsWith(prefix));
    const recursiveImages = files.filter((entry) => IMAGE_RE.test(entry.path));
    const sourceImages = recursiveImages.filter((entry) => entry.path.includes("/images/source/"));
    return {
      runId,
      recursiveImageCount: recursiveImages.length,
      sourceCandidateImageCount: sourceImages.length,
      jsonCount: files.filter((entry) => JSON_RE.test(entry.path)).length,
      sourceImages,
    };
  });

  const imageRuns = runs.filter((run) => run.sourceCandidateImageCount > 0);
  const jsonOnlyRuns = runs.filter((run) => run.sourceCandidateImageCount === 0 && run.jsonCount > 0);
  if (imageRuns.length !== 4) throw new Error(`Expected 4 image-containing runs, found ${imageRuns.length}`);
  if (jsonOnlyRuns.length !== 1) throw new Error(`Expected 1 JSON-only run, found ${jsonOnlyRuns.length}`);

  const blobBytes = new Map();
  for (const run of imageRuns) {
    for (const image of run.sourceImages) {
      if (!blobBytes.has(image.sha)) {
        blobBytes.set(image.sha, await rawBytes(RUNS_REF, image.path));
      }
    }
  }

  const origins = [];
  for (const run of imageRuns) {
    for (const image of run.sourceImages) {
      origins.push({
        originKind: "qa-run",
        originRef: `${OWNER}/${REPO}@${RUNS_REF}:${image.path}`,
        gitBlobSha: image.sha,
        bytes: blobBytes.get(image.sha),
      });
    }
  }

  const zipBytes = await rawBytes(ZIP_REF, ZIP_PATH);
  const archive = unzipSync(zipBytes);
  const zipImages = Object.entries(archive)
    .filter(([name]) => IMAGE_RE.test(name))
    .map(([name, value]) => ({ name, bytes: new Uint8Array(value) }));

  for (const image of zipImages) {
    origins.push({
      originKind: "legacy-zip",
      originRef: `${OWNER}/${REPO}@${ZIP_REF}:${ZIP_PATH}#${image.name}`,
      gitBlobSha: null,
      bytes: image.bytes,
    });
  }

  const canonicalByHash = new Map();
  const originRows = [];
  for (const origin of origins) {
    const hash = sha256(origin.bytes);
    const canonicalContentIdentity = canonicalByHash.get(hash) || `sha256:${hash}`;
    const duplicateOf = canonicalByHash.has(hash) ? canonicalContentIdentity : null;
    if (!canonicalByHash.has(hash)) canonicalByHash.set(hash, canonicalContentIdentity);
    originRows.push({
      originKind: origin.originKind,
      originRef: origin.originRef,
      sha256: hash,
      canonicalContentIdentity,
      duplicateOf,
    });
  }

  const grouped = new Map();
  for (const row of originRows) {
    const list = grouped.get(row.sha256) || [];
    list.push(row.originRef);
    grouped.set(row.sha256, list);
  }

  const exactDuplicateGroups = [...grouped.entries()]
    .filter(([, refs]) => refs.length > 1)
    .map(([hash, refs]) => ({
      sha256: hash,
      originRecordCount: refs.length,
      origins: refs,
    }));

  const report = {
    runsRef: RUNS_REF,
    runsPath: RUNS_PATH,
    zipRef: ZIP_REF,
    zipPath: ZIP_PATH,
    runIdsInspected: runs.map((run) => run.runId),
    imageContainingRunIds: imageRuns.map((run) => run.runId),
    jsonOnlyRunId: jsonOnlyRuns[0].runId,
    recursiveImageCountPerRun: Object.fromEntries(runs.map((run) => [run.runId, run.recursiveImageCount])),
    sourceCandidateImageCountPerRun: Object.fromEntries(runs.map((run) => [run.runId, run.sourceCandidateImageCount])),
    zipImageCount: zipImages.length,
    totalOriginRecordCount: originRows.length,
    uniqueSha256ContentIdentityCount: canonicalByHash.size,
    exactSha256DuplicateOriginCount: originRows.length - canonicalByHash.size,
    exactSha256DuplicateGroupCount: exactDuplicateGroups.length,
    exactSha256DuplicateGroups: exactDuplicateGroups,
    origins: originRows,
    nearDuplicateStatus: "not-evaluated-by-website-importer; GPT-7-owned",
    proposedCandidateQueueRule: "one labeling candidate per unique SHA-256 content identity; preserve all origin records as provenance references on that candidate",
    databaseWrites: 0,
    assignsDatasetSplits: false,
    enablesTraining: false,
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

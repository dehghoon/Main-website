import { createHash } from "node:crypto";
import { unzipSync } from "fflate";

const OWNER = "dehghoon";
const REPO = "linkoteq-structural-detection";
const RUNS_REF = process.env.DETECTION_RUNS_REF || "qa-review-artifacts";
const RUNS_PATH = process.env.DETECTION_RUNS_PATH || "runs";
const ZIP_REF = process.env.DETECTION_ZIP_REF || "main";
const ZIP_PATH = process.env.DETECTION_ZIP_PATH || "remaing-15-existing-images.zip";
const IMAGE = /\.(png|jpe?g|webp)$/i;

function headers() {
  const h = { Accept: "application/vnd.github+json", "User-Agent": "linkoteq-labeling-discovery" };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}
async function contents(path, ref) {
  const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${encodeURIComponent(ref)}`, { headers: headers() });
  if (!r.ok) throw new Error(`GitHub ${r.status} ${ref}:${path}`);
  return r.json();
}
async function bytes(url) {
  const r = await fetch(url, { headers: headers() });
  if (!r.ok) throw new Error(`Download ${r.status}: ${url}`);
  return new Uint8Array(await r.arrayBuffer());
}
async function walk(path, ref) {
  const v = await contents(path, ref);
  if (!Array.isArray(v)) return [v];
  const out = [];
  for (const e of v) {
    if (e.type === "file") out.push(e);
    else if (e.type === "dir") out.push(...await walk(e.path, ref));
  }
  return out;
}
const sha256 = (b) => createHash("sha256").update(b).digest("hex");

async function main() {
  const root = await contents(RUNS_PATH, RUNS_REF);
  const runs = [];
  const raw = [];
  for (const dir of root.filter((e) => e.type === "dir")) {
    const files = await walk(dir.path, RUNS_REF);
    const allImages = files.filter((f) => IMAGE.test(f.name));
    const sourceImages = allImages.filter((f) => f.path.includes("/images/source/"));
    runs.push({
      runId: dir.name,
      recursiveImageCount: allImages.length,
      sourceCandidateImageCount: sourceImages.length,
      jsonCount: files.filter((f) => /\.json(l)?$/i.test(f.name)).length,
    });
    for (const f of sourceImages) {
      raw.push({
        originRef: `${OWNER}/${REPO}@${RUNS_REF}:${f.path}`,
        data: await bytes(f.download_url),
      });
    }
  }

  const zipEntry = await contents(ZIP_PATH, ZIP_REF);
  const archive = unzipSync(await bytes(zipEntry.download_url));
  const zipImages = Object.entries(archive).filter(([name]) => IMAGE.test(name));
  for (const [name, data] of zipImages) {
    raw.push({
      originRef: `${OWNER}/${REPO}@${ZIP_REF}:${ZIP_PATH}#${name}`,
      data: new Uint8Array(data),
    });
  }

  const canonical = new Map();
  let exactDuplicates = 0;
  const origins = raw.map(({ originRef, data }) => {
    const hash = sha256(data);
    const canonicalContentIdentity = canonical.get(hash) || `sha256:${hash}`;
    const duplicateOf = canonical.has(hash) ? canonicalContentIdentity : null;
    if (duplicateOf) exactDuplicates += 1;
    else canonical.set(hash, canonicalContentIdentity);
    return { originRef, sha256: hash, canonicalContentIdentity, duplicateOf };
  });

  const imageRuns = runs.filter((r) => r.sourceCandidateImageCount > 0);
  const jsonOnly = runs.filter((r) => r.sourceCandidateImageCount === 0 && r.jsonCount > 0);
  const report = {
    runsRef: RUNS_REF,
    runsPath: RUNS_PATH,
    zipRef: ZIP_REF,
    zipPath: ZIP_PATH,
    runIdsInspected: runs.map((r) => r.runId),
    imageContainingRunIds: imageRuns.map((r) => r.runId),
    jsonOnlyRunId: jsonOnly.length === 1 ? jsonOnly[0].runId : null,
    recursiveImageCountPerRun: Object.fromEntries(runs.map((r) => [r.runId, r.recursiveImageCount])),
    sourceCandidateImageCountPerRun: Object.fromEntries(runs.map((r) => [r.runId, r.sourceCandidateImageCount])),
    zipImageCount: zipImages.length,
    totalRawCandidateCount: raw.length,
    exactSha256DuplicateCount: exactDuplicates,
    uniqueSha256CandidateCount: canonical.size,
    origins,
    nearDuplicateStatus: "not-evaluated-by-website-importer; GPT-7-owned",
    databaseWrites: false,
    assignsDatasetSplits: false,
    enablesTraining: false,
  };
  if (imageRuns.length !== 4 || jsonOnly.length !== 1) process.exitCode = 2;
  console.log(JSON.stringify(report, null, 2));
}
main().catch((e) => { console.error(e instanceof Error ? e.message : String(e)); process.exitCode = 1; });

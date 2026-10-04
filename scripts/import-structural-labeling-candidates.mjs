import { createHash } from "node:crypto";
import { unzipSync } from "fflate";
import { createClient } from "@supabase/supabase-js";

const OWNER = "dehghoon";
const REPO = "linkoteq-structural-detection";
const REF = process.env.DETECTION_REF || "main";
const RUNS = process.env.DETECTION_RUNS_PATH || "qa-review-artifacts/runs";
const ZIP = process.env.DETECTION_ZIP_PATH || "remaing-15-existing-images.zip";
const APPLY = process.argv.includes("--apply");
const IMAGE = /\.(png|jpe?g|webp)$/i;

function headers() {
  const value = { Accept: "application/vnd.github+json", "User-Agent": "linkoteq-labeling-importer" };
  if (process.env.GITHUB_TOKEN) value.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return value;
}
async function contents(path) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${encodeURIComponent(REF)}`;
  const response = await fetch(url, { headers: headers() });
  if (!response.ok) throw new Error(`GitHub ${response.status} for ${path}: ${(await response.text()).slice(0, 240)}`);
  return response.json();
}
async function bytes(url) {
  const response = await fetch(url, { headers: headers() });
  if (!response.ok) throw new Error(`Download ${response.status}: ${url}`);
  return new Uint8Array(await response.arrayBuffer());
}
async function walk(path) {
  const value = await contents(path);
  if (!Array.isArray(value)) return [value];
  const files = [];
  for (const entry of value) {
    if (entry.type === "file") files.push(entry);
    if (entry.type === "dir") files.push(...await walk(entry.path));
  }
  return files;
}
function hash(value) { return createHash("sha256").update(value).digest("hex"); }
function clean(value) { return value.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 180) || "historical-image"; }
function mime(name) {
  if (/\.png$/i.test(name)) return "image/png";
  if (/\.jpe?g$/i.test(name)) return "image/jpeg";
  if (/\.webp$/i.test(name)) return "image/webp";
  throw new Error(`Unsupported image: ${name}`);
}
function unvalidatedTransform() {
  return {
    coordinate_space: "source-page", unit: "pdf-point",
    effective_page_width_pt: null, effective_page_height_pt: null,
    effective_crop_box_pdf: [null, null, null, null], page_rotation_deg: 0,
    raster_width_px: null, raster_height_px: null,
    display_width_px: null, display_height_px: null,
    raster_to_source_page_affine: [null, null, null, null, null, null],
    source_page_to_raster_affine: [null, null, null, null, null, null],
    display_to_raster_affine: [1, 0, 0, 1, 0, 0],
    render_version: "historical-image-import-v1-unvalidated",
    transform_validation_state: "unvalidated",
  };
}
async function discoverRuns() {
  const root = await contents(RUNS);
  if (!Array.isArray(root)) throw new Error(`${RUNS} is not a directory`);
  const out = [];
  for (const run of root.filter((entry) => entry.type === "dir")) {
    const files = await walk(run.path);
    out.push({
      runId: run.name,
      images: files.filter((file) => IMAGE.test(file.name)),
      jsonCount: files.filter((file) => /\.json$/i.test(file.name)).length,
    });
  }
  return out;
}
async function discoverZip() {
  const entry = await contents(ZIP);
  if (Array.isArray(entry) || entry.type !== "file") throw new Error(`${ZIP} is not a file`);
  const archive = unzipSync(await bytes(entry.download_url));
  return Object.entries(archive)
    .filter(([name]) => IMAGE.test(name))
    .map(([name, value]) => ({ name, bytes: new Uint8Array(value) }));
}
async function collect(runGroups, zipImages) {
  const raw = [];
  for (const run of runGroups) {
    for (const image of run.images) {
      raw.push({
        filename: image.name,
        bytes: await bytes(image.download_url),
        originKind: "qa-run",
        originRef: `${OWNER}/${REPO}@${REF}:${image.path}`,
        projectGroupId: `qa-run:${run.runId}`,
        historical: { run_id: run.runId, source_path: image.path },
      });
    }
  }
  for (const image of zipImages) {
    raw.push({
      filename: image.name.split("/").at(-1) || image.name,
      bytes: image.bytes,
      originKind: "legacy-zip",
      originRef: `${OWNER}/${REPO}@${REF}:${ZIP}#${image.name}`,
      projectGroupId: `legacy-zip:${ZIP}`,
      historical: { archive: ZIP, archive_entry: image.name },
    });
  }
  const seen = new Map();
  let exactDuplicates = 0;
  const records = raw.map((record) => {
    const sha256 = hash(record.bytes);
    const duplicateOf = seen.get(sha256) || null;
    if (duplicateOf) exactDuplicates += 1;
    else seen.set(sha256, `${sha256}:page:0`);
    return { ...record, sha256, pageId: `${sha256}:page:0`, duplicateOf };
  });
  return { records, exactDuplicates };
}
function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = process.env.LABELING_USER_ACCESS_TOKEN;
  if (!url || !key || !token) throw new Error("Apply requires NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, LABELING_USER_ACCESS_TOKEN");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}
async function apply(records) {
  const supabase = client();
  const insertedCandidateIds = [];
  for (const record of records) {
    const storagePath = `${record.sha256}/${clean(record.filename)}`;
    const upload = await supabase.storage.from("structural-labeling-sources").upload(storagePath, record.bytes, {
      contentType: mime(record.filename), upsert: false,
    });
    if (upload.error && !/already exists|duplicate/i.test(upload.error.message)) throw new Error(upload.error.message);
    const { data, error } = await supabase.rpc("labeling_create_source_candidates", {
      p_hash: record.sha256,
      p_filename: clean(record.filename),
      p_mime: mime(record.filename),
      p_bytes: record.bytes.byteLength,
      p_storage: storagePath,
      p_origin_kind: record.originKind,
      p_origin_ref: record.originRef,
      p_project_group: record.projectGroupId,
      p_pages: [{ pageIndex: 0, pageId: record.pageId, transform: unvalidatedTransform() }],
      p_provenance: {
        repository: `${OWNER}/${REPO}`, ref: REF, source_sha256: record.sha256,
        source_artifact_preserved: true, importer: "scripts/import-structural-labeling-candidates.mjs",
      },
      p_historical: {
        ...record.historical,
        renewed_suitability_review_required: true,
        historical_status_does_not_imply_owner_approval: true,
      },
    });
    if (error) throw new Error(`${record.originRef}: ${error.message}`);
    insertedCandidateIds.push(...(data || []));
  }
  const result = await supabase.from("structural_labeling_candidates").select("id", { count: "exact", head: true });
  if (result.error) throw new Error(result.error.message);
  return { insertedCandidateIds, finalCandidateQueueCount: result.count };
}

async function main() {
  const runs = await discoverRuns();
  const imageRuns = runs.filter((run) => run.images.length > 0);
  const jsonOnly = runs.filter((run) => run.images.length === 0 && run.jsonCount > 0);
  if (imageRuns.length !== 4) throw new Error(`Expected 4 image-containing runs; found ${imageRuns.length}: ${imageRuns.map((r) => r.runId).join(", ")}`);
  if (jsonOnly.length !== 1) throw new Error(`Expected 1 JSON-only run; found ${jsonOnly.length}: ${jsonOnly.map((r) => r.runId).join(", ")}`);

  const zipImages = await discoverZip();
  const { records, exactDuplicates } = await collect(imageRuns, zipImages);
  const report = {
    repository: `${OWNER}/${REPO}`, ref: REF,
    runIdsInspected: runs.map((run) => run.runId),
    imageContainingRunIds: imageRuns.map((run) => run.runId),
    jsonOnlyRunId: jsonOnly[0].runId,
    imageCountPerRun: Object.fromEntries(imageRuns.map((run) => [run.runId, run.images.length])),
    zipExtractedCandidateCount: zipImages.length,
    totalRawCandidates: records.length,
    exactDuplicates,
    nearDuplicateHandlingStatus: "not-performed-by-website-importer; exact SHA-256 identities are preserved and near-duplicate admission remains a GPT-7 gate",
    finalCandidateQueueCount: APPLY ? null : records.length,
    allImportedWorkflowState: "candidate",
    historicalApprovalBypassesWorkflow: false,
    assignsDatasetSplits: false,
    enablesTraining: false,
    applyRequested: APPLY,
  };
  if (APPLY) Object.assign(report, await apply(records));
  console.log(JSON.stringify(report, null, 2));
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

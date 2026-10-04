import { createHash } from "node:crypto";
import { unzipSync } from "fflate";
import { createClient } from "@supabase/supabase-js";

const OWNER="dehghoon", REPO="linkoteq-structural-detection";
const RUNS_REF=process.env.DETECTION_RUNS_REF || process.env.DETECTION_REF || "qa-review-artifacts";
const RUNS_PATH=process.env.DETECTION_RUNS_PATH || "runs";
const ZIP_REF=process.env.DETECTION_ZIP_REF || "main";
const ZIP_PATH=process.env.DETECTION_ZIP_PATH || "remaing-15-existing-images.zip";
const APPLY=process.argv.includes("--apply"), IMG=/\.(png|jpe?g|webp)$/i;

const ghHeaders=()=>({Accept:"application/vnd.github+json","User-Agent":"linkoteq-labeling-importer",...(process.env.GITHUB_TOKEN?{Authorization:`Bearer ${process.env.GITHUB_TOKEN}`:{})});
async function gh(path,ref){const r=await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${encodeURIComponent(ref)}`,{headers:ghHeaders()});if(!r.ok)throw new Error(`GitHub ${r.status} ${ref}:${path}`);return r.json();}
async function bytes(url){const r=await fetch(url,{headers:ghHeaders()});if(!r.ok)throw new Error(`Download ${r.status}: ${url}`);return new Uint8Array(await r.arrayBuffer());}
async function walk(path,ref){const v=await gh(path,ref);if(!Array.isArray(v))return[v];const out=[];for(const e of v){if(e.type==="file")out.push(e);else if(e.type==="dir")out.push(...await walk(e.path,ref));}return out;}
const sha256=b=>createHash("sha256").update(b).digest("hex");
const clean=s=>s.replace(/[^A-Za-z0-9._-]+/g,"_").slice(0,180)||"historical-image";
const mime=n=>/\.png$/i.test(n)?"image/png":/\.jpe?g$/i.test(n)?"image/jpeg":/\.webp$/i.test(n)?"image/webp":null;
const transform=()=>({coordinate_space:"source-page",unit:"pdf-point",effective_page_width_pt:null,effective_page_height_pt:null,effective_crop_box_pdf:[null,null,null,null],page_rotation_deg:0,raster_width_px:null,raster_height_px:null,display_width_px:null,display_height_px:null,raster_to_source_page_affine:[null,null,null,null,null,null],source_page_to_raster_affine:[null,null,null,null,null,null],display_to_raster_affine:[1,0,0,1,0,0],render_version:"historical-image-import-v1-unvalidated",transform_validation_state:"unvalidated"});

async function discoverRuns(){
 const root=await gh(RUNS_PATH,RUNS_REF);if(!Array.isArray(root))throw new Error("runs_not_directory");
 const out=[];for(const run of root.filter(x=>x.type==="dir")){const files=await walk(run.path,RUNS_REF);out.push({runId:run.name,images:files.filter(x=>IMG.test(x.name)&&x.path.includes("/images/source/")),recursiveImageCount:files.filter(x=>IMG.test(x.name)).length,jsonCount:files.filter(x=>/\.json(l)?$/i.test(x.name)).length});}return out;
}
async function discoverZip(){const e=await gh(ZIP_PATH,ZIP_REF);if(Array.isArray(e)||e.type!=="file")throw new Error("zip_not_file");const z=unzipSync(await bytes(e.download_url));return Object.entries(z).filter(([n])=>IMG.test(n)).map(([name,b])=>({name,bytes:new Uint8Array(b)}));}

async function materialize(imageRuns,zipImages){
 const raw=[];for(const run of imageRuns)for(const image of run.images)raw.push({filename:image.name,bytes:await bytes(image.download_url),originKind:"qa-run",originRef:`${OWNER}/${REPO}@${RUNS_REF}:${image.path}`,projectGroupId:`qa-run:${run.runId}`,historical:{run_id:run.runId,source_path:image.path,ref:RUNS_REF}});
 for(const image of zipImages)raw.push({filename:image.name.split("/").at(-1)||image.name,bytes:image.bytes,originKind:"legacy-zip",originRef:`${OWNER}/${REPO}@${ZIP_REF}:${ZIP_PATH}#${image.name}`,projectGroupId:`legacy-zip:${ZIP_PATH}`,historical:{archive:ZIP_PATH,archive_entry:image.name,ref:ZIP_REF}});
 const canonical=new Map();let exact=0;const records=raw.map(r=>{const h=sha256(r.bytes),id=canonical.get(h)||`sha256:${h}`,dup=canonical.has(h)?id:null;if(dup)exact++;else canonical.set(h,id);return{...r,sha256:h,pageId:`${h}:page:0`,canonicalContentIdentity:id,duplicateOf:dup};});
 return{records,exactDuplicates:exact,uniqueSha256CandidateCount:canonical.size};
}
function client(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,token=process.env.LABELING_USER_ACCESS_TOKEN;if(!url||!key||!token)throw new Error("apply_credentials_missing");return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:`Bearer ${token}`}}});}
async function apply(records){
 const s=client(),failures=[],insertedCandidateIds=[];const before=await s.from("structural_labeling_candidates").select("id",{count:"exact",head:true});if(before.error)throw before.error;
 for(const r of records){try{const storage=`${r.sha256}/${clean(r.filename)}`,up=await s.storage.from("structural-labeling-sources").upload(storage,r.bytes,{contentType:mime(r.filename),upsert:false});if(up.error&&!/already exists|duplicate/i.test(up.error.message))throw up.error;const q=await s.rpc("labeling_create_source_candidates",{p_hash:r.sha256,p_filename:clean(r.filename),p_mime:mime(r.filename),p_bytes:r.bytes.byteLength,p_storage:storage,p_origin_kind:r.originKind,p_origin_ref:r.originRef,p_project_group:r.projectGroupId,p_pages:[{pageIndex:0,pageId:r.pageId,transform:transform()}],p_provenance:{repository:`${OWNER}/${REPO}`,source_sha256:r.sha256,canonical_content_identity:r.canonicalContentIdentity,duplicate_of_content_identity:r.duplicateOf,source_artifact_preserved:true},p_historical:{...r.historical,renewed_suitability_review_required:true,historical_status_does_not_imply_owner_approval:true}});if(q.error)throw q.error;insertedCandidateIds.push(...(q.data||[]));}catch(e){failures.push({originRef:r.originRef,reason:e instanceof Error?e.message:String(e)});}}
 const after=await s.from("structural_labeling_candidates").select("id",{count:"exact",head:true});if(after.error)throw after.error;return{candidateQueueCountBefore:before.count,candidateQueueCountAfter:after.count,insertedCandidateIds,failures};
}
async function main(){
 const runs=await discoverRuns(),imageRuns=runs.filter(r=>r.images.length),jsonOnly=runs.filter(r=>!r.images.length&&r.jsonCount);
 if(imageRuns.length!==4||jsonOnly.length!==1)throw new Error(`unexpected_run_discovery images=${imageRuns.length} jsonOnly=${jsonOnly.length}`);
 const zip=await discoverZip(),m=await materialize(imageRuns,zip);
 const report={runsRef:RUNS_REF,runsPath:RUNS_PATH,zipRef:ZIP_REF,zipPath:ZIP_PATH,runIdsInspected:runs.map(r=>r.runId),imageContainingRunIds:imageRuns.map(r=>r.runId),jsonOnlyRunId:jsonOnly[0].runId,recursiveImageCountPerRun:Object.fromEntries(runs.map(r=>[r.runId,r.recursiveImageCount])),sourceCandidateImageCountPerRun:Object.fromEntries(runs.map(r=>[r.runId,r.images.length])),zipImageCount:zip.length,totalRawCandidateCount:m.records.length,exactSha256DuplicateCount:m.exactDuplicates,uniqueSha256CandidateCount:m.uniqueSha256CandidateCount,origins:m.records.map(r=>({originRef:r.originRef,sha256:r.sha256,canonicalContentIdentity:r.canonicalContentIdentity,duplicateOf:r.duplicateOf})),nearDuplicateStatus:"not-evaluated-by-website-importer; GPT-7-owned",allImportedWorkflowState:"candidate",historicalApprovalBypass:false,assignsDatasetSplits:false,enablesTraining:false,applyRequested:APPLY};
 if(APPLY)Object.assign(report,await apply(m.records));console.log(JSON.stringify(report,null,2));
}
main().catch(e=>{console.error(e instanceof Error?e.message:String(e));process.exitCode=1;});

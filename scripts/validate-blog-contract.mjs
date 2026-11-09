import {validateEditorialImagePolicy} from "./validate-editorial-image-policy.mjs";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const path=resolve("contracts/marketing/blog-automation-v1.json");
let c;
try{c=JSON.parse(readFileSync(path,"utf8"));}catch(e){console.error("BLOG CONTRACT MISSING OR INVALID:",e.message);process.exit(1);}
function requireCondition(ok,message){if(!ok){console.error("BLOG CONTRACT FAILURE:",message);process.exitCode=1;}}
requireCondition(c.contract_id==="linkoteq-blog-automation","Unexpected contract ID");
requireCondition(/^1\./.test(c.version),"Unsupported contract major version");
requireCondition(c.roles?.content_agent?.must_read_before_work===true,"Content agent must read contract");
requireCondition(c.roles?.image_pipeline?.must_read_before_work===true,"Image pipeline must read contract");
requireCondition(c.roles?.publisher?.automation_may_publish===false,"Publishing must remain manual");
for(const k of ["draft_before_image","do_not_publish","do_not_enqueue_social","no_paid_image_api","no_tinyfish","no_latest_core_version_dependency","no_generic_repeated_covers","no_overwrite_published_articles"]){requireCondition(c.invariants?.[k]===true,"Missing invariant: "+k);}
requireCondition(c.roles?.database?.project_id==="xssiwlwlsyxrwdbninqe","Wrong Supabase project");
requireCondition(c.roles?.database?.bucket==="blog-media","Wrong media bucket");
requireCondition(c.checks?.after_image?.includes("draft-cover-url-readback"),"Missing image readback requirement");
validateEditorialImagePolicy(c,"blog");
if(!process.exitCode)console.log("BLOG CONTRACT OK:",c.contract_id,c.version);

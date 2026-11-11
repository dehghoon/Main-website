import {validateSharedMarketingPolicy} from './validate-shared-marketing-policy.mjs';
import {validateEditorialImagePolicy} from "./validate-editorial-image-policy.mjs";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const c=JSON.parse(readFileSync(resolve("contracts/marketing/ai-news-social-automation-v1.json"),"utf8"));
function check(ok,message){if(!ok)throw Error("AI NEWS CONTRACT: "+message);}
check(c.contract_id==="linkoteq-ai-news-social-automation","Wrong contract");
check(/^1\./.test(c.version),"Unsupported major version");
check(c.roles?.gpt8?.must_read_before_work&&c.roles?.github_image_worker?.must_read_before_work,"Both agents must read contract");
check(c.independent_from==="contracts/marketing/blog-automation-v1.json","Must be independent from blog");
check(c.schema?.project_id==="xssiwlwlsyxrwdbninqe","Wrong Supabase project");
check(c.schema?.required_brief_slides===5&&c.schema?.instagram_image_count===5,"Expected five carousel slides");
check(c.schema?.instagram_dimensions?.join("x")==="1200x1200","Wrong slide dimensions");
for(const k of ["no_latest_core_dependency","no_paid_image_api","no_tinyfish","no_generic_repeated_svg","no_blog_cover_reuse","no_single_image_instagram","no_false_success","no_duplicate_publication","never_republish_published","do_not_bypass_publisher_approval_gates"]){check(c.invariants?.[k]===true,"Missing invariant "+k);}
check(c.permissions?.blog_auto_publish===false&&c.permissions?.instagram_auto_publish===true&&c.permissions?.linkedin_ai_news_auto_publish===true,"Incorrect publication permission");
check(c.workflow?.generator==="scripts/prepare-ai-news-social-images.mjs","Wrong generator");
validateEditorialImagePolicy(c,"news");
console.log("AI NEWS CONTRACT OK",c.contract_id,c.version);

validateSharedMarketingPolicy('contracts/marketing/ai-news-social-automation-v1.json');

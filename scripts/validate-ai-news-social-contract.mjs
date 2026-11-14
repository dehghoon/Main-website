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
check(c.permissions?.blog_auto_publish===false&&c.permissions?.instagram_auto_publish===false&&c.permissions?.linkedin_ai_news_auto_publish===false,"Incorrect publication permission");
check(c.manual_creative_workflow?.automatic_image_generation===false&&c.manual_creative_workflow?.publication_requires_explicit_owner_instruction===true,"Manual publication required");
check(c.workflow?.generator==="scripts/prepare-ai-news-social-images.mjs","Wrong generator");
const website = c.website_syndication;
check(website?.table === "public.ai_news_website_feed" && website?.stable_key === "asset_id", "Website feed must use one card per news asset");
check(website?.route === "https://www.linkoteq.com/news", "Wrong website news route");
check(website?.publish_only_after_owner_approval === true && website?.same_story_approval_as_social === true, "Website requires the same explicit story approval");
check(website?.fields?.includes("social_links") && website?.fields?.includes("published_at"), "Website needs confirmed links and publication time");
validateEditorialImagePolicy(c,"news");
console.log("AI NEWS CONTRACT OK",c.contract_id,c.version);

validateSharedMarketingPolicy('contracts/marketing/ai-news-social-automation-v1.json');

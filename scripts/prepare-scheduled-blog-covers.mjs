#!/usr/bin/env node
// Scheduled cover preparation: only existing, complete, unillustrated drafts.
import {execFileSync} from "node:child_process";
import {stat} from "node:fs/promises";
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!key)throw Error("SUPABASE_SERVICE_ROLE_KEY secret is required");
const local=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Toronto",weekday:"short",hour:"2-digit",hourCycle:"h23"}).formatToParts(new Date());
const part=t=>local.find(x=>x.type===t)?.value;
if(process.env.GITHUB_EVENT_NAME==="schedule"&&!(["Mon","Wed"].includes(part("weekday"))&&part("hour")==="09")){console.log("Not 09:00 Toronto Monday/Wednesday; skipping.");process.exit(0);}
const project="https://xssiwlwlsyxrwdbninqe.supabase.co";
const headers={apikey:key,authorization:"Bearer "+key};
const response=await fetch(project+"/rest/v1/blog_posts?status=eq.draft&cover_image_url=is.null&select=id,slug,title,excerpt,body,scheduled_at&order=created_at.asc&limit=50",{headers});
if(!response.ok)throw Error("Draft query failed HTTP "+response.status);
const drafts=await response.json();
let processed=0,failed=0;
for(const d of drafts){
 if(!d.scheduled_at){console.log("Skipping unscheduled draft "+d.id);continue;}
 if(new Date(d.scheduled_at)>new Date()){console.log("Skipping future draft "+d.id);continue;}
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.slug||"")||!d.title||!d.excerpt||!d.body||d.body.length<500){console.log("Skipping incomplete draft "+d.id);continue;}
 try{
  const subtitle=String(d.excerpt).slice(0,90);
  execFileSync("node",["scripts/generate-blog-cover.mjs","--slug",d.slug,"--title",d.title,"--subtitle",subtitle],{stdio:"inherit"});
  execFileSync("node",["scripts/render-blog-cover-jpeg.mjs",d.slug],{stdio:"inherit"});
  const jpg=await stat("public/blog/covers/"+d.slug+".jpg");
  if(jpg.size<1024)throw Error("JPEG too small");
  execFileSync("node",["scripts/upload-blog-cover.mjs"],{stdio:"inherit",env:{...process.env,POST_ID:d.id,SLUG:d.slug}});
  processed++;
 }catch(e){failed++;console.error("Cover preparation failed for "+d.id+": "+e.message);}
}
console.log(JSON.stringify({processed,failed,examined:drafts.length}));
if(failed)process.exitCode=1;

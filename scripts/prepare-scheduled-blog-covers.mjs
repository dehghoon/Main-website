#!/usr/bin/env node
// Scheduled cover preparation: only existing, complete, unillustrated drafts.
import {execFileSync} from "node:child_process";
import {stat} from "node:fs/promises";
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!key)throw Error("SUPABASE_SERVICE_ROLE_KEY secret is required");
const project="https://xssiwlwlsyxrwdbninqe.supabase.co";
const headers={apikey:key,authorization:"Bearer "+key};
const replaceId=process.env.REPLACE_POST_ID||"";
if(replaceId&&!/^[0-9a-f-]{36}$/i.test(replaceId))throw Error("Invalid replacement post ID");
const query=replaceId?"id=eq."+encodeURIComponent(replaceId)+"&status=eq.draft":"status=eq.draft&cover_image_url=is.null";
const response=await fetch(project+"/rest/v1/blog_posts?"+query+"&select=id,slug,title,cover_image_title,excerpt,body,scheduled_at,created_at&order=created_at.asc&limit=50",{headers});
if(!response.ok)throw Error("Draft query failed HTTP "+response.status);
const drafts=await response.json();
let processed=0,failed=0;
for(const d of drafts){
 const age=Date.now()-Date.parse(d.created_at||"");
 if(!replaceId&&(!Number.isFinite(age)||age<0||age>7*86400000)){console.log("Skipping stale draft "+d.id);continue;}
 if(!replaceId&&d.scheduled_at&&new Date(d.scheduled_at)>new Date()){console.log("Skipping future draft "+d.id);continue;}
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.slug||"")||!d.title||!d.excerpt||!d.body||d.body.length<500){console.log("Skipping incomplete draft "+d.id);continue;}
 try{
  const subtitle=String(d.excerpt).slice(0,70);
  const shortTitle=String(d.cover_image_title||d.title);
  const variant=[...d.slug].reduce((a,c)=>a+c.charCodeAt(0),0)%4;
  execFileSync("node",["scripts/generate-blog-cover.mjs","--slug",d.slug,"--title",shortTitle,"--subtitle",subtitle,"--variant",String(variant)],{stdio:"inherit"});
  execFileSync("node",["scripts/render-blog-cover-jpeg.mjs",d.slug],{stdio:"inherit"});
  const jpg=await stat("public/blog/covers/"+d.slug+".jpg");
  if(jpg.size<1024)throw Error("JPEG too small");
  execFileSync("node",["scripts/upload-blog-cover.mjs"],{stdio:"inherit",env:{...process.env,POST_ID:d.id,SLUG:d.slug,REPLACE_POST_ID:replaceId}});
  processed++;
 }catch(e){failed++;console.error("Cover preparation failed for "+d.id+": "+e.message);}
}
console.log(JSON.stringify({processed,failed,examined:drafts.length}));
if(failed||(replaceId&&processed!==1))process.exitCode=1;

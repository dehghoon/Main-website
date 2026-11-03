#!/usr/bin/env node
// Prepare image assets for verified AI engineering news; never publish social posts.
import {execFileSync} from "node:child_process";
import {readFile} from "node:fs/promises";
import {loadImage} from "@napi-rs/canvas";
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!key)throw Error("Missing SUPABASE_SERVICE_ROLE_KEY");
const project="https://xssiwlwlsyxrwdbninqe.supabase.co";
const headers={apikey:key,authorization:"Bearer "+key};
const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Toronto",weekday:"short",hour:"2-digit",hourCycle:"h23"}).formatToParts(new Date());
const local=t=>parts.find(x=>x.type===t)?.value;
if(process.env.GITHUB_EVENT_NAME==="schedule"&&(!["Tue","Thu","Sat"].includes(local("weekday"))||local("hour")!=="10")){console.log("Not 10:00 Toronto Tuesday/Thursday/Saturday; skipping");process.exit(0);}
const q=await fetch(project+"/rest/v1/ai_news_social_assets?image_status=eq.pending&image_url=is.null&scheduled_at=lte."+encodeURIComponent(new Date().toISOString())+"&select=id,slug,title,subtitle,source_url&order=scheduled_at.asc&limit=15",{headers});
if(!q.ok)throw Error("Queue lookup HTTP "+q.status);
const jobs=await q.json();let ready=0,failed=0;
for(const job of jobs){
 const slug=String(job.slug||"");
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)){failed++;continue;}
 try{
  execFileSync("node",["scripts/generate-blog-cover.mjs","--slug",slug,"--title",job.title,"--subtitle",job.subtitle||""],{stdio:"inherit"});
  execFileSync("node",["scripts/render-blog-cover-jpeg.mjs",slug],{stdio:"inherit"});
  const bytes=await readFile("public/blog/covers/"+slug+".jpg");
  if(bytes.length<1024||bytes.length>8*1024*1024||bytes[0]!==255||bytes[1]!==216)throw Error("Invalid JPEG");
  const decoded=await loadImage(bytes);
  if(decoded.width!==1200||decoded.height!==630)throw Error("Unexpected JPEG dimensions");
  const path="ai-news/"+job.id+"/"+slug+".jpg";
  const upload=await fetch(project+"/storage/v1/object/blog-media/"+path,{method:"POST",headers:{...headers,"content-type":"image/jpeg","cache-control":"3600","x-upsert":"false"},body:bytes});
  if(!upload.ok)throw Error("Storage upload HTTP "+upload.status);
  const url=project+"/storage/v1/object/public/blog-media/"+path;
  const verify=await fetch(url,{method:"GET"});
  if(!verify.ok||!(verify.headers.get("content-type")||"").includes("image/jpeg"))throw Error("Public image verification failed");
  const publishedBytes=new Uint8Array(await verify.arrayBuffer());
  if(publishedBytes.length!==bytes.length||publishedBytes[0]!==255||publishedBytes[1]!==216)throw Error("Public JPEG bytes invalid");
  const patch=await fetch(project+"/rest/v1/ai_news_social_assets?id=eq."+encodeURIComponent(job.id)+"&image_status=eq.pending&image_url=is.null",{method:"PATCH",headers:{...headers,"content-type":"application/json",prefer:"return=representation"},body:JSON.stringify({image_url:url,image_status:"ready",image_error:null,updated_at:new Date().toISOString()})});
  if(!patch.ok||(await patch.json()).length!==1)throw Error("Queue record update failed");
  ready++;console.log(JSON.stringify({status:"ready",id:job.id,image_url:url,width:1200,height:630}));
 }catch(e){
  failed++;console.error("Image failed for "+job.id+": "+e.message);
  await fetch(project+"/rest/v1/ai_news_social_assets?id=eq."+encodeURIComponent(job.id)+"&image_status=eq.pending",{method:"PATCH",headers:{...headers,"content-type":"application/json"},body:JSON.stringify({image_status:"failed",image_error:String(e.message).slice(0,300),updated_at:new Date().toISOString()})});
 }
}
console.log(JSON.stringify({examined:jobs.length,ready,failed}));
if(failed)process.exitCode=1;

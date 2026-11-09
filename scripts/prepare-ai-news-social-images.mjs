#!/usr/bin/env node
// Render original editorial illustrations locally, without an image API charge.
// This workflow prepares media; the separate social publisher handles posting.
import "./validate-ai-news-social-contract.mjs";
import {createHash} from "node:crypto";
import {renderSlide,renderCollage,planCarousel,validateJpeg} from "./editorial-media.mjs";
const project="https://xssiwlwlsyxrwdbninqe.supabase.co";
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!key)throw Error("Missing SUPABASE_SERVICE_ROLE_KEY");
const headers={apikey:key,authorization:"Bearer "+key};
const request=async(path,options={})=>{
 const r=await fetch(project+path,{...options,headers:{...headers,...options.headers}});
 if(!r.ok)throw Error("Supabase HTTP "+r.status+" at "+path.split("?")[0]);
 return r;
};
const q=await request("/rest/v1/ai_news_social_assets?image_status=eq.pending&image_url=is.null&creative_status=eq.pending_review&scheduled_at=lte."+
 encodeURIComponent(new Date().toISOString())+
 "&select=id,slug,title,subtitle,creative_brief,source_url&order=scheduled_at.asc&limit=5");
const jobs=await q.json();
let generated=0,blocked=0,failed=0;

for(const a of jobs){
 const slides=a.creative_brief?.slides;
 if(!Array.isArray(slides)||slides.length!==5||slides.some(s=>!s?.headline||!s?.visual||!s?.detail)){
  blocked++;console.log(JSON.stringify({asset:a.id,status:"blocked",reason:"Missing detailed slide brief"}));continue;
 }
 if(!/^https:\/\//.test(a.source_url||"")){blocked++;continue}
 try{
  const history=await request("/rest/v1/ai_news_social_publications?asset_id=eq."+encodeURIComponent(a.id)+"&select=status");
  if((await history.json()).some(p=>p.status!=="pending")){blocked++;console.log(JSON.stringify({asset:a.id,status:"blocked",reason:"Publication history or in-flight publication exists"}));continue;}
  const urls=[],rendered=[],sceneNames=[];
  const plans=planCarousel(a);
  // Complete all five renders and collage before any upload.
  for(let i=0;i<slides.length;i++)rendered.push(await renderSlide(slides[i],i,a,plans[i]));
  const collage=await renderCollage(rendered,a);
  for(let i=0;i<slides.length;i++){
   const slide=rendered[i];
   const bytes=slide.bytes;sceneNames.push(slide.scene);
   if(bytes.length<1024||bytes.length>8*1024*1024)throw Error("Rendered slide invalid");
   const storagePath="ai-news/"+a.id+"/slide-final-"+(i+1)+".jpg";
   await request("/storage/v1/object/blog-media/"+storagePath,{method:"POST",
    headers:{"content-type":"image/jpeg","cache-control":"3600","x-upsert":"true"},body:bytes});
   const url=project+"/storage/v1/object/public/blog-media/"+storagePath;
   const verify=await fetch(url);
   if(!verify.ok||!verify.headers.get("content-type")?.includes("image/jpeg"))throw Error("Slide public URL unavailable");
   await validateJpeg(Buffer.from(await verify.arrayBuffer()),1200,1200);
   urls.push(url);
  }
  if(new Set(rendered.map(s=>createHash("sha256").update(s.bytes).digest("hex"))).size!==5)throw Error("Carousel contains duplicate JPEG images");

  const collagePath="ai-news/"+a.id+"/collage-final.jpg";
  await request("/storage/v1/object/blog-media/"+collagePath,{method:"POST",
   headers:{"content-type":"image/jpeg","cache-control":"3600","x-upsert":"true"},body:collage});
  const collageUrl=project+"/storage/v1/object/public/blog-media/"+collagePath;
  const collageCheck=await fetch(collageUrl);
  if(!collageCheck.ok||!collageCheck.headers.get("content-type")?.includes("image/jpeg"))throw Error("Collage public URL unavailable");
  await validateJpeg(Buffer.from(await collageCheck.arrayBuffer()),1600,1200);
  const cover=urls[0];
  // Attach the complete carousel to Instagram, and the readable collage to Facebook/LinkedIn.
  // Only pending publications are touched: never republish or modify existing successful posts.
  for(const platform of ["instagram","facebook","linkedin"]){
   await request("/rest/v1/ai_news_social_publications?asset_id=eq."+encodeURIComponent(a.id)+
    "&platform=eq."+platform+"&status=eq.pending",{
    method:"PATCH",headers:{"content-type":"application/json"},
    body:JSON.stringify({media_urls:platform==="instagram"?urls:[collageUrl]})
   });
  }
  const updated=await request("/rest/v1/ai_news_social_assets?id=eq."+encodeURIComponent(a.id)+
   "&image_status=eq.pending&image_url=is.null",{
   method:"PATCH",headers:{"content-type":"application/json",prefer:"return=representation"},
   body:JSON.stringify({image_status:"ready",image_url:cover,carousel_urls:urls,updated_at:new Date().toISOString()})
  });
  if((await updated.json()).length!==1)throw Error("Queue changed");
  generated++;console.log(JSON.stringify({asset:a.id,status:"ready_pending_creative_review",slides:urls.length,collage:true,scenes:sceneNames}));
 }catch(e){
  failed++;console.error(JSON.stringify({asset:a.id,status:"failed",error:String(e.message).slice(0,240)}));
  // A failed asset is never published; upsert allows safe recovery of partial slides.
  await request("/rest/v1/ai_news_social_assets?id=eq."+encodeURIComponent(a.id)+"&image_status=eq.pending",{
   method:"PATCH",headers:{"content-type":"application/json"},
   body:JSON.stringify({image_status:"failed",image_error:String(e.message).slice(0,280)})
  }).catch(()=>{});
 }
}
console.log(JSON.stringify({examined:jobs.length,generated,blocked,failed}));
if(failed)process.exitCode=1;

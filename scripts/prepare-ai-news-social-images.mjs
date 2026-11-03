#!/usr/bin/env node
// Reuse the SAME authenticated OpenAI image generation path as blog-cover-generate.
// This workflow prepares media only; the social publisher handles posting after review.
import {createCanvas,loadImage} from "@napi-rs/canvas";
const project="https://xssiwlwlsyxrwdbninqe.supabase.co";
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!key)throw Error("Missing SUPABASE_SERVICE_ROLE_KEY");
const headers={apikey:key,authorization:"Bearer "+key};
const local=new Intl.DateTimeFormat("en-US",{timeZone:"America/Toronto",weekday:"short",hour:"2-digit",hourCycle:"h23"}).formatToParts(new Date());
const part=t=>local.find(x=>x.type===t)?.value;
if(process.env.GITHUB_EVENT_NAME==="schedule"&&(!["Tue","Thu","Sat"].includes(part("weekday"))||!["10","11"].includes(part("hour")))){
 console.log("Outside Toronto image processing window");process.exit(0);
}
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
function wrap(ctx,text,maxWidth,fontSize,maxLines){
 ctx.font="bold "+fontSize+"px Arial";
 const words=String(text||"").split(/\s+/),out=[];let line="";
 for(const word of words){const next=(line+" "+word).trim();if(ctx.measureText(next).width>maxWidth&&line){out.push(line);line=word;}else line=next}
 if(line)out.push(line);
 if(out.length>maxLines)throw Error("Slide headline too long");
 return out;
}
async function renderSlide(source,slide,idx){
 const res=await fetch(source);
 if(!res.ok)throw Error("Generated image inaccessible");
 const b=new Uint8Array(await res.arrayBuffer());
 const image=await loadImage(b);
 const canvas=createCanvas(1200,1200),ctx=canvas.getContext("2d");
 const ratio=Math.max(1200/image.width,1200/image.height);
 const w=image.width*ratio,h=image.height*ratio;
 ctx.drawImage(image,(1200-w)/2,(1200-h)/2,w,h);
 const gradient=ctx.createLinearGradient(0,460,0,1200);
 gradient.addColorStop(0,"rgba(3,16,28,0)");
 gradient.addColorStop(.5,"rgba(3,16,28,.82)");
 gradient.addColorStop(1,"rgba(3,16,28,.98)");
 ctx.fillStyle=gradient;ctx.fillRect(0,400,1200,800);
 ctx.font="bold 34px Arial";ctx.fillStyle="#87e4f5";ctx.fillText("LINKOTEQ  /  ENGINEERING INSIGHTS",70,770);
 const lines=wrap(ctx,slide.headline,1050,66,3);
 ctx.font="bold 66px Arial";ctx.fillStyle="#ffffff";
 lines.forEach((line,i)=>ctx.fillText(line,70,855+i*79));
 const y=855+lines.length*79+20;
 ctx.font="30px Arial";ctx.fillStyle="#d7edf4";
 const desc=String(slide.detail||"").slice(0,145);
 const d=wrap(ctx,desc,1040,30,3);
 ctx.font="30px Arial";d.forEach((line,i)=>ctx.fillText(line,70,y+i*42));
 ctx.fillStyle="#72dcef";ctx.fillRect(70,1150,190,7);
 return canvas.toBuffer("image/jpeg",88);
}
for(const a of jobs){
 const slides=a.creative_brief?.slides;
 if(!Array.isArray(slides)||slides.length<4||slides.length>6||slides.some(s=>!s?.headline||!s?.visual||!s?.detail)){
  blocked++;console.log(JSON.stringify({asset:a.id,status:"blocked",reason:"Missing detailed slide brief"}));continue;
 }
 if(!/^https:\/\//.test(a.source_url||"")){blocked++;continue}
 try{
  const urls=[];
  for(let i=0;i<slides.length;i++){
   // Server-side blog image generator is reused; no generic SVG cover generator.
   const generatedResponse=await request("/functions/v1/ai-news-image-generate",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({asset_id:a.id,slide:i+1})
   });
   const result=await generatedResponse.json();
   if(!result.ok||!result.image_url)throw Error("AI image generation failed for slide "+(i+1));
   const bytes=await renderSlide(result.image_url,slides[i],i);
   if(bytes.length<1024||bytes.length>8*1024*1024)throw Error("Rendered slide invalid");
   const storagePath="ai-news/"+a.id+"/slide-final-"+(i+1)+".jpg";
   await request("/storage/v1/object/blog-media/"+storagePath,{method:"POST",
    headers:{"content-type":"image/jpeg","cache-control":"3600","x-upsert":"false"},body:bytes});
   const url=project+"/storage/v1/object/public/blog-media/"+storagePath;
   const verify=await fetch(url);
   if(!verify.ok||!verify.headers.get("content-type")?.includes("image/jpeg"))throw Error("Slide public URL unavailable");
   urls.push(url);
  }
  const cover=urls[0];
  const updated=await request("/rest/v1/ai_news_social_assets?id=eq."+encodeURIComponent(a.id)+
   "&image_status=eq.pending&image_url=is.null",{
   method:"PATCH",headers:{"content-type":"application/json",prefer:"return=representation"},
   body:JSON.stringify({image_status:"ready",image_url:cover,carousel_urls:urls,updated_at:new Date().toISOString()})
  });
  if((await updated.json()).length!==1)throw Error("Queue changed");
  generated++;console.log(JSON.stringify({asset:a.id,status:"ready_pending_creative_review",slides:urls.length}));
 }catch(e){
  failed++;console.error(JSON.stringify({asset:a.id,status:"failed",error:String(e.message).slice(0,240)}));
  // Do not mark ready on partial generation or retry automatically: orphan images require reconciliation.
  await request("/rest/v1/ai_news_social_assets?id=eq."+encodeURIComponent(a.id)+"&image_status=eq.pending",{
   method:"PATCH",headers:{"content-type":"application/json"},
   body:JSON.stringify({image_status:"failed",image_error:String(e.message).slice(0,280)})
  }).catch(()=>{});
 }
}
console.log(JSON.stringify({examined:jobs.length,generated,blocked,failed}));
if(failed)process.exitCode=1;

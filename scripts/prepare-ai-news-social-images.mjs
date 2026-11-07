#!/usr/bin/env node
// Render original editorial illustrations locally, without an image API charge.
// This workflow prepares media; the separate social publisher handles posting.
import {createCanvas,loadImage} from "@napi-rs/canvas";
import {createHash} from "node:crypto";
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

const esc=s=>String(s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
function lines(value,max=31,limit=4){
 const out=[];let line="";
 for(const word of String(value||"").trim().split(/\s+/)){
  if(word.length>max)throw Error("Text needs editorial shortening");
  if((line+" "+word).trim().length>max&&line){out.push(line);line=word}else line=(line+" "+word).trim();
 }
 if(line)out.push(line);
 if(out.length>limit)throw Error("Text exceeds mobile-safe slide layout");
 return out;
}
// Reuse the blog-cover SVG -> @napi-rs/canvas -> JPEG pipeline.
// The visual brief, not slide position, selects the illustration.
const scenes=[
 {re:/camera|cctv|surveillance|site photo|earthcam|visual intelligence/,name:"camera",art:'<rect x="270" y="170" width="640" height="345" rx="25"/><circle cx="590" cy="345" r="120"/><circle cx="590" cy="345" r="55"/><path d="M400 520L350 620M780 520L835 620"/>'},
 {re:/safety|hazard|risk|excavat|danger|incident/,name:"safety",art:'<path d="M590 125L1010 650H170Z"/><path d="M590 305V475"/><circle cx="590" cy="565" r="12"/>'},
 {re:/deliver|material|supply|logistic|truck/,name:"delivery",art:'<rect x="160" y="285" width="570" height="270" rx="15"/><path d="M730 370H890L1030 485V555H730Z"/><circle cx="350" cy="575" r="65"/><circle cx="850" cy="575" r="65"/>'},
 {re:/ai|algorithm|detect|data|software|procore|integration|automati/,name:"digital",art:'<rect x="215" y="150" width="750" height="480" rx="24"/><path d="M350 270H820M350 360H700M350 450H770"/><circle cx="840" cy="490" r="55"/>'},
 {re:/engineer|inspect|human|verify|review|approval|check/,name:"review",art:'<rect x="280" y="125" width="610" height="540" rx="20"/><path d="M390 280H770M390 370H770M390 460H650M390 550L450 600L600 430"/>'},
 {re:/drawing|blueprint|plan|clash|document|design|model|building/,name:"drawing",art:'<path d="M245 650V260L560 105L875 260V650M560 105V650M245 260L560 410L875 260M245 450L560 600L875 450"/>'}
];
function selectScene(slide,asset,idx){
 // Match the *specific slide*, not the global article title. A recurring word
 // like "camera" must not force all five slides to reuse one illustration.
 const title=String(slide.headline||"").toLowerCase();
 const detail=String(slide.detail||"").toLowerCase();
 const visual=String(slide.visual||"").toLowerCase();
 const role=[
  /camera|cctv|earthcam|site|construction/,
  /photo|log|document|drawing|blueprint|review/,
  /ai|data|software|dashboard|integration|procore|detect/,
  /safety|hazard|risk|engineer|inspect|verify|excavat/,
  /engineer|review|human|check|team|approval/
 ][idx];
 const candidates=[
  role?.test(title+" "+detail) ? ["camera","drawing","digital","safety","review"][idx] : null,
  ...scenes.filter(x=>x.re.test(title+" "+detail)).map(x=>x.name),
  ...scenes.filter(x=>x.re.test(visual)).map(x=>x.name)
 ].filter(Boolean);
 const selected=scenes.find(x=>x.name===(candidates[0]||""));
 if(!selected)throw Error("No contextual SVG scene for visual brief: "+String(slide.visual).slice(0,90));
 return selected;
}
async function renderSlide(slide,idx,asset){
 const scene=selectScene(slide,asset,idx);
 const heading=lines(slide.headline,28,3);
 const detail=lines(slide.detail,48,2);
 const detailStart=Math.max(1030,875+heading.length*63+12);
 if(detailStart+(detail.length-1)*39>1125)throw Error("Slide copy exceeds safe text area");
 const hue=parseInt(createHash("sha256").update(String(asset.slug)+":"+scene.name+":"+idx).digest("hex").slice(0,2),16)%30;
 const art='<g fill="none" stroke="#8ce7fa" stroke-width="13" stroke-linejoin="round" stroke-linecap="round">'+scene.art+'</g>';
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#07172b"/><stop offset="1" stop-color="#164b71"/></linearGradient></defs><rect width="1200" height="1200" fill="url(#bg)"/><g transform="translate('+hue+',0)">'+art+'</g><rect y="720" width="1200" height="480" fill="#07172b"/><g font-family="Arial,Helvetica,sans-serif"><text x="65" y="790" font-size="30" fill="#8ce7fa">LINKOTEQ / ENGINEERING INSIGHTS</text>'+heading.map((t,i)=>'<text x="65" y="'+(875+i*63)+'" font-size="51" font-weight="bold" fill="white">'+esc(t)+'</text>').join("")+detail.map((t,i)=>'<text x="65" y="'+(detailStart+i*39)+'" font-size="25" fill="#c9e9f4">'+esc(t)+'</text>').join("")+'<text x="1070" y="1150" font-size="24" fill="#8ce7fa">'+(idx+1)+'/5</text></g></svg>';
 const image=await loadImage(Buffer.from(svg));
 const canvas=createCanvas(1200,1200);canvas.getContext("2d").drawImage(image,0,0);
 const bytes=canvas.toBuffer("image/jpeg",90);
 if(bytes[0]!==255||bytes[1]!==216)throw Error("SVG to JPEG conversion failed");
 return {bytes,scene:scene.name,canvas};
}
function renderCollage(slides){
 const canvas=createCanvas(1600,1200),ctx=canvas.getContext("2d");
 ctx.fillStyle="#07172b";ctx.fillRect(0,0,1600,1200);
 // Main panel and four supporting panels, with short captions instead of unreadable full slide text.
 const slots=[[30,75,910,1050],[960,75,295,510],[1270,75,295,510],[960,600,295,510],[1270,600,295,510]];
 slides.forEach((slide,i)=>{
  const [x,y,w,h]=slots[i];ctx.drawImage(slide.canvas,x,y,w,h);
  if(i>0){ctx.fillStyle="rgba(7,23,43,.94)";ctx.fillRect(x,y+h-115,w,115);
   ctx.fillStyle="white";ctx.font="bold 22px Arial";
   lines(slide.headline,22,3).forEach((t,j)=>ctx.fillText(t,x+12,y+h-83+j*27));
  }
 });
 return canvas.toBuffer("image/jpeg",90);
}
for(const a of jobs){
 const slides=a.creative_brief?.slides;
 if(!Array.isArray(slides)||slides.length!==5||slides.some(s=>!s?.headline||!s?.visual||!s?.detail)){
  blocked++;console.log(JSON.stringify({asset:a.id,status:"blocked",reason:"Missing detailed slide brief"}));continue;
 }
 if(!/^https:\/\//.test(a.source_url||"")){blocked++;continue}
 try{
  const urls=[],rendered=[],sceneNames=[];
  for(let i=0;i<slides.length;i++){
   const slide=await renderSlide(slides[i],i,a);
   const bytes=slide.bytes;rendered.push(slide);sceneNames.push(slide.scene);
   if(bytes.length<1024||bytes.length>8*1024*1024)throw Error("Rendered slide invalid");
   const storagePath="ai-news/"+a.id+"/slide-final-"+(i+1)+".jpg";
   await request("/storage/v1/object/blog-media/"+storagePath,{method:"POST",
    headers:{"content-type":"image/jpeg","cache-control":"3600","x-upsert":"true"},body:bytes});
   const url=project+"/storage/v1/object/public/blog-media/"+storagePath;
   const verify=await fetch(url);
   if(!verify.ok||!verify.headers.get("content-type")?.includes("image/jpeg"))throw Error("Slide public URL unavailable");
   urls.push(url);
  }
  if(new Set(sceneNames).size<3)throw Error("Carousel visual diversity check failed: fewer than 3 distinct visual scenes");
  const collage=renderCollage(rendered);
  const collagePath="ai-news/"+a.id+"/collage-final.jpg";
  await request("/storage/v1/object/blog-media/"+collagePath,{method:"POST",
   headers:{"content-type":"image/jpeg","cache-control":"3600","x-upsert":"true"},body:collage});
  const collageUrl=project+"/storage/v1/object/public/blog-media/"+collagePath;
  const collageCheck=await fetch(collageUrl);
  if(!collageCheck.ok||!collageCheck.headers.get("content-type")?.includes("image/jpeg"))throw Error("Collage public URL unavailable");
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

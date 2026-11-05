#!/usr/bin/env node
// Reuse the SAME authenticated OpenAI image generation path as blog-cover-generate.
// This workflow prepares media only; the social publisher handles posting after review.
import {createCanvas} from "@napi-rs/canvas";
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
// Deterministic, API-free editorial artwork, matching the blog cover workflow.
function renderSlide(slide,idx,asset){
 const canvas=createCanvas(1200,1200),ctx=canvas.getContext("2d");
 const bg=ctx.createLinearGradient(0,0,1200,1200);
 bg.addColorStop(0,"#07172b");bg.addColorStop(1,"#164b71");
 ctx.fillStyle=bg;ctx.fillRect(0,0,1200,1200);
 ctx.strokeStyle="rgba(112,216,245,.13)";ctx.lineWidth=2;
 for(let x=40;x<1200;x+=80){ctx.beginPath();ctx.moveTo(x,60);ctx.lineTo(x,700);ctx.stroke()}
 for(let y=70;y<700;y+=80){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1200,y);ctx.stroke()}
 const text=(s,x,y,size=28,color="#eafaff",weight="bold")=>{
  ctx.fillStyle=color;ctx.font=weight+" "+size+"px Arial";ctx.fillText(s,x,y);
 };
 const line=(x,y,xx,yy,color="#86e5fa",width=5)=>{
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(xx,yy);ctx.stroke();
 };
 const rect=(x,y,w,h,fill="#123a5b",stroke="#86e5fa")=>{
  ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);ctx.strokeStyle=stroke;ctx.lineWidth=4;ctx.strokeRect(x,y,w,h);
 };
 const headline=String(slide.headline||"").toLowerCase();
 const visual=String(slide.visual||"").toLowerCase();
 const topic=(headline+" "+visual+" "+String(asset.title||"")).toLowerCase();
 const palette=["#84e2f7","#f3bd6e","#92f0d0","#c4b7ff","#f2a5bc"];
 const accent=palette[idx%palette.length];
 // Five complementary but distinct editorial compositions: drawing, comparison,
 // cross-document links, review/verification, and resolution workflow.
 if(idx===0){
  ctx.save();ctx.translate(230,110);ctx.rotate(-.09);
  rect(0,0,700,460,"#e9f4fa","#7acfe6");
  ctx.strokeStyle="#7c9fb4";ctx.lineWidth=3;
  for(let k=0;k<5;k++){ctx.strokeRect(65+k*65,70+k*28,430-k*42,290-k*35)}
  ctx.strokeStyle="#bb5961";ctx.lineWidth=8;ctx.beginPath();ctx.arc(410,225,92,0,Math.PI*2);ctx.stroke();
  line(475,295,565,390,"#bb5961",13);ctx.restore();
 }else if(idx===1){
  rect(95,105,435,465,"#f0f7fb");rect(660,105,435,465,"#f0f7fb");
  text("DRAWINGS",155,170,34,"#174363");text("SPECIFICATIONS",704,170,30,"#174363");
  for(let k=0;k<5;k++){line(160,220+k*58,460,220+k*58,"#6e9ab1",7);line(725,220+k*58,1020,220+k*58,"#6e9ab1",7)}
  line(450,390,735,300,"#edab54",12);line(450,300,735,390,"#edab54",12);
 }else if(idx===2){
  rect(90,110,290,380);rect(455,110,290,380);rect(820,110,290,380);
  ["DRAWING","SPEC","CONTRACT"].forEach((s,k)=>text(s,120+k*365,190,29,accent));
  for(let k=0;k<3;k++)for(let n=0;n<4;n++)line(125+k*365,245+n*48,330+k*365,245+n*48,"#5f9ebd",6);
  line(365,375,470,375,accent,10);line(730,375,835,375,accent,10);
  ctx.beginPath();ctx.arc(600,575,58,0,Math.PI*2);ctx.strokeStyle=accent;ctx.lineWidth=12;ctx.stroke();
 }else if(idx===3){
  rect(210,95,780,500);text("REVIEW / VERIFY",275,175,45,accent);
  for(let k=0;k<4;k++){
   rect(280,220+k*76,43,43,"#173f61",accent);
   line(350,242+k*76,890,242+k*76,"#6e9ab1",7);
  }
  line(288,390,305,407,accent,8);line(305,407,340,367,accent,8);
 }else{
  rect(170,120,860,440);text("ISSUE RESOLUTION",245,195,46,accent);
  for(let k=0;k<3;k++){rect(240+k*270,265,205,130);text(["FIND","VERIFY","RESOLVE"][k],258+k*270,340,27,accent)}
  line(450,330,505,330,accent,8);line(720,330,775,330,accent,8);
  line(760,485,800,525,accent,12);line(800,525,885,425,accent,12);
 }
 // Consistent legible Linkoteq branding and per-slide content.
 const shade=ctx.createLinearGradient(0,650,0,1200);
 shade.addColorStop(0,"rgba(3,16,28,.65)");shade.addColorStop(1,"#07172b");
 ctx.fillStyle=shade;ctx.fillRect(0,645,1200,555);
 text("LINKOTEQ  /  ENGINEERING INSIGHTS",70,730,33,"#87e4f5");
 const lines=wrap(ctx,slide.headline,1050,62,3);
 lines.forEach((s,i)=>text(s,70,815+i*75,62));
 const y=815+lines.length*75+14;
 const detail=wrap(ctx,String(slide.detail||"").slice(0,145),1040,29,3);
 detail.forEach((s,i)=>text(s,70,y+i*41,29,"#d7edf4","normal"));
 ctx.fillStyle=accent;ctx.fillRect(70,1150,190,7);
 text(String(idx+1).padStart(2,"0")+" / "+String(asset.creative_brief?.slides?.length||5).padStart(2,"0"),1000,1157,23,accent);
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
   const bytes=renderSlide(slides[i],i,a);
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
  // Failed assets are never published; repair must reconcile any partial uploads.
  await request("/rest/v1/ai_news_social_assets?id=eq."+encodeURIComponent(a.id)+"&image_status=eq.pending",{
   method:"PATCH",headers:{"content-type":"application/json"},
   body:JSON.stringify({image_status:"failed",image_error:String(e.message).slice(0,280)})
  }).catch(()=>{});
 }
}
console.log(JSON.stringify({examined:jobs.length,generated,blocked,failed}));
if(failed)process.exitCode=1;

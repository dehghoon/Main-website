"use client";

import { useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase-browser";

type Props={
 imageUrl:string; setImageUrl:(v:string)=>void; imageAlt:string; setImageAlt:(v:string)=>void; imageTitle:string; setImageTitle:(v:string)=>void;
 imageCaption:string; setImageCaption:(v:string)=>void; imageMeta:string; setImageMeta:(v:string)=>void; imagePosition:string; setImagePosition:(v:string)=>void; imageSize:string; setImageSize:(v:string)=>void;
 videoUrl:string; setVideoUrl:(v:string)=>void; videoTitle:string; setVideoTitle:(v:string)=>void; videoCaption:string; setVideoCaption:(v:string)=>void; videoThumbnail:string; setVideoThumbnail:(v:string)=>void; videoMeta:string; setVideoMeta:(v:string)=>void;
 onStatus:(v:string)=>void; onInsertImage:()=>void; onInsertVideo:()=>void;
};

export default function MediaPanel(p:Props){
 const [tab,setTab]=useState<"image"|"video">("image");
 const fileRef=useRef<HTMLInputElement>(null);
 async function uploadImage(file:File){
  const s=getSupabase(); if(!s)return p.onStatus("Supabase is not configured.");
  const ext=(file.name.split(".").pop()||"jpg").replace(/[^a-zA-Z0-9]/g,"");
  const path=`featured/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  p.onStatus("Uploading image…");
  const {error}=await s.storage.from("blog-media").upload(path,file,{upsert:false,contentType:file.type});
  if(error)return p.onStatus(error.message);
  const {data}=s.storage.from("blog-media").getPublicUrl(path);
  p.setImageUrl(data.publicUrl);
  if(!p.imageAlt)p.setImageAlt(file.name.replace(/\.[^.]+$/,"").replace(/[-_]+/g," "));
  p.onStatus("Image uploaded.");
 }
 return <section className="mediaStudio">
  <div className="mediaTabs"><button type="button" className={tab==="image"?"active":""} onClick={()=>setTab("image")}>Image</button><button type="button" className={tab==="video"?"active":""} onClick={()=>setTab("video")}>Video</button></div>
  {tab==="image"?<div className="mediaEditorGrid">
   <div className="mediaPreviewPane">{p.imageUrl?<figure className={`mediaFigure media-${p.imageSize} media-${p.imagePosition}`}><img src={p.imageUrl} alt={p.imageAlt||"Preview"}/>{p.imageCaption&&<figcaption>{p.imageCaption}</figcaption>}</figure>:<div className="mediaEmpty">Upload an image or paste an image URL</div>}<div className="cmsButtonRow"><button type="button" onClick={()=>fileRef.current?.click()}>Upload Image</button><input ref={fileRef} type="file" accept="image/*" hidden onChange={e=>{const f=e.target.files?.[0];if(f)void uploadImage(f);e.currentTarget.value="";}} /><button type="button" onClick={p.onInsertImage} disabled={!p.imageUrl}>Insert Image Block into Article</button></div></div>
   <div className="mediaFields"><label>Image URL<input type="url" value={p.imageUrl} onChange={e=>p.setImageUrl(e.target.value)} placeholder="https://…"/></label><label>Alt text<input value={p.imageAlt} onChange={e=>p.setImageAlt(e.target.value)} placeholder="Describe the image for accessibility and SEO"/></label><label>Image title<input value={p.imageTitle} onChange={e=>p.setImageTitle(e.target.value)}/></label><label>Caption<input value={p.imageCaption} onChange={e=>p.setImageCaption(e.target.value)}/></label><label>Meta / social description<textarea value={p.imageMeta} onChange={e=>p.setImageMeta(e.target.value)} placeholder="What this image communicates in search/social previews"/></label><div className="cmsTwoCol"><label>Size<select value={p.imageSize} onChange={e=>p.setImageSize(e.target.value)}><option value="full">Full content width</option><option value="wide">Wide</option><option value="medium">Medium</option><option value="small">Small</option></select></label><label>Position<select value={p.imagePosition} onChange={e=>p.setImagePosition(e.target.value)}><option value="center">Center</option><option value="left">Left</option><option value="right">Right</option></select></label></div></div>
  </div>:<div className="mediaEditorGrid">
   <div className="mediaPreviewPane">{p.videoUrl?<div className="videoPreviewCard">{p.videoThumbnail&&<img src={p.videoThumbnail} alt="Video thumbnail"/>}<strong>{p.videoTitle||"Video"}</strong><span>{p.videoUrl}</span>{p.videoCaption&&<p>{p.videoCaption}</p>}</div>:<div className="mediaEmpty">Paste a YouTube, Vimeo, or hosted video URL</div>}<button type="button" onClick={p.onInsertVideo} disabled={!p.videoUrl}>Insert Video Block into Article</button></div>
   <div className="mediaFields"><label>Video URL<input type="url" value={p.videoUrl} onChange={e=>p.setVideoUrl(e.target.value)} placeholder="https://…"/></label><label>Video title<input value={p.videoTitle} onChange={e=>p.setVideoTitle(e.target.value)}/></label><label>Thumbnail URL<input type="url" value={p.videoThumbnail} onChange={e=>p.setVideoThumbnail(e.target.value)}/></label><label>Caption<input value={p.videoCaption} onChange={e=>p.setVideoCaption(e.target.value)}/></label><label>Video meta / social description<textarea value={p.videoMeta} onChange={e=>p.setVideoMeta(e.target.value)}/></label></div>
  </div>}
 </section>;
}

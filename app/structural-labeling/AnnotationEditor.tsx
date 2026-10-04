"use client";

import { useEffect, useRef, useState } from "react";
import { applyAffine, rasterBBoxToSourcePage } from "../../lib/structural-labeling/coordinates";
import { LABEL_CLASSES, type Annotation, type LabelClass, type PdfPointBBox, type TransformMetadata } from "../../lib/structural-labeling/contract";
import { labelingAccessToken, labelingApi } from "./client";

type Candidate = { id:string; page_index:number|null; workflow_state:string; transform_metadata:TransformMetadata|null };
type Revision = { annotations:Annotation[]; transform_metadata:TransformMetadata; revision_no:number; revision_kind:string };

export default function AnnotationEditor({candidate,revisions,canEdit,onSaved,onMessage}:{candidate:Candidate;revisions:Revision[];canEdit:boolean;onSaved:()=>void;onMessage:(s:string)=>void}) {
  const latest=revisions.at(-1), transform=latest?.transform_metadata || candidate.transform_metadata;
  const [annotations,setAnnotations]=useState<Annotation[]>(latest?.annotations || []);
  const [currentClass,setCurrentClass]=useState<LabelClass>("column"), [zoom,setZoom]=useState(1);
  const [start,setStart]=useState<{x:number;y:number}|null>(null);
  const canvas=useRef<HTMLCanvasElement>(null);

  useEffect(()=>{ setAnnotations(latest?.annotations || []); },[latest?.revision_no]);
  useEffect(()=>{ let url=""; void (async()=>{ try {
    if(!transform || transform.transform_validation_state!=="validated") return;
    const access=await labelingAccessToken();
    const response=await fetch(`/api/structural-labeling/source/${candidate.id}`,{headers:{Authorization:`Bearer ${access}`}});
    if(!response.ok) throw new Error("Private source load failed");
    const blob=await response.blob(), c=canvas.current; if(!c)return;
    url=URL.createObjectURL(blob);
    if(blob.type==="application/pdf"){
      const pdfjs=await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc=new URL("pdfjs-dist/build/pdf.worker.min.mjs",import.meta.url).toString();
      const document=await pdfjs.getDocument({data:new Uint8Array(await blob.arrayBuffer())}).promise;
      const page=await document.getPage((candidate.page_index || 0)+1);
      const viewport=page.getViewport({scale:2,rotation:transform.page_rotation_deg});
      c.width=Math.round(viewport.width); c.height=Math.round(viewport.height);
      const context=c.getContext("2d"); if(!context)throw new Error("Canvas unavailable");
      await page.render({canvasContext:context,viewport,canvas:c}).promise;
    } else {
      const image=new Image();
      image.onload=()=>{c.width=image.naturalWidth;c.height=image.naturalHeight;c.getContext("2d")?.drawImage(image,0,0);};
      image.src=url;
    }
  } catch(error){onMessage(error instanceof Error?error.message:"Source render failed");} })();
  return()=>{if(url)URL.revokeObjectURL(url);};},[candidate.id,candidate.page_index,transform,onMessage]);

  if(!transform || transform.transform_validation_state!=="validated")
    return <p>Pixel-only or unvalidated source. Labeling and GPT-7 handoff are blocked until a reversible PDF-point transform is validated.</p>;

  function rasterPoint(event:React.PointerEvent<HTMLDivElement>){
    const rect=event.currentTarget.getBoundingClientRect();
    return {x:(event.clientX-rect.left)/zoom,y:(event.clientY-rect.top)/zoom};
  }
  function finish(event:React.PointerEvent<HTMLDivElement>){
    if(!canEdit||!start)return;
    const end=rasterPoint(event);
    const raster:PdfPointBBox={xmin:Math.min(start.x,end.x),ymin:Math.min(start.y,end.y),xmax:Math.max(start.x,end.x),ymax:Math.max(start.y,end.y)};
    const bbox=rasterBBoxToSourcePage(raster,transform);
    if(bbox.xmax>bbox.xmin&&bbox.ymax>bbox.ymin) setAnnotations(values=>[...values,{annotation_id:crypto.randomUUID(),class:currentClass,bbox,annotation_spec_version:"v0.2",flags:{}}]);
    setStart(null);
  }
  async function save(){
    try{await labelingApi("/api/structural-labeling/action",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({candidateId:candidate.id,action:"save-revision",annotations,transform})});
      onMessage("Annotation revision saved.");onSaved();
    }catch(error){onMessage(error instanceof Error?error.message:"Save failed");}
  }
  return <section>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
      <strong>Current class:</strong>{LABEL_CLASSES.map(value=><button key={value} disabled={!canEdit} aria-pressed={currentClass===value} onClick={()=>setCurrentClass(value)}>{value}</button>)}
      <button onClick={()=>setZoom(v=>Math.max(.5,v-.25))}>−</button><span>{Math.round(zoom*100)}%</span><button onClick={()=>setZoom(v=>Math.min(3,v+.25))}>+</button>
      {canEdit&&<button onClick={()=>void save()}>Save revision</button>}
    </div>
    <div style={{overflow:"auto",maxHeight:650,border:"1px solid #bbb",marginTop:12}}>
      <div onPointerDown={e=>{if(canEdit)setStart(rasterPoint(e));}} onPointerUp={finish} style={{position:"relative",width:"max-content",touchAction:"none"}}>
        <canvas ref={canvas} style={{display:"block",width:transform.raster_width_px*zoom,height:transform.raster_height_px*zoom}}/>
        {annotations.map(annotation=>{const a=applyAffine(transform.source_page_to_raster_affine,{x:annotation.bbox.xmin,y:annotation.bbox.ymin});
          const b=applyAffine(transform.source_page_to_raster_affine,{x:annotation.bbox.xmax,y:annotation.bbox.ymax});
          return <div key={annotation.annotation_id} style={{position:"absolute",left:a.x*zoom,top:a.y*zoom,width:(b.x-a.x)*zoom,height:(b.y-a.y)*zoom,border:"2px solid",pointerEvents:"none"}}><span style={{background:"white"}}>{annotation.class}</span></div>;})}
      </div>
    </div>
    <h3>Annotations</h3>
    {annotations.map((annotation,index)=><div key={annotation.annotation_id} style={{display:"flex",gap:6,marginBottom:6,flexWrap:"wrap"}}>
      <select disabled={!canEdit} value={annotation.class} onChange={e=>setAnnotations(values=>values.map((v,i)=>i===index?{...v,class:e.target.value as LabelClass}:v))}>
        {LABEL_CLASSES.map(value=><option key={value}>{value}</option>)}</select>
      {(["xmin","ymin","xmax","ymax"] as const).map(key=><label key={key}>{key}<input style={{width:90}} disabled={!canEdit} type="number" step=".01" value={annotation.bbox[key]}
        onChange={e=>setAnnotations(values=>values.map((v,i)=>i===index?{...v,bbox:{...v.bbox,[key]:Number(e.target.value)}}:v))}/></label>)}
      {canEdit&&<button onClick={()=>setAnnotations(values=>values.filter((_,i)=>i!==index))}>Delete</button>}
    </div>)}
  </section>;
}

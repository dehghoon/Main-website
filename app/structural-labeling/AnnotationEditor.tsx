"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { applyAffine, displayPointToRaster, rasterBBoxToSourcePage, validateRoundTrip, type Point } from "../../lib/structural-labeling/coordinates";
import { LABEL_CLASSES, validateBBox, type Annotation, type LabelClass, type PdfPointBBox, type TransformMetadata } from "../../lib/structural-labeling/contract";
import { labelingAccessToken, labelingApi } from "./client";

type Candidate = { id:string; page_index:number|null; workflow_state:string; transform_metadata:unknown };

function isTransformMetadata(value: unknown): value is TransformMetadata {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<TransformMetadata>;
  return item.coordinate_space === "source-page" &&
    item.unit === "pdf-point" &&
    typeof item.effective_page_width_pt === "number" &&
    typeof item.effective_page_height_pt === "number" &&
    typeof item.raster_width_px === "number" &&
    typeof item.raster_height_px === "number" &&
    Array.isArray(item.raster_to_source_page_affine) &&
    item.raster_to_source_page_affine.length === 6 &&
    Array.isArray(item.source_page_to_raster_affine) &&
    item.source_page_to_raster_affine.length === 6 &&
    Array.isArray(item.display_to_raster_affine) &&
    item.display_to_raster_affine.length === 6;
}
type Revision = { annotations:Annotation[]; transform_metadata:TransformMetadata; revision_no:number; revision_kind:string };
type Pan = { x:number; y:number; left:number; top:number };

export default function AnnotationEditor({candidate,revisions,canEdit,onSaved,onMessage}:{candidate:Candidate;revisions:Revision[];canEdit:boolean;onSaved:()=>void;onMessage:(s:string)=>void}) {
  const latest=revisions.at(-1);
  const candidateTransform = isTransformMetadata(candidate.transform_metadata) ? candidate.transform_metadata : null;
  const transform = latest?.transform_metadata ?? candidateTransform;
  const [annotations,setAnnotations]=useState<Annotation[]>(latest?.annotations ?? []);
  const [currentClass,setCurrentClass]=useState<LabelClass>("column");
  const [zoom,setZoom]=useState(1);
  const [mode,setMode]=useState<"box"|"pan">("box");
  const [start,setStart]=useState<Point|null>(null);
  const [pan,setPan]=useState<Pan|null>(null);
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const scrollerRef=useRef<HTMLDivElement>(null);

  useEffect(()=>{ setAnnotations(latest?.annotations ?? []); setSelectedId(null); },[latest?.revision_no]);

  useEffect(()=>{
    let objectUrl="";
    let cancelled=false;
    void (async()=>{
      try{
        const sourceTransform = transform;
        if(!sourceTransform || sourceTransform.transform_validation_state!=="validated") return;
        validateRoundTrip(sourceTransform,0.01);
        const access=await labelingAccessToken();
        const response=await fetch(`/api/structural-labeling/source/${candidate.id}`,{headers:{Authorization:`Bearer ${access}`}});
        if(!response.ok) throw new Error("Private source load failed");
        const blob=await response.blob(), canvas=canvasRef.current;
        if(!canvas || cancelled) return;
        objectUrl=URL.createObjectURL(blob);
        if(blob.type==="application/pdf"){
          const pdfjs=await import("pdfjs-dist");
          pdfjs.GlobalWorkerOptions.workerSrc=new URL("pdfjs-dist/build/pdf.worker.min.mjs",import.meta.url).toString();
          const doc=await pdfjs.getDocument({data:new Uint8Array(await blob.arrayBuffer())}).promise;
          const page=await doc.getPage((candidate.page_index ?? 0)+1);
          const viewport=page.getViewport({scale:2,rotation:sourceTransform.page_rotation_deg});
          canvas.width=Math.round(viewport.width); canvas.height=Math.round(viewport.height);
          const ctx=canvas.getContext("2d"); if(!ctx) throw new Error("Canvas unavailable");
          await page.render({canvasContext:ctx,viewport,canvas}).promise;
        } else {
          await new Promise<void>((resolve,reject)=>{
            const image=new Image();
            image.onload=()=>{ if(cancelled) return resolve(); canvas.width=image.naturalWidth; canvas.height=image.naturalHeight; const ctx=canvas.getContext("2d"); if(!ctx) return reject(new Error("Canvas unavailable")); ctx.drawImage(image,0,0); resolve(); };
            image.onerror=()=>reject(new Error("Image render failed"));
            image.src=objectUrl;
          });
        }
      }catch(error){ onMessage(error instanceof Error?error.message:"Source render failed"); }
    })();
    return()=>{ cancelled=true; if(objectUrl) URL.revokeObjectURL(objectUrl); };
  },[candidate.id,candidate.page_index,transform,onMessage]);

  const selected=useMemo(()=>annotations.find(a=>a.annotation_id===selectedId)??null,[annotations,selectedId]);

  if(!transform || transform.transform_validation_state!=="validated")
    return <p>Pixel-only or unvalidated source. Labeling and GPT-7 handoff are blocked until a reversible PDF-point transform is validated.</p>;

  const activeTransform: TransformMetadata = transform;

  function point(event:React.PointerEvent<HTMLDivElement>):Point{
    const rect=event.currentTarget.getBoundingClientRect();
    return {x:(event.clientX-rect.left)/zoom,y:(event.clientY-rect.top)/zoom};
  }
  function begin(event:React.PointerEvent<HTMLDivElement>){
    if(mode==="pan"){ const s=scrollerRef.current; if(!s)return; setPan({x:event.clientX,y:event.clientY,left:s.scrollLeft,top:s.scrollTop}); event.currentTarget.setPointerCapture(event.pointerId); return; }
    if(canEdit){ setStart(point(event)); setSelectedId(null); }
  }
  function move(event:React.PointerEvent<HTMLDivElement>){
    if(mode!=="pan"||!pan)return; const s=scrollerRef.current; if(!s)return;
    s.scrollLeft=pan.left-(event.clientX-pan.x); s.scrollTop=pan.top-(event.clientY-pan.y);
  }
  function finish(event:React.PointerEvent<HTMLDivElement>){
    if(mode==="pan"){ setPan(null); return; }
    if(!canEdit||!start)return;
    const end=point(event), rs=displayPointToRaster(start,activeTransform), re=displayPointToRaster(end,activeTransform);
    const raster:PdfPointBBox={xmin:Math.min(rs.x,re.x),ymin:Math.min(rs.y,re.y),xmax:Math.max(rs.x,re.x),ymax:Math.max(rs.y,re.y)};
    const bbox=rasterBBoxToSourcePage(raster,activeTransform);
    const errors=validateBBox(bbox,activeTransform.effective_page_width_pt,activeTransform.effective_page_height_pt);
    if(errors.length) onMessage(errors.join(", "));
    else { const a:Annotation={annotation_id:crypto.randomUUID(),class:currentClass,bbox,annotation_spec_version:"v0.2",flags:{}}; setAnnotations(v=>[...v,a]); setSelectedId(a.annotation_id); }
    setStart(null);
  }
  async function save(){
    try{
      validateRoundTrip(activeTransform,0.01);
      const errors=annotations.flatMap(a=>[
        ...validateBBox(a.bbox,activeTransform.effective_page_width_pt,activeTransform.effective_page_height_pt).map(e=>`${a.annotation_id}:${e}`),
        ...(LABEL_CLASSES.includes(a.class)?[]:[`${a.annotation_id}:invalid-class`]),
      ]);
      if(errors.length) throw new Error(errors.join(", "));
      await labelingApi("/api/structural-labeling/action",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({candidateId:candidate.id,action:"save-revision",annotations,transform:activeTransform})});
      onMessage("Annotation revision saved."); onSaved();
    }catch(error){ onMessage(error instanceof Error?error.message:"Save failed"); }
  }

  return <section>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
      <strong>Current class</strong>
      {LABEL_CLASSES.map(value=><button key={value} disabled={!canEdit} aria-pressed={currentClass===value} onClick={()=>setCurrentClass(value)}>{value}</button>)}
      <span>|</span><button aria-pressed={mode==="box"} onClick={()=>setMode("box")}>Box</button><button aria-pressed={mode==="pan"} onClick={()=>setMode("pan")}>Pan</button>
      <button onClick={()=>setZoom(v=>Math.max(.5,v-.25))}>−</button><span>{Math.round(zoom*100)}%</span><button onClick={()=>setZoom(v=>Math.min(3,v+.25))}>+</button>
      {canEdit&&<button onClick={()=>void save()}>Save revision</button>}
    </div>
    <p>Authoritative annotations are source-page PDF points mapped deterministically through display → raster → source-page.</p>
    <div ref={scrollerRef} style={{overflow:"auto",maxHeight:650,border:"1px solid #bbb",marginTop:12}}>
      <div onPointerDown={begin} onPointerMove={move} onPointerUp={finish} onPointerCancel={()=>{setStart(null);setPan(null);}} style={{position:"relative",width:activeTransform.raster_width_px*zoom,height:activeTransform.raster_height_px*zoom,touchAction:"none",cursor:mode==="pan"?(pan?"grabbing":"grab"):"crosshair"}}>
        <canvas ref={canvasRef} style={{display:"block",width:activeTransform.raster_width_px*zoom,height:activeTransform.raster_height_px*zoom}}/>
        {annotations.map(a=>{const p=applyAffine(activeTransform.source_page_to_raster_affine,{x:a.bbox.xmin,y:a.bbox.ymin}),q=applyAffine(activeTransform.source_page_to_raster_affine,{x:a.bbox.xmax,y:a.bbox.ymax});return <button key={a.annotation_id} type="button" title={`${a.class} ${a.annotation_id}`} onPointerDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();setSelectedId(a.annotation_id);}} style={{position:"absolute",left:Math.min(p.x,q.x)*zoom,top:Math.min(p.y,q.y)*zoom,width:Math.abs(q.x-p.x)*zoom,height:Math.abs(q.y-p.y)*zoom,border:selectedId===a.annotation_id?"3px solid":"2px solid",background:"transparent",padding:0}}><span style={{background:"white"}}>{a.class}</span></button>;})}
      </div>
    </div>
    <h3>Annotations</h3>
    {annotations.length===0&&<p>No annotations yet.</p>}
    {annotations.map(a=><div key={a.annotation_id} onClick={()=>setSelectedId(a.annotation_id)} style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap",outline:a.annotation_id===selectedId?"2px solid":undefined,padding:4}}>
      <select disabled={!canEdit} value={a.class} onChange={e=>{const c=e.target.value as LabelClass;setAnnotations(v=>v.map(x=>x.annotation_id===a.annotation_id?{...x,class:c}:x));}}>{LABEL_CLASSES.map(v=><option key={v} value={v}>{v}</option>)}</select>
      {(["xmin","ymin","xmax","ymax"] as const).map(k=><label key={k}>{k}<input style={{width:92}} disabled={!canEdit} type="number" step=".01" value={a.bbox[k]} onChange={e=>{const n=Number(e.target.value);setAnnotations(v=>v.map(x=>x.annotation_id===a.annotation_id?{...x,bbox:{...x.bbox,[k]:n}}:x));}}/></label>)}
      <code>{JSON.stringify(a.flags)}</code>
      {canEdit&&<button onClick={()=>setAnnotations(v=>v.filter(x=>x.annotation_id!==a.annotation_id))}>Delete</button>}
    </div>)}
    {selected&&<p>Selected: <code>{selected.annotation_id}</code> · {selected.class}</p>}
  </section>;
}

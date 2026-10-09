"use client";
import {useEffect,useRef,useState} from "react";
import type {PointerEvent as PE} from "react";
import {applyAffine,rasterBBoxToSourcePage,validateRoundTrip} from "../../lib/structural-labeling/coordinates";
import {LABEL_CLASSES,validateBBox,type Annotation,type LabelClass,type PdfPointBBox,type TransformMetadata} from "../../lib/structural-labeling/contract";
import {labelingApi} from "./client";
import PrivateSourceCanvas from "./PrivateSourceCanvas";

type C={id:string;page_index:number|null;workflow_state:string;transform_metadata:unknown};
type R={annotations:Annotation[];transform_metadata:TransformMetadata;revision_no:number;revision_kind:string};
const COLORS:Record<LabelClass,{s:string;f:string}>={column:{s:"#2563eb",f:"rgba(37,99,235,.12)"},beam:{s:"#d97706",f:"rgba(217,119,6,.12)"},wall:{s:"#dc2626",f:"rgba(220,38,38,.12)"}};
const MSG:Record<string,string>={"bbox-must-have-positive-area":"Annotation box must have positive width and height.","bbox-must-be-within-effective-page-bounds":"Annotation box must stay within the PDF page bounds.","bbox-and-page-values-must-be-finite":"Annotation and page coordinates must be finite numbers."};
const explain=(x:string)=>MSG[x]?`${MSG[x]} (${x})`:x;
const copy=(a:Annotation[])=>a.map(x=>({...x,bbox:{...x.bbox},flags:{...x.flags}}));
function isTransform(v:unknown):v is TransformMetadata{if(!v||typeof v!=="object")return false;const x=v as Partial<TransformMetadata>;return x.coordinate_space==="source-page"&&x.unit==="pdf-point"&&x.transform_validation_state==="validated"&&typeof x.raster_width_px==="number"&&typeof x.raster_height_px==="number"&&Array.isArray(x.source_page_to_raster_affine)&&Array.isArray(x.raster_to_source_page_affine)}

export default function EnhancedAnnotationEditor({candidate,revisions,canEdit,onSaved,onMessage}:{candidate:C;revisions:R[];canEdit:boolean;onSaved:()=>void;onMessage:(m:string)=>void}){
 const latest=revisions.at(-1),ct=isTransform(candidate.transform_metadata)?candidate.transform_metadata:null,t=latest?.transform_metadata??ct;
 const [a,setA]=useState<Annotation[]>(copy(latest?.annotations??[])),[undo,setUndo]=useState<Annotation[][]>([]),[redo,setRedo]=useState<Annotation[][]>([]),[cls,setCls]=useState<LabelClass>("column"),[zoom,setZoom]=useState(100),[start,setStart]=useState<{x:number;y:number}|null>(null),[w,setW]=useState(0),[full,setFull]=useState(false);
 const root=useRef<HTMLElement>(null),host=useRef<HTMLDivElement>(null);
 useEffect(()=>{setA(copy(latest?.annotations??[]));setUndo([]);setRedo([])},[latest?.revision_no,candidate.id]);
 useEffect(()=>{const n=host.current;if(!n)return;const f=()=>setW(n.clientWidth);f();const o=new ResizeObserver(f);o.observe(n);return()=>o.disconnect()},[]);
 useEffect(()=>{const f=()=>setFull(document.fullscreenElement===root.current);document.addEventListener("fullscreenchange",f);return()=>document.removeEventListener("fullscreenchange",f)},[]);
 if(!t||t.transform_validation_state!=="validated")return <p>Pixel-only or unvalidated source. Labeling and GPT-7 handoff are blocked until a reversible PDF-point transform is validated.</p>;
 const rw=Math.max(1,t.raster_width_px),rh=Math.max(1,t.raster_height_px),fit=w?Math.min(1,w/rw):1,scale=Math.max(.01,fit*(zoom/100)),dw=rw*scale,dh=rh*scale;
 const commit=(n:Annotation[])=>{setUndo(x=>[...x,copy(a)].slice(-100));setRedo([]);setA(copy(n))};
 const doUndo=()=>setUndo(s=>{const p=s.at(-1);if(!p)return s;setRedo(r=>[copy(a),...r].slice(0,100));setA(copy(p));return s.slice(0,-1)});
 const doRedo=()=>setRedo(s=>{const n=s[0];if(!n)return s;setUndo(u=>[...u,copy(a)].slice(-100));setA(copy(n));return s.slice(1)});
 useEffect(()=>{const f=(e:KeyboardEvent)=>{if(!canEdit||!(e.ctrlKey||e.metaKey)||e.key.toLowerCase()!=="z")return;e.preventDefault();e.shiftKey?doRedo():doUndo()};window.addEventListener("keydown",f);return()=>window.removeEventListener("keydown",f)});
 const point=(e:PE<HTMLDivElement>)=>{const r=e.currentTarget.getBoundingClientRect();return{x:(e.clientX-r.left)/scale,y:(e.clientY-r.top)/scale}};
 const finish=(e:PE<HTMLDivElement>)=>{if(!canEdit||!start)return;const q=point(e),rb:PdfPointBBox={xmin:Math.min(start.x,q.x),ymin:Math.min(start.y,q.y),xmax:Math.max(start.x,q.x),ymax:Math.max(start.y,q.y)},bbox=rasterBBoxToSourcePage(rb,t),err=validateBBox(bbox,t.effective_page_width_pt,t.effective_page_height_pt);if(err.length)onMessage(err.map(explain).join(" "));else commit([...a,{annotation_id:crypto.randomUUID(),class:cls,bbox,annotation_spec_version:"v0.2",flags:{}}]);setStart(null)};
 const save=async()=>{try{validateRoundTrip(t,.01);const err=a.flatMap(x=>validateBBox(x.bbox,t.effective_page_width_pt,t.effective_page_height_pt).map(e=>`${x.annotation_id}: ${explain(e)}`));if(err.length)throw new Error(err.join(" "));await labelingApi("/api/structural-labeling/action",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({candidateId:candidate.id,action:"save-revision",annotations:a,transform:t})});onMessage("Annotation revision saved.");onSaved()}catch(e){onMessage(e instanceof Error?e.message:"Save failed")}};
 const toggle=async()=>{try{document.fullscreenElement===root.current?await document.exitFullscreen():await root.current?.requestFullscreen()}catch(e){onMessage(e instanceof Error?e.message:"Fullscreen mode failed")}};
 return <section ref={root} style={{width:"100%",minHeight:full?"100vh":"88vh",background:"#fff",padding:full?12:0,boxSizing:"border-box",overflow:"hidden"}}>
  <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",position:"sticky",top:0,zIndex:20,background:"#fff",padding:"10px 0",borderBottom:"1px solid #e2e8f0"}}>
   <strong>Label:</strong>{LABEL_CLASSES.map(x=><button key={x} disabled={!canEdit} aria-pressed={cls===x} onClick={()=>setCls(x)} style={{border:`2px solid ${COLORS[x].s}`,background:cls===x?COLORS[x].f:"#fff",borderRadius:7,padding:"6px 10px"}}>{x}</button>)}
   <button onClick={()=>setZoom(z=>Math.max(10,z-10))} disabled={zoom<=10}>−</button><input aria-label="Zoom percentage" type="range" min={10} max={150} step={10} value={zoom} onChange={e=>setZoom(+e.target.value)}/><strong>{zoom}%</strong><button onClick={()=>setZoom(z=>Math.min(150,z+10))} disabled={zoom>=150}>+</button><button onClick={()=>setZoom(100)}>Fit width</button>
   <button disabled={!canEdit||!undo.length} onClick={doUndo}>Undo</button><button disabled={!canEdit||!redo.length} onClick={doRedo}>Redo</button><button onClick={()=>void toggle()}>{full?"Exit full screen":"Full screen"}</button>{canEdit&&<button onClick={()=>void save()}>Save revision</button>}
  </div>
  <p style={{margin:"8px 0"}}>Zoom is display-only. Saved geometry remains authoritative source-page PDF points.</p>
  <div ref={host} style={{width:"100%",height:full?"calc(100vh - 150px)":"72vh",minHeight:520,overflow:"auto",border:"1px solid #94a3b8",background:"#e2e8f0"}}>
   <div onPointerDown={e=>canEdit&&setStart(point(e))} onPointerUp={finish} onPointerCancel={()=>setStart(null)} style={{position:"relative",width:dw,height:dh,touchAction:"none",background:"#fff",margin:"0 auto"}}>
    <PrivateSourceCanvas candidateId={candidate.id} pageIndex={candidate.page_index} transform={t} displayWidth={dw} displayHeight={dh} onError={onMessage}/>
    {a.map(x=>{const p=applyAffine(t.source_page_to_raster_affine,{x:x.bbox.xmin,y:x.bbox.ymin}),q=applyAffine(t.source_page_to_raster_affine,{x:x.bbox.xmax,y:x.bbox.ymax}),c=COLORS[x.class];return <div key={x.annotation_id} style={{position:"absolute",left:Math.min(p.x,q.x)*scale,top:Math.min(p.y,q.y)*scale,width:Math.abs(q.x-p.x)*scale,height:Math.abs(q.y-p.y)*scale,border:`3px solid ${c.s}`,background:c.f,pointerEvents:"none",boxSizing:"border-box"}}><span style={{background:c.s,color:"#fff",padding:"2px 5px",fontSize:12}}>{x.class}</span></div>})}
   </div>
  </div>
  <h3>Annotations ({a.length})</h3>{!a.length&&<p>No annotations yet.</p>}
  <div style={{display:"grid",gap:6}}>{a.map((x,i)=>{const c=COLORS[x.class];return <div key={x.annotation_id} style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",borderLeft:`5px solid ${c.s}`,background:c.f,padding:"7px 9px",borderRadius:6}}><strong>#{i+1}</strong><select disabled={!canEdit} value={x.class} onChange={e=>commit(a.map((v,j)=>j===i?{...v,class:e.target.value as LabelClass}:v))}>{LABEL_CLASSES.map(v=><option key={v}>{v}</option>)}</select>{canEdit&&<button onClick={()=>commit(a.filter((_,j)=>j!==i))}>Delete label</button>}</div>})}</div>
 </section>
}

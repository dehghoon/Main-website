"use client";
import {useEffect,useRef,useState} from "react";
import type {PointerEvent as PE} from "react";
import {applyAffine,rasterBBoxToSourcePage,validateRoundTrip} from "../../lib/structural-labeling/coordinates";
import {LABEL_CLASSES,validateBBox,type Annotation,type LabelClass,type PdfPointBBox,type TransformMetadata} from "../../lib/structural-labeling/contract";
import {labelingApi} from "./client";
import PrivateSourceCanvas from "./PrivateSourceCanvas";

type Candidate={id:string;page_index:number|null;workflow_state:string;transform_metadata:unknown};
type Revision={annotations:Annotation[];transform_metadata:TransformMetadata;revision_no:number;revision_kind:string};
type Tool="draw"|"select";
const COLORS:Record<LabelClass,{stroke:string;fill:string}>={column:{stroke:"#2563eb",fill:"rgba(37,99,235,.12)"},beam:{stroke:"#d97706",fill:"rgba(217,119,6,.12)"},wall:{stroke:"#dc2626",fill:"rgba(220,38,38,.12)"}};
const clone=(items:Annotation[])=>items.map(x=>({...x,bbox:{...x.bbox},flags:{...x.flags}}));
function validTransform(v:unknown):v is TransformMetadata{
 if(!v||typeof v!=="object")return false;
 const x=v as Partial<TransformMetadata>;
 return x.coordinate_space==="source-page"&&x.unit==="pdf-point"&&x.transform_validation_state==="validated"&&typeof x.raster_width_px==="number"&&typeof x.raster_height_px==="number"&&typeof x.effective_page_width_pt==="number"&&typeof x.effective_page_height_pt==="number"&&Array.isArray(x.source_page_to_raster_affine)&&Array.isArray(x.raster_to_source_page_affine);
}

export default function EnhancedAnnotationEditor({candidate,revisions,canEdit,onSaved,onMessage}:{candidate:Candidate;revisions:Revision[];canEdit:boolean;onSaved:()=>void;onMessage:(message:string)=>void}){
 const latest=revisions.at(-1);
 const transform=latest?.transform_metadata??(validTransform(candidate.transform_metadata)?candidate.transform_metadata:null);
 const [annotations,setAnnotations]=useState<Annotation[]>(clone(latest?.annotations??[]));
 const [history,setHistory]=useState<Annotation[][]>([]);
 const [labelClass,setLabelClass]=useState<LabelClass>("column");
 const [tool,setTool]=useState<Tool>("draw");
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const [lineWidth,setLineWidth]=useState(3);
 const [fontSize,setFontSize]=useState(12);
 const [zoom,setZoom]=useState(100);
 const [start,setStart]=useState<{x:number;y:number}|null>(null);
 const [hostWidth,setHostWidth]=useState(0);
 const host=useRef<HTMLDivElement>(null);

 useEffect(()=>{setAnnotations(clone(latest?.annotations??[]));setHistory([]);setSelectedId(null);setTool("draw")},[candidate.id,latest?.revision_no]);
 useEffect(()=>{const node=host.current;if(!node)return;const update=()=>setHostWidth(node.clientWidth);update();const observer=new ResizeObserver(update);observer.observe(node);return()=>observer.disconnect()},[]);

 if(!transform)return <p>Pixel-only or unvalidated source. Labeling is blocked until a reversible PDF-point transform is validated.</p>;

 const rw=Math.max(1,transform.raster_width_px),rh=Math.max(1,transform.raster_height_px),fit=hostWidth?Math.min(1,hostWidth/rw):1,scale=Math.max(.01,fit*zoom/100),dw=rw*scale,dh=rh*scale;
 const commit=(next:Annotation[])=>{setHistory(h=>[...h,clone(annotations)].slice(-100));setAnnotations(clone(next));if(selectedId&&!next.some(x=>x.annotation_id===selectedId))setSelectedId(null)};
 const undo=()=>setHistory(h=>{const previous=h.at(-1);if(!previous)return h;setAnnotations(clone(previous));setSelectedId(null);return h.slice(0,-1)});
 const point=(e:PE<HTMLDivElement>)=>{const r=e.currentTarget.getBoundingClientRect();return{x:(e.clientX-r.left)/scale,y:(e.clientY-r.top)/scale}};
 const finish=(e:PE<HTMLDivElement>)=>{
  if(!canEdit||tool!=="draw"||!start)return;
  const end=point(e),raster:PdfPointBBox={xmin:Math.min(start.x,end.x),ymin:Math.min(start.y,end.y),xmax:Math.max(start.x,end.x),ymax:Math.max(start.y,end.y)};
  const bbox=rasterBBoxToSourcePage(raster,transform);
  const errors=validateBBox(bbox,transform.effective_page_width_pt,transform.effective_page_height_pt);
  if(errors.length)onMessage(errors.join(" "));
  else commit([...annotations,{annotation_id:crypto.randomUUID(),class:labelClass,bbox,annotation_spec_version:"v0.2",flags:{}}]);
  setStart(null);
 };
 const deleteSelected=()=>{if(canEdit&&selectedId){commit(annotations.filter(x=>x.annotation_id!==selectedId));setSelectedId(null)}};
 const save=async()=>{
  try{
   validateRoundTrip(transform,.01);
   const errors=annotations.flatMap(x=>validateBBox(x.bbox,transform.effective_page_width_pt,transform.effective_page_height_pt));
   if(errors.length)throw new Error(errors.join(" "));
   await labelingApi("/api/structural-labeling/action",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({candidateId:candidate.id,action:"save-revision",annotations,transform})});
   onMessage("Annotation revision saved.");onSaved();
  }catch(error){onMessage(error instanceof Error?error.message:"Save failed")}
 };

 return <section style={{width:"100%",background:"#fff"}}>
  <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",padding:"10px 0",position:"sticky",top:0,zIndex:20,background:"#fff"}}>
   <strong>Label:</strong>
   {LABEL_CLASSES.map(item=><button key={item} disabled={!canEdit} aria-pressed={tool==="draw"&&labelClass===item} onClick={()=>{setLabelClass(item);setTool("draw");setSelectedId(null)}} style={{border:`2px solid ${COLORS[item].stroke}`,background:tool==="draw"&&labelClass===item?COLORS[item].fill:"#fff"}}>{item}</button>)}
   <button disabled={!canEdit} aria-pressed={tool==="select"} onClick={()=>{setTool(tool==="select"?"draw":"select");setStart(null)}}>{tool==="select"?"Exit select":"Select"}</button>
   <button disabled={!canEdit||!selectedId} onClick={deleteSelected}>Delete selected</button>
   <label>Box line <input type="range" min={1} max={8} value={lineWidth} onChange={e=>setLineWidth(+e.target.value)}/>{lineWidth}px</label>
   <label>Label font <input type="range" min={8} max={24} value={fontSize} onChange={e=>setFontSize(+e.target.value)}/>{fontSize}px</label>
   <button onClick={()=>setZoom(z=>Math.max(10,z-10))}>−</button><input aria-label="Zoom percentage" type="range" min={10} max={150} step={10} value={zoom} onChange={e=>setZoom(+e.target.value)}/><strong>{zoom}%</strong><button onClick={()=>setZoom(z=>Math.min(150,z+10))}>+</button>
   <button disabled={!canEdit||!history.length} onClick={undo}>Undo</button>
   {canEdit&&<button onClick={()=>void save()}>Save revision</button>}
  </div>
  <p>{tool==="select"?"Select mode: click a label box, then delete it.":"Draw mode: choose a class and drag a box."} Line width and font size are display-only.</p>
  <div ref={host} style={{width:"100%",height:"72vh",minHeight:520,overflow:"auto",border:"1px solid #94a3b8",background:"#e2e8f0"}}>
   <div onPointerDown={e=>{if(canEdit&&tool==="draw")setStart(point(e));else if(tool==="select"&&e.target===e.currentTarget)setSelectedId(null)}} onPointerUp={finish} onPointerCancel={()=>setStart(null)} style={{position:"relative",width:dw,height:dh,margin:"0 auto",background:"#fff",touchAction:"none",cursor:tool==="draw"?"crosshair":"default"}}>
    <PrivateSourceCanvas candidateId={candidate.id} pageIndex={candidate.page_index} transform={transform} displayWidth={dw} displayHeight={dh} onError={onMessage}/>
    {annotations.map(item=>{
     const p=applyAffine(transform.source_page_to_raster_affine,{x:item.bbox.xmin,y:item.bbox.ymin}),q=applyAffine(transform.source_page_to_raster_affine,{x:item.bbox.xmax,y:item.bbox.ymax}),c=COLORS[item.class],selected=selectedId===item.annotation_id;
     return <div key={item.annotation_id} role={tool==="select"?"button":undefined} tabIndex={tool==="select"?0:undefined} onClick={e=>{if(tool==="select"){e.stopPropagation();setSelectedId(item.annotation_id)}}} onKeyDown={e=>{if(tool==="select"&&(e.key==="Enter"||e.key===" ")){e.preventDefault();setSelectedId(item.annotation_id)}}} style={{position:"absolute",left:Math.min(p.x,q.x)*scale,top:Math.min(p.y,q.y)*scale,width:Math.abs(q.x-p.x)*scale,height:Math.abs(q.y-p.y)*scale,border:`${lineWidth}px solid ${c.stroke}`,background:c.fill,pointerEvents:tool==="select"?"auto":"none",cursor:tool==="select"?"pointer":"default",boxSizing:"border-box",outline:selected?"2px dashed #111827":undefined,outlineOffset:selected?2:undefined}}>
      <span style={{background:c.stroke,color:"#fff",padding:"2px 5px",fontSize}}>{item.class}</span>
     </div>
    })}
   </div>
  </div>
  <h3>Annotations ({annotations.length})</h3>
  <div style={{display:"grid",gap:6}}>
   {annotations.map((item,index)=><div key={item.annotation_id} style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
    <strong>#{index+1}</strong>
    <select disabled={!canEdit} value={item.class} onChange={e=>commit(annotations.map((value,i)=>i===index?{...value,class:e.target.value as LabelClass}:value))}>{LABEL_CLASSES.map(value=><option key={value}>{value}</option>)}</select>
    {canEdit&&<button onClick={()=>commit(annotations.filter((_,i)=>i!==index))}>Delete label</button>}
   </div>)}
  </div>
 </section>
}

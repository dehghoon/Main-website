"use client";
import {useEffect,useRef,useState} from "react";
import type {PointerEvent as PE} from "react";
import {applyAffine,rasterBBoxToSourcePage,validateRoundTrip} from "../../lib/structural-labeling/coordinates";
import {LABEL_CLASSES,bboxFromOrientedBBox,normalizeRotationDeg,type Annotation,type LabelClass,type OrientedBBox,type PdfPointBBox,type Point2D,type TransformMetadata,validateOrientedBBox} from "../../lib/structural-labeling/contract";
import {assertAnnotationsValid} from "../../lib/structural-labeling/validation";
import {labelingApi} from "./client";
import PrivateSourceCanvas from "./PrivateSourceCanvas";
import RotatedAnnotationOverlay from "./RotatedAnnotationOverlay";

type C={id:string;page_index:number|null;workflow_state:string;transform_metadata:unknown};
type R={annotations:Annotation[];transform_metadata:TransformMetadata;revision_no:number;revision_kind:string};
type Tool="draw"|"select";
const clone=(a:Annotation[])=>a.map(x=>({...x,bbox:{...x.bbox},oriented_bbox:x.oriented_bbox?{...x.oriented_bbox}:undefined,flags:{...x.flags}}));
function valid(v:unknown):v is TransformMetadata{
 if(!v||typeof v!=="object")return false;const x=v as Partial<TransformMetadata>;
 return x.coordinate_space==="source-page"&&x.unit==="pdf-point"&&x.transform_validation_state==="validated"&&typeof x.raster_width_px==="number"&&typeof x.raster_height_px==="number"&&typeof x.effective_page_width_pt==="number"&&typeof x.effective_page_height_pt==="number"&&Array.isArray(x.source_page_to_raster_affine)&&Array.isArray(x.raster_to_source_page_affine)
}
function obb(a:Annotation):OrientedBBox{return a.oriented_bbox??{center_x:(a.bbox.xmin+a.bbox.xmax)/2,center_y:(a.bbox.ymin+a.bbox.ymax)/2,width:a.bbox.xmax-a.bbox.xmin,height:a.bbox.ymax-a.bbox.ymin,rotation_deg:0}}

export default function EnhancedAnnotationEditor({candidate,revisions,canEdit,onSaved,onMessage}:{candidate:C;revisions:R[];canEdit:boolean;onSaved:()=>void;onMessage:(m:string)=>void}){
 const latest=revisions.at(-1),ct=valid(candidate.transform_metadata)?candidate.transform_metadata:null,t=latest?.transform_metadata??ct;
 const [a,setA]=useState<Annotation[]>(clone(latest?.annotations??[])),[hist,setHist]=useState<Annotation[][]>([]),[cls,setCls]=useState<LabelClass>("column"),[tool,setTool]=useState<Tool>("draw"),[rotate,setRotate]=useState(false),[selected,setSelected]=useState<string|null>(null),[line,setLine]=useState(3),[font,setFont]=useState(12),[zoom,setZoom]=useState(100),[start,setStart]=useState<Point2D|null>(null),[w,setW]=useState(0),[rotBase,setRotBase]=useState<Annotation[]|null>(null);
 const host=useRef<HTMLDivElement>(null);
 useEffect(()=>{setA(clone(latest?.annotations??[]));setHist([]);setSelected(null);setTool("draw");setRotate(false)},[candidate.id,latest?.revision_no]);
 useEffect(()=>{const n=host.current;if(!n)return;const f=()=>setW(n.clientWidth);f();const o=new ResizeObserver(f);o.observe(n);return()=>o.disconnect()},[]);
 if(!t)return <p>Pixel-only or unvalidated source. Labeling is blocked until a reversible PDF-point transform is validated.</p>;
 const rw=Math.max(1,t.raster_width_px),rh=Math.max(1,t.raster_height_px),fit=w?Math.min(1,w/rw):1,scale=Math.max(.01,fit*zoom/100),dw=rw*scale,dh=rh*scale;
 const commit=(n:Annotation[])=>{setHist(h=>[...h,clone(a)].slice(-100));setA(clone(n));if(selected&&!n.some(x=>x.annotation_id===selected))setSelected(null)};
 const undo=()=>setHist(h=>{const p=h.at(-1);if(!p)return h;setA(clone(p));setSelected(null);return h.slice(0,-1)});
 const point=(e:PE<HTMLDivElement>)=>{const r=e.currentTarget.getBoundingClientRect();return{x:(e.clientX-r.left)/scale,y:(e.clientY-r.top)/scale}};
 const sourcePoint=(e:PE<SVGSVGElement>)=>{const r=e.currentTarget.getBoundingClientRect();return applyAffine(t.raster_to_source_page_affine,{x:(e.clientX-r.left)/scale,y:(e.clientY-r.top)/scale})};
 const finish=(e:PE<HTMLDivElement>)=>{if(!canEdit||tool!=="draw"||!start)return;const q=point(e),rb:PdfPointBBox={xmin:Math.min(start.x,q.x),ymin:Math.min(start.y,q.y),xmax:Math.max(start.x,q.x),ymax:Math.max(start.y,q.y)},bbox=rasterBBoxToSourcePage(rb,t),width=bbox.xmax-bbox.xmin,height=bbox.ymax-bbox.ymin;if(!(width>0&&height>0)){onMessage("Annotation box must have positive width and height.");setStart(null);return}const n:Annotation={annotation_id:crypto.randomUUID(),class:cls,bbox,annotation_spec_version:rotate?"v0.3":"v0.2",flags:{}};if(rotate)n.oriented_bbox={center_x:(bbox.xmin+bbox.xmax)/2,center_y:(bbox.ymin+bbox.ymax)/2,width,height,rotation_deg:0};commit([...a,n]);setStart(null)};
 const del=()=>{if(canEdit&&selected){commit(a.filter(x=>x.annotation_id!==selected));setSelected(null)}};
 const beginRotate=(e:PE<SVGCircleElement>,id:string)=>{if(!canEdit||!rotate)return;e.preventDefault();e.stopPropagation();setSelected(id);setRotBase(clone(a));e.currentTarget.setPointerCapture(e.pointerId)};
 const moveRotate=(e:PE<SVGSVGElement>)=>{if(!rotBase||!selected||!rotate)return;const cur=a.find(x=>x.annotation_id===selected);if(!cur)return;const base=obb(cur),p=sourcePoint(e),angle=Math.atan2(p.y-base.center_y,p.x-base.center_x)*180/Math.PI,next:OrientedBBox={...base,rotation_deg:normalizeRotationDeg(angle+90)},bbox=bboxFromOrientedBBox(next);if(validateOrientedBBox(next,bbox,t.effective_page_width_pt,t.effective_page_height_pt).length)return;setA(items=>items.map(x=>x.annotation_id===selected?{...x,bbox,oriented_bbox:next,annotation_spec_version:"v0.3"}:x))};
 const endRotate=(e:PE<SVGSVGElement>)=>{if(!rotBase)return;e.preventDefault();setHist(h=>[...h,clone(rotBase)].slice(-100));setRotBase(null)};
 const save=async()=>{try{validateRoundTrip(t,.01);assertAnnotationsValid(a,t);await labelingApi("/api/structural-labeling/action",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({candidateId:candidate.id,action:"save-revision",annotations:a,transform:t})});onMessage("Annotation revision saved.");onSaved()}catch(e){onMessage(e instanceof Error?e.message:"Save failed")}};

 return <section style={{width:"100%",background:"#fff"}}>
  <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",padding:"10px 0",position:"sticky",top:0,zIndex:20,background:"#fff"}}>
   <strong>Label:</strong>
   {LABEL_CLASSES.map(x=><button key={x} disabled={!canEdit} aria-pressed={tool==="draw"&&cls===x} onClick={()=>{setCls(x);setTool("draw");setSelected(null)}}>{x}</button>)}
   <label style={{display:"inline-flex",gap:6,alignItems:"center",padding:"4px 7px",border:"1px solid #94a3b8",borderRadius:6}}>
    <input type="checkbox" checked={rotate} disabled={!canEdit} onChange={e=>{const v=e.target.checked;setRotate(v);setStart(null);if(v)setTool("select")}}/>Rotate box
   </label>
   <button disabled={!canEdit} aria-pressed={tool==="select"} onClick={()=>{setTool(tool==="select"?"draw":"select");setStart(null)}}>{tool==="select"?"Exit select":"Select"}</button>
   <button disabled={!canEdit||!selected} onClick={del}>Delete selected</button>
   <label>Box line <input type="range" min={1} max={8} value={line} onChange={e=>setLine(+e.target.value)}/>{line}px</label>
   <label>Label font <input type="range" min={8} max={24} value={font} onChange={e=>setFont(+e.target.value)}/>{font}px</label>
   <button onClick={()=>setZoom(z=>Math.max(10,z-10))}>−</button><input aria-label="Zoom percentage" type="range" min={10} max={150} step={10} value={zoom} onChange={e=>setZoom(+e.target.value)}/><strong>{zoom}%</strong><button onClick={()=>setZoom(z=>Math.min(150,z+10))}>+</button>
   <button disabled={!canEdit||!hist.length} onClick={undo}>Undo</button>{canEdit&&<button onClick={()=>void save()}>Save revision</button>}
  </div>
  <p>{rotate?"Rotation enabled: select a label box and drag its circular rotation handle.":tool==="select"?"Select mode: click a label box, then delete it if needed.":"Draw mode: choose a class and drag a box."} Line width and font size are display-only.</p>
  <div ref={host} style={{width:"100%",height:"72vh",minHeight:520,overflow:"auto",border:"1px solid #94a3b8",background:"#e2e8f0"}}>
   <div onPointerDown={e=>{if(canEdit&&tool==="draw")setStart(point(e));else if(tool==="select"&&e.target===e.currentTarget)setSelected(null)}} onPointerUp={finish} onPointerCancel={()=>setStart(null)} style={{position:"relative",width:dw,height:dh,margin:"0 auto",background:"#fff",touchAction:"none",cursor:tool==="draw"?"crosshair":"default"}}>
    <PrivateSourceCanvas candidateId={candidate.id} pageIndex={candidate.page_index} transform={t} displayWidth={dw} displayHeight={dh} onError={onMessage}/>
    <svg width={dw} height={dh} viewBox={`0 0 ${dw} ${dh}`} onPointerMove={moveRotate} onPointerUp={endRotate} onPointerCancel={endRotate} style={{position:"absolute",inset:0,overflow:"visible",pointerEvents:tool==="select"||rotate?"auto":"none"}}>
     {a.map(x=><RotatedAnnotationOverlay key={x.annotation_id} annotation={x} transform={t} scale={scale} lineWidth={line} fontSize={font} selected={selected===x.annotation_id} interactive={tool==="select"||rotate} rotationEnabled={rotate} onSelect={()=>setSelected(x.annotation_id)} onBeginRotate={e=>beginRotate(e,x.annotation_id)}/>)}
    </svg>
   </div>
  </div>
  <h3>Annotations ({a.length})</h3>
  <div style={{display:"grid",gap:6}}>{a.map((x,i)=><div key={x.annotation_id} style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
   <strong>#{i+1}</strong><select disabled={!canEdit} value={x.class} onChange={e=>commit(a.map((v,j)=>j===i?{...v,class:e.target.value as LabelClass}:v))}>{LABEL_CLASSES.map(v=><option key={v}>{v}</option>)}</select>
   <span>{x.oriented_bbox?`rotation ${normalizeRotationDeg(x.oriented_bbox.rotation_deg).toFixed(1)}°`:"rotation 0°"}</span>
   {canEdit&&<button onClick={()=>commit(a.filter((_,j)=>j!==i))}>Delete label</button>}
  </div>)}</div>
 </section>
}

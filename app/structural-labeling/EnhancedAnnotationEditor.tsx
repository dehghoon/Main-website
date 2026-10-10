"use client";
import {useEffect,useRef,useState} from "react";
import type {PointerEvent as PE} from "react";
import {applyAffine,rasterBBoxToSourcePage,validateRoundTrip} from "../../lib/structural-labeling/coordinates";
import {LABEL_CLASSES,validateBBox,type Annotation,type LabelClass,type PdfPointBBox,type TransformMetadata} from "../../lib/structural-labeling/contract";
import {labelingApi} from "./client";
import PrivateSourceCanvas from "./PrivateSourceCanvas";
type C={id:string;page_index:number|null;workflow_state:string;transform_metadata:unknown};
type R={annotations:Annotation[];transform_metadata:TransformMetadata;revision_no:number;revision_kind:string};
type Tool="draw"|"select";
const COLORS:Record<LabelClass,{s:string;f:string}>={column:{s:"#2563eb",f:"rgba(37,99,235,.12)"},beam:{s:"#d97706",f:"rgba(217,119,6,.12)"},wall:{s:"#dc2626",f:"rgba(220,38,38,.12)"}};
const MSG:Record<string,string>={"bbox-must-have-positive-area":"Annotation box must have positive width and height.","bbox-must-be-within-effective-page-bounds":"Annotation box must stay within the PDF page bounds.","bbox-and-page-values-must-be-finite":"Annotation and page coordinates must be finite numbers."};
const explain=(x:string)=>MSG[x]?`${MSG[x]} (${x})`:x;
const copy=(a:Annotation[])=>a.map(x=>({...x,bbox:{...x.bbox},flags:{...x.flags}}));
function isTransform(v:unknown):v is TransformMetadata{if(!v||typeof v!=="object")return false;const x=v as Partial<TransformMetadata>;return x.coordinate_space==="source-page"&&x.unit==="pdf-point"&&x.transform_validation_state==="validated"&&typeof x.raster_width_px==="number"&&typeof x.raster_height_px==="number"&&typeof x.effective_page_width_pt==="number"&&typeof x.effective_page_height_pt==="number"&&Array.isArray(x.source_page_to_raster_affine)&&Array.isArray(x.raster_to_source_page_affine)}
export default function EnhancedAnnotationEditor({candidate,revisions,canEdit,onSaved,onMessage}:{candidate:C;revisions:R[];canEdit:boolean;onSaved:()=>void;onMessage:(m:string)=>void}){
 const latest=revisions.at(-1),ct=isTransform(candidate.transform_metadata)?candidate.transform_metadata:null,t=latest?.transform_metadata??ct;
 const [a,setA]=useState<Annotation[]>(copy(latest?.annotations??[])),[undo,setUndo]=useState<Annotation[][]>([]),[redo,setRedo]=useState<Annotation[][]>([]),[cls,setCls]=useState<LabelClass>("column"),[tool,setTool]=useState<Tool>("draw"),[selectedId,setSelectedId]=useState<string|null>(null),[boxLineWidth,setBoxLineWidth]=useState(3),[labelFontSize,setLabelFontSize]=useState(12),[zoom,setZoom]=useState(100),[start,setStart]=useState<{x:number;y:number}|null>(null),[w,setW]=useState(0),[full,setFull]=useState(false);
 const root=useRef<HTMLElement>(null),host=useRef<HTMLDivElement>(null);
 useEffect(()=>{setA(copy(latest?.annotations??[]));setUndo([]);setRedo([]);setSelectedId(null);setTool("draw")},[latest?.revision_no,candidate.id]);
 useEffect(()=>{const n=host.current;if(!n)return;const f=()=>setW(n.clientWidth);f();const o=new ResizeObserver(f);o.observe(n);return()=>o.disconnect()},[]);
 useEffect(()=>{const f=()=>setFull(document.fullscreenElement===root.current);document.addEventListener("fulscreenchange",f);return()=>document.removeEventListener("fulscreenchange",f)},[]);
 void write;

 return null;
}

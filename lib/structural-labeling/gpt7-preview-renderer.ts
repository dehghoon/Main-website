import sharp from "sharp";
import { applyAffine } from "./coordinates";
import { orientedBBoxCorners, type Annotation, type LabelClass, type Point2D, type TransformMetadata } from "./contract";

const COLORS: Record<LabelClass,string>={column:"#2563eb",beam:"#d97706",wall:"#dc2626"};
const FONT:Record<string,string[]>={
A:["010","101","111","101","101"],B:["110","101","110","101","110"],C:["011","100","100","100","011"],
E:["111","100","110","100","111"],L:["100","100","100","100","111"],M:["101","111","111","101","101"],
N:["101","111","111","111","101"],O:["010","101","101","101","010"],U:["101","101","101","101","111"],
W:["101","101","111","111","101"]
};
const clamp=(v:number,a:number,b:number)=>Math.min(b,Math.max(a,v));
function corners(a:Annotation):Point2D[]{if(a.oriented_bbox)return[...orientedBBoxCorners(a.oriented_bbox)];const b=a.bbox;return[{x:b.xmin,y:b.ymin},{x:b.xmax,y:b.ymin},{x:b.xmax,y:b.ymax},{x:b.xmin,y:b.ymax}]}
function glyphs(label:string,x:number,y:number,p:number){const out:string[]=[];[...label].forEach((ch,i)=>FONT[ch]?.forEach((row,r)=>[...row].forEach((c,k)=>{if(c==="1")out.push(`<rect x="${x+(i*4+k)*p}" y="${y+r*p}" width="${p}" height="${p}" fill="#fff"/>`)})));return out.join("")}

export async function renderReadableAnnotatedPreviewPng(input:{image:Uint8Array;annotations:Annotation[];transform:TransformMetadata;}):Promise<Uint8Array>{
const meta=await sharp(input.image).metadata(),w=meta.width??input.transform.raster_width_px,h=meta.height??input.transform.raster_height_px;
if(!w||!h)throw new Error("preview_image_dimensions_missing");
const sx=w/input.transform.raster_width_px,sy=h/input.transform.raster_height_px,stroke=clamp(Math.round(Math.min(w,h)/900),2,5),p=clamp(Math.round(Math.min(w,h)/700),3,5),pad=3;
const overlay=input.annotations.map(a=>{const m=corners(a).map(pt=>{const r=applyAffine(input.transform.source_page_to_raster_affine,pt);return{x:r.x*sx,y:r.y*sy}}),color=COLORS[a.class],poly=m.map(q=>`${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" "),label=a.class.toUpperCase(),tw=(label.length*3+(label.length-1))*p,bw=tw+pad*2,bh=5*p+pad*2,minX=Math.min(...m.map(q=>q.x)),minY=Math.min(...m.map(q=>q.y)),bx=clamp(minX+stroke,0,Math.max(0,w-bw)),by=clamp(minY+stroke,0,Math.max(0,h-bh));return `<polygon points="${poly}" fill="none" stroke="${color}" stroke-width="${stroke}"/><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="2" fill="${color}" fill-opacity=".72"/>${glyphs(label,bx+pad,by+pad,p)}`}).join("");
const svg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${overlay}</svg>`);
return new Uint8Array(await sharp(input.image).composite([{input:svg,top:0,left:0}]).png().toBuffer());
}

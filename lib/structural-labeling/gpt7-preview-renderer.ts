import sharp from "sharp";
import { applyAffine } from "./coordinates";
import { orientedBBoxCorners, type Annotation, type LabelClass, type Point2D, type TransformMetadata } from "./contract";

const COLORS: Record<LabelClass, string> = { column:"#2563eb", beam:"#d97706", wall:"#dc2626" };
const clamp=(v:number,a:number,b:number)=>Math.min(b,Math.max(a,v));
const corners=(a:Annotation):Point2D[]=>a.oriented_bbox?[...orientedBBoxCorners(a.oriented_bbox)]:[
{x:a.bbox.xmin,y:a.bbox.ymin},{x:a.bbox.xmax,y:a.bbox.ymin},{x:a.bbox.xmax,y:a.bbox.ymax},{x:a.bbox.xmin,y:a.bbox.ymax}];

export async function renderReadableAnnotatedPreviewPng(input:{image:Uint8Array;annotations:Annotation[];transform:TransformMetadata;}):Promise<Uint8Array>{
 const meta=await sharp(input.image).metadata();
 const width=meta.width??input.transform.raster_width_px;
 const height=meta.height??input.transform.raster_height_px;
 if(!width||!height)throw new Error("preview_image_dimensions_missing");
 const sx=width/input.transform.raster_width_px, sy=height/input.transform.raster_height_px;
 const stroke=clamp(Math.round(Math.min(width,height)/900),2,5);
 const font=clamp(Math.round(Math.min(width,height)/220),12,20);
 const overlay=input.annotations.map(a=>{
  const m=corners(a).map(p=>{const r=applyAffine(input.transform.source_page_to_raster_affine,p);return{x:r.x*sx,y:r.y*sy};});
  const color=COLORS[a.class], label=a.class.toUpperCase();
  const poly=m.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const x=clamp(Math.min(...m.map(p=>p.x))+stroke,0,width-80);
  const y=clamp(Math.min(...m.map(p=>p.y))+stroke,0,height-24);
  const w=clamp(label.length*font*.62+10,38,74), h=font+6;
  return `<polygon points="${poly}" fill="none" stroke="${color}" stroke-width="${stroke}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${color}" fill-opacity=".72"/><text x="${x+5}" y="${y+h/2}" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="${font}" font-weight="700" fill="#fff">${label}</text>`;
 }).join("");
 const svg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${overlay}</svg>`);
 return new Uint8Array(await sharp(input.image).composite([{input:svg,top:0,left:0}]).png().toBuffer());
}

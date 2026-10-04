import { PDFDocument } from "pdf-lib";
import type { TransformMetadata } from "./contract";
import { validateRoundTrip } from "./coordinates";

export type DerivedPageGeometry = { pageIndex: number; pageId: string; transform: TransformMetadata };

function validatedTransform(input: Omit<TransformMetadata, "transform_validation_state">): TransformMetadata {
  const transform: TransformMetadata = { ...input, transform_validation_state: "validated" };
  validateRoundTrip(transform, 0.01);
  return transform;
}

function unvalidatedImageTransform(widthPx: number, heightPx: number, renderVersion: string): TransformMetadata {
  const nan = Number.NaN;
  return {
    coordinate_space: "source-page", unit: "pdf-point",
    effective_page_width_pt: nan, effective_page_height_pt: nan,
    effective_crop_box_pdf: [0, 0, nan, nan], page_rotation_deg: 0,
    raster_width_px: widthPx, raster_height_px: heightPx,
    display_width_px: widthPx, display_height_px: heightPx,
    raster_to_source_page_affine: [nan,0,0,nan,0,0],
    source_page_to_raster_affine: [nan,0,0,nan,0,0],
    display_to_raster_affine: [1,0,0,1,0,0],
    render_version: renderVersion, transform_validation_state: "unvalidated",
  };
}

function pngInfo(bytes: Uint8Array) {
  const signature=[137,80,78,71,13,10,26,10];
  if(bytes.length<24 || !signature.every((v,i)=>bytes[i]===v)) throw new Error("invalid_png");
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const width=view.getUint32(16,false), height=view.getUint32(20,false);
  let offset=8,dpiX:number|undefined,dpiY:number|undefined;
  while(offset+12<=bytes.length){
    const length=view.getUint32(offset,false), type=String.fromCharCode(...bytes.slice(offset+4,offset+8));
    if(type==="pHYs" && length>=9 && offset+17<=bytes.length){
      const x=view.getUint32(offset+8,false), y=view.getUint32(offset+12,false), unit=bytes[offset+16];
      if(unit===1 && x>0 && y>0){ dpiX=x*0.0254; dpiY=y*0.0254; }
    }
    offset+=12+length; if(type==="IEND") break;
  }
  return {width,height,dpiX,dpiY};
}

function jpegInfo(bytes: Uint8Array) {
  if(bytes.length<4 || bytes[0]!==0xff || bytes[1]!==0xd8) throw new Error("invalid_jpeg");
  let offset=2,dpiX:number|undefined,dpiY:number|undefined;
  while(offset+4<=bytes.length){
    if(bytes[offset]!==0xff){offset++;continue;}
    const marker=bytes[offset+1]; offset+=2;
    if(marker===0xd9 || marker===0xda) break;
    const length=(bytes[offset]<<8)|bytes[offset+1];
    if(length<2 || offset+length>bytes.length) throw new Error("invalid_jpeg_segment");
    if(marker===0xe0 && length>=16){
      const id=String.fromCharCode(...bytes.slice(offset+2,offset+7));
      if(id==="JFIF\0"){
        const unit=bytes[offset+9], xd=(bytes[offset+10]<<8)|bytes[offset+11], yd=(bytes[offset+12]<<8)|bytes[offset+13];
        if(xd>0 && yd>0){ if(unit===1){dpiX=xd;dpiY=yd;} if(unit===2){dpiX=xd*2.54;dpiY=yd*2.54;} }
      }
    }
    if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)){
      return {width:(bytes[offset+5]<<8)|bytes[offset+6],height:(bytes[offset+3]<<8)|bytes[offset+4],dpiX,dpiY};
    }
    offset+=length;
  }
  throw new Error("jpeg_dimensions_not_found");
}

function webpInfo(bytes: Uint8Array) {
  if(bytes.length<30 || String.fromCharCode(...bytes.slice(0,4))!=="RIFF" || String.fromCharCode(...bytes.slice(8,12))!=="WEBP") throw new Error("invalid_webp");
  const chunk=String.fromCharCode(...bytes.slice(12,16));
  if(chunk==="VP8X") return {width:1+bytes[24]+(bytes[25]<<8)+(bytes[26]<<16),height:1+bytes[27]+(bytes[28]<<8)+(bytes[29]<<16)};
  if(chunk==="VP8 ") return {width:(bytes[26]|(bytes[27]<<8))&0x3fff,height:(bytes[28]|(bytes[29]<<8))&0x3fff};
  throw new Error("webp_dimensions_not_found");
}

function imageTransform(widthPx:number,heightPx:number,dpiX?:number,dpiY?:number,renderVersion="image-source-v1"):TransformMetadata{
  if(!dpiX||!dpiY||!Number.isFinite(dpiX)||!Number.isFinite(dpiY)||dpiX<=0||dpiY<=0) return unvalidatedImageTransform(widthPx,heightPx,`${renderVersion}-dpi-missing`);
  const widthPt=widthPx*72/dpiX,heightPt=heightPx*72/dpiY,sx=widthPt/widthPx,sy=heightPt/heightPx;
  return validatedTransform({
    coordinate_space:"source-page",unit:"pdf-point",effective_page_width_pt:widthPt,effective_page_height_pt:heightPt,
    effective_crop_box_pdf:[0,0,widthPt,heightPt],page_rotation_deg:0,raster_width_px:widthPx,raster_height_px:heightPx,
    display_width_px:widthPx,display_height_px:heightPx,raster_to_source_page_affine:[sx,0,0,sy,0,0],
    source_page_to_raster_affine:[1/sx,0,0,1/sy,0,0],display_to_raster_affine:[1,0,0,1,0,0],render_version:renderVersion
  });
}

export async function deriveSourcePages(bytes:Uint8Array,mimeType:string,sourceSha256:string):Promise<DerivedPageGeometry[]>{
  if(mimeType==="application/pdf"){
    const document=await PDFDocument.load(bytes,{updateMetadata:false});
    return document.getPages().map((page,pageIndex)=>{
      const crop=page.getCropBox(), raw=((page.getRotation().angle%360)+360)%360;
      if(![0,90,180,270].includes(raw)) throw new Error(`unsupported_pdf_rotation:${raw}`);
      const rotation=raw as 0|90|180|270, w=rotation===90||rotation===270?crop.height:crop.width, h=rotation===90||rotation===270?crop.width:crop.height;
      const rw=Math.max(1,Math.round(w*2)),rh=Math.max(1,Math.round(h*2)),sx=w/rw,sy=h/rh;
      return {pageIndex,pageId:`${sourceSha256}:page:${pageIndex}`,transform:validatedTransform({
        coordinate_space:"source-page",unit:"pdf-point",effective_page_width_pt:w,effective_page_height_pt:h,
        effective_crop_box_pdf:[crop.x,crop.y,crop.x+crop.width,crop.y+crop.height],page_rotation_deg:rotation,
        raster_width_px:rw,raster_height_px:rh,display_width_px:rw,display_height_px:rh,
        raster_to_source_page_affine:[sx,0,0,sy,0,0],source_page_to_raster_affine:[1/sx,0,0,1/sy,0,0],
        display_to_raster_affine:[1,0,0,1,0,0],render_version:"pdf-lib-geometry-v1/pdfjs-render-scale-2"
      })};
    });
  }
  if(mimeType==="image/png"){const i=pngInfo(bytes);return [{pageIndex:0,pageId:`${sourceSha256}:page:0`,transform:imageTransform(i.width,i.height,i.dpiX,i.dpiY,"png-source-v1")}];}
  if(mimeType==="image/jpeg"){const i=jpegInfo(bytes);return [{pageIndex:0,pageId:`${sourceSha256}:page:0`,transform:imageTransform(i.width,i.height,i.dpiX,i.dpiY,"jpeg-source-v1")}];}
  if(mimeType==="image/webp"){const i=webpInfo(bytes);return [{pageIndex:0,pageId:`${sourceSha256}:page:0`,transform:imageTransform(i.width,i.height,undefined,undefined,"webp-source-v1")}];}
  throw new Error("unsupported_media_type");
}

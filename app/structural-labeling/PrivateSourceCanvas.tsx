"use client";
import { useEffect, useRef, useState } from "react";
import type { TransformMetadata } from "../../lib/structural-labeling/contract";
import { labelingAccessToken } from "./client";

let worker: Worker | null = null;

export default function PrivateSourceCanvas(p:{
  candidateId:string; pageIndex:number|null; transform:TransformMetadata;
  displayWidth:number; displayHeight:number; onError:(m:string)=>void;
}) {
  const ref=useRef<HTMLCanvasElement>(null);
  const [error,setError]=useState("");

  useEffect(()=>{
    let cancelled=false;
    void (async()=>{
      try {
        setError("");
        const token=await labelingAccessToken();
        const r=await fetch(`/api/structural-labeling/source/${p.candidateId}`,{
          headers:{Authorization:`Bearer ${token}`}
        });
        if(!r.ok) throw new Error(`Private source load failed (${r.status})`);
        const data=new Uint8Array(await r.arrayBuffer());
        const canvas=ref.current;
        if(!canvas||cancelled)return;

        const pdfjs=await import("pdfjs-dist");
        worker ??= new Worker(
          new URL("pdfjs-dist/build/pdf.worker.min.mjs",import.meta.url),
          {type:"module"}
        );
        pdfjs.GlobalWorkerOptions.workerPort=worker;

        const task=pdfjs.getDocument({data});
        try {
          const pdf=await task.promise;
          const page=await pdf.getPage((p.pageIndex??0)+1);
          const base=page.getViewport({scale:1,rotation:p.transform.page_rotation_deg});
          const w=Math.max(1,Math.round(p.transform.raster_width_px));
          const h=Math.max(1,Math.round(p.transform.raster_height_px));
          const scale=Math.max(w/base.width,h/base.height);
          const viewport=page.getViewport({scale,rotation:p.transform.page_rotation_deg});
          const temp=document.createElement("canvas");
          temp.width=Math.max(1,Math.round(viewport.width));
          temp.height=Math.max(1,Math.round(viewport.height));
          const tctx=temp.getContext("2d");
          const ctx=canvas.getContext("2d");
          if(!tctx||!ctx) throw new Error("Canvas unavailable");
          await page.render({canvasContext:tctx,viewport,canvas:temp}).promise;
          if(cancelled)return;
          ctx.fillStyle="#fff";
          ctx.fillRect(0,0,w,h);
          ctx.drawImage(temp,0,0,w,h);
        } finally {
          await task.destroy();
        }
      } catch(e) {
        if(cancelled)return;
        const m=e instanceof Error?e.message:"Source render failed";
        setError(m); p.onError(m);
      }
    })();
    return()=>{cancelled=true};
  },[p.candidateId,p.pageIndex,p.transform,p.onError]);

  return <>
    <canvas ref={ref}
      width={Math.max(1,Math.round(p.transform.raster_width_px))}
      height={Math.max(1,Math.round(p.transform.raster_height_px))}
      aria-label="Structural drawing page"
      style={{display:"block",width:p.displayWidth,height:p.displayHeight,background:"#fff"}}
    />
    {error&&<div role="alert" style={{
      position:"absolute",inset:0,display:"grid",placeItems:"center",
      padding:16,textAlign:"center",background:"rgba(255,255,255,.94)",pointerEvents:"none"
    }}>Drawing background could not be rendered: {error}</div>}
  </>;
}

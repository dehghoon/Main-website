"use client";
import { useRef, useState, type PointerEvent, type WheelEvent } from "react";
import styles from "./member-viewer.module.css";
type Point = [number, number, number];
type Face = { points: Point[]; color: string; opacity?: number };
type Props = { material: "wood" | "concrete"; width: number; depth: number; length: number; unit: string;
  cover?: number; barDiameter?: number; barCount?: number; stirrupDiameter?: number; stirrupSpacing?: number };
const INITIAL = { yaw: -.55, pitch: -.36, zoom: 1 };
export default function MemberViewer(p: Props) {
  const [view, setView] = useState(INITIAL);
  const [shell, setShell] = useState(true);
  const pointers = useRef(new Map<number, {x:number;y:number}>());
  const valid = [p.width,p.depth,p.length].every(x=>Number.isFinite(x)&&x>0);
  const scale = valid ? 1 / Math.max(p.width,p.depth,p.length) : 1;
  const b=p.width*scale, h=p.depth*scale, l=p.length*scale;
  const rotate = ([x,y,z]:Point):Point => {
    const a=x*Math.cos(view.yaw)+z*Math.sin(view.yaw);
    const c=-x*Math.sin(view.yaw)+z*Math.cos(view.yaw);
    return [a,y*Math.cos(view.pitch)-c*Math.sin(view.pitch),y*Math.sin(view.pitch)+c*Math.cos(view.pitch)];
  };
  const project = (point:Point) => { const [x,y,z]=rotate(point); const k=560*view.zoom/(1+z*.32); return [400+x*k,210-y*k]; };
  const faces:Face[]=[];
  function box(x0:number,x1:number,y0:number,y1:number,z0:number,z1:number) {
    const v:Point[]=[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]];
    const colors=p.material==="wood"?["#a66e36","#bd8648","#d8a365","#8e5a2c","#c38d52","#e1af76"]:["#8998ad","#9ba9bc","#b6c2d1","#7b8ba0","#a9b6c7","#cad3df"];
    [[0,1,2,3],[4,5,6,7],[0,4,7,3],[1,5,6,2],[3,2,6,7],[0,1,5,4]].forEach((ids,i)=>faces.push({points:ids.map(j=>v[j]),color:colors[i],opacity:p.material==="concrete"?.24:1}));
  }
  if (valid && shell) box(-l/2,l/2,-h/2,h/2,-b/2,b/2);
  const reinforcementValid=p.material==="concrete" && [p.cover,p.barDiameter,p.barCount,p.stirrupDiameter,p.stirrupSpacing].every(x=>typeof x==="number"&&Number.isFinite(x)&&x>0)
    && Number.isInteger(p.barCount)&&p.barCount!>=2&&p.barCount!<=20
    && 2*(p.cover!+p.stirrupDiameter!+p.barDiameter!/2)<Math.min(p.width,p.depth)
    && (p.barCount!-1)*p.barDiameter! < p.width-2*(p.cover!+p.stirrupDiameter!+p.barDiameter!/2);
  const cage:Point[][]=[];
  if(valid && reinforcementValid) {
    const cover=p.cover!*scale, stir=p.stirrupDiameter!*scale, radius=p.barDiameter!*scale/2;
    const z=b/2-cover-stir-radius, y=-h/2+cover+stir+radius;
    // Physical straight tension bars in one bottom layer; no top/hanger bars are invented.
    for(let j=0;j<p.barCount!;j++) {
      const center=-z+2*z*j/(p.barCount!-1);
      const rings=[-l/2+cover,l/2-cover].map(x=>Array.from({length:10},(_,i):Point=>[x,y+radius*Math.cos(i*Math.PI/5),center+radius*Math.sin(i*Math.PI/5)]));
      for(let i=0;i<10;i++)faces.push({points:[rings[0][i],rings[0][(i+1)%10],rings[1][(i+1)%10],rings[1][i]],color:i%2?"#245bbb":"#3b79dc"});
    }
    const zc=b/2-cover-stir/2, yc=h/2-cover-stir/2;
    const spacing=p.stirrupSpacing!*scale, start=-l/2+cover+stir/2, end=l/2-cover-stir/2;
    const count=Math.floor((end-start)/spacing)+1;
    if(count<=250)for(let i=0;i<count;i++){const x=start+i*spacing;cage.push([[x,-yc,-zc],[x,yc,-zc],[x,yc,zc],[x,-yc,zc],[x,-yc,-zc]]);}
  }
  const ordered=faces.sort((a,b)=>b.points.reduce((s,x)=>s+rotate(x)[2],0)/b.points.length-a.points.reduce((s,x)=>s+rotate(x)[2],0)/a.points.length);
  function move(e:PointerEvent<SVGSVGElement>) {
    const old=pointers.current.get(e.pointerId); if(!old)return;
    const before=[...pointers.current.values()];pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
    const after=[...pointers.current.values()];
    if(before.length===2&&after.length===2){const distance=(a:typeof before)=>Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);const d=distance(before);if(d>0)setView(v=>({...v,zoom:Math.max(.3,Math.min(4,v.zoom*distance(after)/d))}));}
    else setView(v=>({...v,yaw:v.yaw+(e.clientX-old.x)*.008,pitch:Math.max(-1.5,Math.min(1.5,v.pitch+(e.clientY-old.y)*.008))}));
  }
  function wheel(e:WheelEvent<SVGSVGElement>){e.preventDefault();setView(v=>({...v,zoom:Math.max(.3,Math.min(4,v.zoom*Math.exp(-e.deltaY*.001)))}));}
  return <section className={styles.viewer} aria-label={`${p.material} beam 3D model`}>
    <div className={styles.toolbar}><strong>3D member view</strong><div>
      <button type="button" aria-label="Zoom in" onClick={()=>setView(v=>({...v,zoom:Math.min(4,v.zoom*1.2)}))}>+</button>
      <button type="button" aria-label="Zoom out" onClick={()=>setView(v=>({...v,zoom:Math.max(.3,v.zoom/1.2)}))}>−</button>
      <button type="button" onClick={()=>setView(INITIAL)}>Reset view</button>
      <button type="button" onClick={()=>setView({yaw:-Math.PI/2,pitch:0,zoom:1})}>Section view</button>
      {p.material==="concrete"&&<button type="button" aria-pressed={!shell} onClick={()=>setShell(x=>!x)}>{shell?"Hide concrete":"Show concrete"}</button>}
    </div></div>
    <svg viewBox="0 0 800 420" role="img" tabIndex={0} aria-label="Interactive three dimensional beam. Drag to rotate, pinch or scroll to zoom. Arrow keys rotate; plus and minus zoom; Home resets."
      onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});}}
      onPointerMove={move} onPointerUp={e=>pointers.current.delete(e.pointerId)} onPointerCancel={e=>pointers.current.delete(e.pointerId)} onLostPointerCapture={e=>pointers.current.delete(e.pointerId)} onWheel={wheel}
      onKeyDown={e=>{if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","+","=","-","Home"].includes(e.key)){e.preventDefault();if(e.key==="Home")setView(INITIAL);else setView(v=>({...v,yaw:v.yaw+(e.key==="ArrowLeft"?-.12:e.key==="ArrowRight"?.12:0),pitch:Math.max(-1.5,Math.min(1.5,v.pitch+(e.key==="ArrowUp"?-.12:e.key==="ArrowDown"?.12:0))),zoom:Math.max(.3,Math.min(4,v.zoom*(["+","="].includes(e.key)?1.2:e.key==="-"?1/1.2:1)))}));}}}>
      <title>{p.material==="wood"?"Rectangular timber beam":"Rectangular reinforced concrete beam"}</title>
      <defs><radialGradient id={`ground-${p.material}`}><stop stopColor="#dce5f2"/><stop offset="1" stopColor="#f7faff"/></radialGradient></defs>
      <rect width="800" height="420" fill={`url(#ground-${p.material})`}/>
      {valid? <>
        {ordered.map((f,i)=><polygon key={i} points={f.points.map(x=>project(x).join(",")).join(" ")} fill={f.color} fillOpacity={f.opacity??1} stroke={p.material==="wood"?"#79502f":"#59718e"} strokeOpacity=".3" strokeWidth=".6"/>)}
        {cage.map((points,i)=><polyline key={i} points={points.map(x=>project(x).join(",")).join(" ")} stroke="#2164ca" strokeWidth={Math.max(1.2,p.stirrupDiameter!*scale*560*view.zoom)} fill="none" strokeLinejoin="round"/>)}
      </>:<text x="400" y="210" textAnchor="middle">Enter positive dimensions to display the member.</text>}
    </svg>
    <p>{valid?`${p.width} × ${p.depth} ${p.unit} · length ${p.length} ${p.unit}`:"Dimensions incomplete"} · Drag to rotate · Scroll / pinch to zoom</p>
    {p.material==="concrete"&&<p>{reinforcementValid?`${p.barCount} bottom bars Ø${p.barDiameter} · stirrups Ø${p.stirrupDiameter} at ${p.stirrupSpacing} ${p.unit}. Straight schematic bars; hooks, development, top bars and detailing are not checked.`:"Reinforcement is hidden until a valid one-layer layout fits inside the section."}</p>}
  </section>;
}

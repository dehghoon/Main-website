"use client";
import {useState} from "react";
import {WOOD_RECORDS} from "@/lib/wood-material-catalog";
import styles from "./wood.module.css";
export function MaterialCatalogPreview({country}:{country:"US"|"CA"}){
 const [id,setId]=useState(country==="CA"?"CA-SPF-N12-2025":"US-HF-N-2-NDS2024");
 return <section className={styles.card}><h2>Choose wood species and grade</h2><p>Browse reference properties below. Sign in with approved access to calculate.</p><MaterialPicker country={country} value={id} onChange={setId}/></section>;
}
export default function MaterialPicker({country,value,onChange}:{country:"US"|"CA";value:string;onChange:(id:string)=>void}){
 const records=WOOD_RECORDS.filter(x=>x.country===country),species=[...new Set(records.map(x=>x.species))],selected=records.find(x=>x.id===value);
 const labels:Record<string,string>={Fb_x:"Bending Fb · strong axis",Fb_y:"Bending Fb · weak axis",Fv:"Shear Fv",Fc:"Compression Fc",Ft:"Tension Ft",Fc_perp:"Bearing Fc perpendicular",E:"Elastic modulus E",Emin:"Stability modulus Emin",fb_mpa:"Bending fb",fv_mpa:"Shear fv",fcp_mpa:"Bearing fcp",e_mpa:"Elastic modulus E"};
 return <><div className={styles.grid}><label>Wood species / group<select aria-label="Wood species / group" value={selected?.species??"manual"} onChange={e=>onChange(e.target.value==="manual"?"manual":records.find(x=>x.species===e.target.value)!.id)}>{species.map(x=><option key={x} value={x}>{x}</option>)}<option value="manual">Custom material · engineer supplied</option></select></label>
 <label>Wood grade<select aria-label="Wood grade" value={selected?value:"manual"} disabled={!selected} onChange={e=>onChange(e.target.value)}>{selected?records.filter(x=>x.species===selected.species).map(x=><option key={x.id} value={x.id}>{x.grade}</option>):<option value="manual">Custom documented grade</option>}</select></label></div>
 {selected?<div aria-live="polite"><h3>Automatic reference properties · {country==="CA"?"MPa":"psi"}</h3><div className={styles.propertyGrid}>{Object.entries(selected.properties).map(([key,n])=><div key={key}><span>{labels[key]??key}</span><strong>{n.toLocaleString("en-CA")} {country==="CA"?"MPa":"psi"}</strong></div>)}</div><p><strong>{selected.species} · {selected.grade}</strong><br/>{selected.source}</p><p>Dry, untreated sawn lumber only. The server resolves these catalog values independently. Project adjustment factors and applicability still require review.</p></div>:<p>Enter documented custom properties and their source in the inputs below.</p>}</>;
}

"use client";
import {WOOD_RECORDS} from "@/lib/wood-material-catalog";
export default function MaterialPicker({country,value,onChange}:{country:"US"|"CA";value:string;onChange:(id:string)=>void}){
 const records=WOOD_RECORDS.filter(x=>x.country===country),species=[...new Set(records.map(x=>x.species))];const selected=records.find(x=>x.id===value);
 return <><label>Wood species / group<select value={selected?.species??'manual'} onChange={e=>onChange(e.target.value==='manual'?'manual':records.find(x=>x.species===e.target.value)!.id)}>{species.map(x=><option key={x}>{x}</option>)}<option value="manual">Custom material · engineer supplied</option></select></label>
 {selected&&<label>Grade<select value={value} onChange={e=>onChange(e.target.value)}>{records.filter(x=>x.species===selected.species).map(x=><option key={x.id} value={x.id}>{x.grade}</option>)}</select></label>}
 <p>{selected?'Reference values are filled automatically and resolved again on the server. Catalog covers the listed dry untreated sawn-lumber scope; additional applicable adjustments remain project inputs. Catalog mode is for dry, untreated, normal-temperature lumber. No increased size or repetitive-member resistance is assumed automatically.':'Enter documented custom material properties below.'}</p></>;
}

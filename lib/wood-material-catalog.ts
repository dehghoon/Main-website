/** Factual material records; no calculation-engine equations. Beta engineering review pending. */
export type WoodRecord={id:string;country:"US"|"CA";species:string;grade:string;source:string;properties:Record<string,number>};
const caSource="NLGA Standard Grading Rules 2025, para851, printed p276 (PDF p280), Canadian market; https://nlga.org/wp-content/uploads/2025/11/NLGA-ENG-Grading-Rules-2025-small.pdf";
const usSource="AWC 2024 NDS Supplement addenda, March2025 Hem-Fir(N) / February2024 Red Alder, Table4A; https://awc.org/wp-content/uploads/2025/03/2024-NDSSuppAddendum3.27.25.pdf";
export const WOOD_RECORDS:WoodRecord[]=[
 ...[
  ['DFL-N','Douglas Fir-Larch (North)',1.9,7.0,[[16.5,12500],[10.,11000]]],
  ['HF-N','Hem-Fir (North)',1.6,4.6,[[16.1,11000],[12.,10000]]],
  ['SPF','Spruce-Pine-Fir',1.5,5.3,[[16.5,10500],[11.8,9500]]],
  ['NS','Northern Species',1.3,3.5,[[10.6,7500],[7.6,7000]]],
 ].flatMap(row=>{
  const [code,species,fv,fcp,values]=row as [string,string,number,number,number[][]];
  return values.map(([fb,e],i)=>({id:`CA-${code}-${i===0?'SS':'N12'}-2025`,country:'CA' as const,species,grade:i===0?'Select Structural':'No.1 / No.2',source:caSource,properties:{fb_mpa:fb,fv_mpa:fv,fcp_mpa:fcp,e_mpa:e}}));
 }),
 ...[
  ['HF-N','Hem-Fir (North)',145,405,[[1200,750,1650,1600000,580000],[1200,725,1550,1700000,620000],[1000,500,1400,1500000,550000]]],
  ['RA','Red Alder',140,395,[[1100,650,1050,1400000,510000],[800,475,825,1300000,470000],[775,450,650,1300000,470000]]],
 ].flatMap(row=>{
  const [code,species,fv,fcp,values]=row as [string,string,number,number,number[][]];
  return values.map(([fb,ft,fc,e,emin],i)=>({id:`US-${code}-${i}-NDS2024`,country:'US' as const,species,grade:i===0?'Select Structural':code==='HF-N'?(i===1?'No.1 & Better':'No.1 / No.2'):(i===1?'No.1':'No.2'),source:usSource,properties:{Fb_x:fb,Fb_y:fb,Fv:fv,Fc:fc,Ft:ft,Fc_perp:fcp,E:e,Emin:emin}}));
 })
];
const nlgaUSSource="NLGA Standard Grading Rules 2025, para902, printed p293 (PDF p297), U.S. market, Canadian-grown species; https://nlga.org/wp-content/uploads/2025/11/NLGA-ENG-Grading-Rules-2025-small.pdf";
for(const row of [
 ['DFL-N','Douglas Fir-Larch (North)',180,625,[[1350,825,1900,1900000,690000],[1150,750,1800,1800000,660000],[850,500,1400,1600000,580000]]],
 ['SPF','Spruce-Pine-Fir',135,425,[[1250,700,1400,1500000,550000],[875,450,1150,1400000,510000]]],
] as [string,string,number,number,number[][]][]){
 const [code,species,fv,fcp,values]=row;
 values.forEach(([fb,ft,fc,e,emin],i)=>WOOD_RECORDS.push({id:`US-${code}-${i}-NDS2024`,country:'US',species,grade:i===0?'Select Structural':code==='DFL-N'&&i===1?'No.1 & Better':'No.1 / No.2',source:nlgaUSSource,properties:{Fb_x:fb,Fb_y:fb,Fv:fv,Fc:fc,Ft:ft,Fc_perp:fcp,E:e,Emin:emin}}));
}
export function woodRecord(id:string,country:string){const r=WOOD_RECORDS.find(x=>x.id===id&&x.country===country);if(!r)throw new Error('Unknown material or country mismatch');return r;}
export function applyWoodRecord(input:Record<string,unknown>){
 const {material_record_id,...body}=input;if(!material_record_id||material_record_id==='manual')return {body,record:null};
 if(typeof material_record_id!=='string')throw new Error('Invalid material selection');
 const r=woodRecord(material_record_id,String(body.country));
 if(r.country==='US'){
  const b=Number(body.width_in),d=Number(body.depth_in);
  if(!Number.isFinite(b)||!Number.isFinite(d)||b<1.5||b>3.5||d<b||d>11.25)throw new Error('Catalog US scope: dry untreated dimension lumber, actual thickness1.5–3.5in, edgewise depth between thickness and11.25in; use documented manual input for other sizes');
  const original=body.material as { [key:string]:unknown }|undefined;
  body.material={designation:`${r.species} · ${r.grade}`,category:'sawn_lumber',...Object.fromEntries(Object.entries(r.properties).map(([k,v])=>[k,{reference_psi:v,adjustments:(original?.[k] as {adjustments?:unknown})?.adjustments??{},source:r.source}]))};
 }else{
  body.material_designation=`${r.species} · ${r.grade}`;body.material_source=r.source;Object.assign(body,r.properties);body.grade_category='visual_structural';
 }
 return {body,record:r};
}

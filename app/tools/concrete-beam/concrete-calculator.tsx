"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {getSupabase} from "@/lib/supabase-browser";
import MemberViewer from "@/app/components/member-viewer";
import BeamWorkspace,{BeamReport} from "@/app/components/beam-workspace";
import styles from "../wood-design/wood.module.css";
const INCH=25.4, PSI=.006894757293168, LBF=4.4482216152605;
const caBars={"10M":[11.3,100],"15M":[16,200],"20M":[19.5,300],"25M":[25.2,500],"30M":[29.9,700],"35M":[35.7,1000]};
const usBars={"#3":[.375,.11],"#4":[.5,.20],"#5":[.625,.31],"#6":[.75,.44],"#7":[.875,.60],"#8":[1,.79],"#9":[1.128,1],"#10":[1.27,1.27],"#11":[1.41,1.56]};
type Check={check_id:string;demand:number;capacity:number;unit:string;utilization:number;status:string};
type Result={country:string;standard:string;parameters:Record<string,number>;whole_member_status:string;checked_scope_status:string;flexure:{moment_resistance_knm:number}|null;shear:{shear_resistance_kn:number}|null;checks:Check[];not_checked:string[];deflection?:{total_immediate_mm:number;live_immediate_mm:number}|null};
const fmt=(x:number)=>x.toLocaleString(undefined,{maximumFractionDigits:4});
export default function ConcreteCalculator(){
 const [reportInputs,setReportInputs]=useState<Record<string,unknown>|null>(null);
 const generation=useRef(0);const [allowed,setAllowed]=useState(false);const [accessMessage,setAccessMessage]=useState("Checking your account access…");
 const [token,setToken]=useState<string|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [result,setResult]=useState<Result|null>(null);
 const [country,setCountry]=useState<"CA"|"US">("CA");const [standard,setStandard]=useState("CSA_A23_3_2019");
 const [geometry,setGeometry]=useState({width:300,depth:500,length:6000,cover:40,barDiameter:25.2,barCount:3,stirrupDiameter:11.3,stirrupSpacing:200});
  useEffect(() => {
    const auth = getSupabase();
    if (!auth) { setAccessMessage("Sign in to your Linkoteq account to request access."); return; }
    let revision = 0;
    async function verify(accessToken?: string) {
      const check = ++revision; ++generation.current;
      setBusy(false); setError("");
      setAllowed(false); setToken(null); setResult(null);
      if (!accessToken) { setAccessMessage("Sign in to open this calculator. Approved Beta access is required."); return; }
      try {
        const response = await fetch("/api/entitlements/execution?tool=concrete_beam", {
          headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store", signal: AbortSignal.timeout(12000),
        });
        const body = await response.json();
        if (revision !== check) return;
        if (response.ok && body.active === true && body.tool === "concrete_beam") {
          setToken(accessToken); setAllowed(true);
        } else setAccessMessage("Approved Beta access is required. Employees can sign in through Employee Workspace.");
      } catch { if (revision === check) setAccessMessage("Account access could not be verified. Please try again."); }
    }
    const subscription = auth.auth.onAuthStateChange((_event, session) => { void verify(session?.access_token); });
    const before = revision;
    void auth.auth.getSession().then(({ data }) => { if (revision === before) void verify(data.session?.access_token); });
    return () => { ++revision; ++generation.current; subscription.data.subscription.unsubscribe(); };
  }, []);

 const ca=country==="CA";const bars:Record<string,number[]>=ca?caBars:usBars;
 const inputs=ca?[["width","Width b (mm)",300],["depth","Depth h (mm)",500],["span","Clear span L (mm)",6000],["cover","Cover to outside of stirrup (mm)",40],["count","Bottom bar count, one layer",3],["pitch","Stirrup pitch (mm)",200],["fc","Concrete f′c (MPa)",30],["fy","Longitudinal steel fy (MPa)",400],["fyt","Stirrup yield fyt (MPa)",400],["aggregate","Maximum aggregate size (mm)",20],["uls","Already factored uniform load (kN/m)",20],["dead","Service dead load (kN/m)",8],["live","Service live load (kN/m)",5]] as const:
 [["width","Width b (in)",12],["depth","Depth h (in)",24],["span","Clear span L (in)",240],["cover","Cover to outside of stirrup (in)",1.5],["count","Bottom bar count, one layer",3],["pitch","Stirrup pitch (in)",8],["fc","Concrete f′c (psi)",4000],["fy","Longitudinal steel fy (psi)",60000],["fyt","Stirrup yield fyt (psi)",60000],["aggregate","Maximum aggregate size (in)",.75],["uls","Already factored uniform load (lbf/in)",250],["dead","Service dead load (lbf/in)",1000/12],["live","Service live load (lbf/in)",50]] as const;
 function resetCountry(value:"CA"|"US"){
  ++generation.current;setBusy(false);setResult(null);setError("");setCountry(value);setStandard(value==="CA"?"CSA_A23_3_2019":"ACI_318_2019");
  setGeometry(value==="CA"?{width:300,depth:500,length:6000,cover:40,barDiameter:25.2,barCount:3,stirrupDiameter:11.3,stirrupSpacing:200}:{width:12,depth:24,length:240,cover:1.5,barDiameter:1,barCount:3,stirrupDiameter:.375,stirrupSpacing:8});
 }
 function invalidate(){++generation.current;setBusy(false);setResult(null);setError("");}
 async function run(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(!allowed||!token)return;const rev=generation.current;const f=new FormData(event.currentTarget);const n=(k:string)=>Number(f.get(k));
  const mm=ca?1:INCH,stress=ca?1:PSI,load=ca?1:LBF/INCH;
  setBusy(true);setResult(null);setError("");
  try{
   const response=await fetch("/api/calculators/concrete",{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},signal:AbortSignal.timeout(30000),body:JSON.stringify({country,standard,width_mm:n("width")*mm,depth_mm:n("depth")*mm,span_mm:n("span")*mm,cover_mm:n("cover")*mm,bar_id:f.get("bar"),bar_count:n("count"),stirrup_id:f.get("stirrup"),stirrup_legs:2,stirrup_spacing_mm:n("pitch")*mm,fc_mpa:n("fc")*stress,fy_mpa:n("fy")*stress,fyt_mpa:n("fyt")*stress,aggregate_mm:n("aggregate")*mm,factored_udl_kn_per_m:n("uls")*load,dead_service_udl_kn_per_m:n("dead")*load,live_service_udl_kn_per_m:n("live")*load,zero_axial_torsion_and_nonseismic:f.get("confirmed")==="on",acknowledged_beta:f.get("confirmed")==="on"})});
   const body=await response.json();if(rev!==generation.current)return;
   if(!response.ok){if(response.status===401||response.status===403){setAllowed(false);setToken(null);}throw new Error(typeof body.detail==="string"?body.detail:Array.isArray(body.detail)?body.detail.map((x:{msg?:string})=>x.msg).join("; "):body.error||"The calculation could not be completed.");}
   setReportInputs({country,standard,input_units:ca?"mm / MPa / kN/m":"in / psi / lbf/in",...Object.fromEntries(f.entries())});setResult(body);
  }catch(e){if(rev===generation.current)setError(e instanceof Error?e.message:"Calculation unavailable.");}finally{if(rev===generation.current)setBusy(false);}
 }
 if(!allowed)return <section className={styles.card}><p>{accessMessage}</p><a className="primaryButton" href="/customer-login?tool=concrete_beam">Sign in / request access</a>{" "}<a href="/blog/login">Employee sign in</a></section>;
 return <BeamWorkspace model={<MemberViewer material="concrete" {...geometry} unit={ca?"mm":"in"}/>} input={<>  <section className={styles.card}><div className={styles.grid}>
   <label>Country<select value={country} onChange={e=>resetCountry(e.target.value as "CA"|"US")}><option value="CA">Canada · SI inputs</option><option value="US">United States · US inputs</option></select></label>
   <label>Design standard<select value={standard} onChange={e=>{invalidate();setStandard(e.target.value);}}>{ca?<><option value="CSA_A23_3_2019">CSA A23.3:2019 · flexure / shear pilot</option><option value="CSA_A23_3_2024">CSA A23.3:2024 · shear pilot</option></>:<option value="ACI_318_2019">ACI 318-19 · in-lb edition</option>}</select></label>
  </div><p>Parameters are determined on the server from the selected profile. Engineering review remains incomplete. Country changes reset geometry, catalog and units.</p>
  {standard==="CSA_A23_3_2024"&&<p><strong>2024 flexure remains unavailable:</strong> its compression-block depth and ductility source review is incomplete. The selected route computes simplified shear only; no 2019 flexural result is substituted.</p>}</section>
  <form key={country} className={styles.card} onSubmit={run} onChange={e=>{invalidate();const f=new FormData(e.currentTarget);const n=(k:string)=>Number(f.get(k));setGeometry({width:n("width"),depth:n("depth"),length:n("span"),cover:n("cover"),barDiameter:bars[String(f.get("bar"))]?.[0]??0,barCount:n("count"),stirrupDiameter:bars[String(f.get("stirrup"))]?.[0]??0,stirrupSpacing:n("pitch")});}}>
   <h2>Simply supported rectangular beam · uniform gravity load</h2>
   <p>One bottom layer and two vertical stirrup legs. Normal-density, non-prestressed concrete; no axial force, torsion, moment reversal or seismic-frame design. Enter the already factored design load and separate unfactored service loads.</p>
   <div className={styles.grid}>{inputs.map(([key,label,value])=><label key={key}>{label}<input name={key} type="number" defaultValue={value} min={["uls","dead","live","cover"].includes(key)?0:key==="count"?2:.000001} max={key==="count"?20:undefined} step={key==="count"?1:"any"} required/></label>)}
    <label>Bottom reinforcement<select name="bar" defaultValue={ca?"25M":"#8"}>{Object.keys(bars).map(x=><option key={x}>{x}</option>)}</select></label>
    <label>Two-leg stirrups<select name="stirrup" defaultValue={ca?"10M":"#3"}>{(ca?["10M","15M"]:["#3","#4","#5"]).map(x=><option key={x}>{x}</option>)}</select></label>
   </div>
   <label className={styles.confirm}><input name="confirmed" type="checkbox" required/>I confirmed the stated scope, load units and material values. This Beta reports component checks and does not approve a complete beam design.</label>
   <button className="primaryButton" disabled={busy}>{busy?"Calculating…":"Run component checks"}</button>
  </form>
  <section className={styles.card}><h2>Numerical verification references</h2><p>USA calculations are compared with the <a href="https://calcnote.foundrycorelabs.com/methodology/beam-design-example">published ACI 318-19 worked beam example</a>. Canadian section equilibrium is compared with <a href="https://jabacus.com/engineering/concrete2019/concrete_mr.php">Jabacus 2019</a>; simplified 2024 shear is compared with the <a href="https://blog.struct.work/stirrup-spacing-and-the-beta-factor-beam-shear-design-to-csa-a23-3/">Struct.work shear example</a>. These comparisons cover the stated numerical components, not complete code compliance.</p></section>
</>} results={<>  {error&&<p role="alert" className={styles.card}>{error}</p>}
  {result&&<section className={styles.card}><h2>{result.standard.replaceAll("_"," ")} · checked scope: {result.checked_scope_status}</h2><p><strong>Whole member: not checked.</strong> Capacities and ratios below are normalized to SI units.</p>
   <div className={styles.table}><table><thead><tr><th>Check</th><th>Demand</th><th>Capacity / limit</th><th>Use</th><th>Status</th></tr></thead><tbody>{result.checks.map(x=><tr key={x.check_id}><td>{x.check_id.replaceAll("_"," ")}</td><td>{fmt(x.demand)} {x.unit}</td><td>{fmt(x.capacity)} {x.unit}</td><td>{fmt(x.utilization*100)}%</td><td>{x.status}</td></tr>)}</tbody></table></div>
   <details><summary>Automatically determined parameters</summary><dl>{Object.entries(result.parameters).map(([key,value])=><div key={key}><dt>{key.replaceAll("_"," ")}</dt><dd>{fmt(value)}</dd></div>)}</dl></details>
   {result.deflection&&<p>Immediate live / total bending deflection: {fmt(result.deflection.live_immediate_mm)} / {fmt(result.deflection.total_immediate_mm)} mm. Creep and project-specific deflection limits are not checked.</p>}
   <details><summary>Checks still outside this pilot</summary><ul>{result.not_checked.map(x=><li key={x}>{x.replaceAll("_"," ")}</li>)}</ul></details>
  </section>}
{!result&&!error&&<section className={styles.card}><h2>Results</h2><p>Run component checks to view demands, capacities and utilization.</p></section>}</>} report={<BeamReport title="Concrete beam" result={result} inputs={reportInputs}/>}/>;
}

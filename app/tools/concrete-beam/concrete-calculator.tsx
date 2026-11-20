"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {getSupabase} from "@/lib/supabase-browser";
import MemberViewer from "@/app/components/member-viewer";
import styles from "../wood-design/wood.module.css";
const geometryFields=[["width","Width b (mm)","300"],["depth","Overall depth h (mm)","500"],["length","Display length (mm)","4000"],
 ["cover","Clear cover to outside of stirrup (mm)","30"],["barDiameter","Bottom bar diameter (mm)","25.2"],
 ["barCount","Bottom bar count, one layer","2"],["stirrupDiameter","Stirrup diameter (mm)","10"],["stirrupSpacing","Stirrup spacing (mm)","200"]] as const;
const factors=[["alpha1","Stress block α1","0.8125"],["beta1","Stress block β1","0.9075"],["phi_c","Concrete factor φc","0.65"],
 ["phi_s","Steel factor φs","0.85"],["epsilon_cu","Concrete ultimate strain","0.0035"],["es_mpa","Steel modulus Es (MPa)","200000"]] as const;
type Result={shear?:{vc_kn:number;vs_kn:number;shear_ceiling_kn:number;shear_resistance_kn:number};requested_edition:string;moment_resistance_knm:number;a_mm:number;c_mm:number;steel_strain:number;not_checked:string[]};
export default function ConcreteCalculator(){
 const generation=useRef(0);
 const [allowed,setAllowed]=useState(false);const [accessMessage,setAccessMessage]=useState("Checking your account access…");
 const [token,setToken]=useState<string|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 const [result,setResult]=useState<Result|null>(null);const [edition,setEdition]=useState("2019");
 const [geometry,setGeometry]=useState({width:300,depth:500,length:4000,cover:30,barDiameter:25.2,barCount:2,stirrupDiameter:10,stirrupSpacing:200});
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

 async function run(event:FormEvent<HTMLFormElement>){
   event.preventDefault();if(!allowed||!token)return;const rev=generation.current;const d=new FormData(event.currentTarget);
   const n=(k:string)=>Number(d.get(k));setBusy(true);setError("");setResult(null);
   try{
     const response=await fetch("/api/calculators/concrete",{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
       body:JSON.stringify({edition,b_mm:n("width"),h_mm:n("depth"),d_mm:n("depth")-n("cover")-n("stirrupDiameter")-n("barDiameter")/2,
         as_mm2:n("barCount")*Math.PI*n("barDiameter")**2/4,fc_mpa:n("fc_mpa"),fy_mpa:n("fy_mpa"),
         ...Object.fromEntries(factors.map(([k])=>[k,n(k)])),
         shear:{dv_mm:n("dv_mm"),av_mm2:2*Math.PI*n("stirrupDiameter")**2/4,spacing_mm:n("stirrupSpacing"),fyt_mpa:n("fyt_mpa"),beta:n("shear_beta"),theta_deg:n("theta_deg"),density_factor:1},parameter_source:String(d.get("source")),acknowledged_research_only:d.get("confirmed")==="on"})});
     const body=await response.json();if(rev!==generation.current)return;
     if(!response.ok){if(response.status===401||response.status===403){setAllowed(false);setToken(null);}throw new Error(typeof body.detail==="string"?body.detail:body.error||"Calculation unavailable. Check the input geometry and parameter values.");}
     setResult(body);
   }catch(e){if(rev===generation.current)setError(e instanceof Error?e.message:"Calculation unavailable.");}
   finally{if(rev===generation.current)setBusy(false);}
 }
 if(!allowed)return <section className={styles.card}><p>{accessMessage}</p><a className="primaryButton" href="/customer-login?tool=concrete_beam">Sign in / request access</a>{" "}<a href="/blog/login">Employee sign in</a></section>;
 return <>
  <MemberViewer material="concrete" {...geometry} unit="mm"/>
  <form className={styles.card} onSubmit={run} onChange={event=>{++generation.current;setBusy(false);setError("");setResult(null);const d=new FormData(event.currentTarget);setGeometry(Object.fromEntries(geometryFields.map(([k])=>[k,Number(d.get(k))])) as typeof geometry);}}>
    <h2>Rectangular section · flexural equilibrium pilot</h2>
    <p>Experimental section arithmetic with explicitly supplied parameters. Complete CSA beam design is not enabled. Shear method applicability, minimum and maximum reinforcement, cover, spacing, anchorage, serviceability and seismic detailing are not checked.</p>
    <label>Requested CSA edition<select name="edition" value={edition} onChange={e=>{setEdition(e.target.value);setResult(null);}}><option>2019</option><option>2024</option></select></label>
    <p>{edition==="2019"?"Initial parameters reproduce the 2019 reference example at fc = 25 MPa. Re-enter all parameters for your material and source; they do not update automatically with strength.":"2024 parameters require your own edition-specific source. Fields are cleared when switching editions; no 2019 parameters are carried into 2024."}</p>
    <div className={styles.grid}>{geometryFields.map(([k,label,value])=><label key={k}>{label}<input name={k} type="number" defaultValue={value} min={k==="barCount"?2:.000001} max={k==="barCount"?20:undefined} step={k==="barCount"?1:"any"} required/></label>)}
      <label>Concrete strength f′c (MPa)<input name="fc_mpa" type="number" min="20" max="80" step="any" defaultValue="25" required/></label>
      <label>Steel yield fy (MPa)<input name="fy_mpa" type="number" min="300" max="500" step="any" defaultValue="400" required/></label>
    </div>
    <h3>Explicit section parameters</h3>
    <div className={styles.grid} key={edition}>{factors.map(([k,label,value])=><label key={k}>{label}<input name={k} type="number" defaultValue={edition==="2019"?value:""} min="0.000001" max={k==="es_mpa"?300000:k==="epsilon_cu"?.01:1} step="any" required/></label>)}</div>
    <h3>Explicit shear parameters · two vertical stirrup legs</h3>
    <p>These are section equations only. Enter documented β, θ and effective shear depth. Minimum stirrups, spacing limits, diagonal-crack anchorage and method applicability are not checked. Normal-density concrete λ = 1.</p>
    <div className={styles.grid} key={`shear-${edition}`}>
      <label>Shear depth dv (mm)<input name="dv_mm" type="number" min="0.000001" step="any" required defaultValue={edition==="2019"?"402.66":""}/></label>
      <label>Stirrup yield fyt (MPa)<input name="fyt_mpa" type="number" min="1" max="500" step="any" required defaultValue="400"/></label>
      <label>Shear β<input name="shear_beta" type="number" min="0.000001" max="1" step="any" required defaultValue=""/></label>
      <label>Crack angle θ (degrees)<input name="theta_deg" type="number" min="0.000001" max="89.999999" step="any" required defaultValue=""/></label>
    </div>
    <label>Source for the entered parameters<input name="source" minLength={10} maxLength={1000} defaultValue="" placeholder="Document, edition and clause / page" required/></label>
    <label className={styles.confirm}><input name="confirmed" type="checkbox" required/>I checked the parameter source and applicability. This is a singly reinforced, rectangular, normal-weight section with yielding tension steel and no axial force, torsion or biaxial bending. The result is research arithmetic and does not approve a beam design.</label>
    <button className="primaryButton" disabled={busy}>{busy?"Calculating…":"Calculate section equilibrium"}</button>
  </form>
  {error&&<p role="alert" className={styles.card}>{error}</p>}
  {result&&<section className={styles.card}><h2>Section equilibrium result · unverified profile</h2><p>Requested edition: {result.requested_edition}. Whole member: not checked.</p>
    <dl><dt>Moment resistance from supplied parameters</dt><dd>{result.moment_resistance_knm.toFixed(3)} kN·m</dd><dt>Compression block a / neutral axis c</dt><dd>{result.a_mm.toFixed(2)} / {result.c_mm.toFixed(2)} mm</dd><dt>Tension steel strain</dt><dd>{result.steel_strain.toFixed(6)}</dd></dl>
    {result.shear&&<dl><dt>Concrete shear contribution Vc</dt><dd>{result.shear.vc_kn.toFixed(3)} kN</dd><dt>Stirrup contribution Vs</dt><dd>{result.shear.vs_kn.toFixed(3)} kN</dd><dt>Shear resistance / crushing ceiling</dt><dd>{result.shear.shear_resistance_kn.toFixed(3)} / {result.shear.shear_ceiling_kn.toFixed(3)} kN</dd></dl>}
    <p>This is not a complete CSA resistance check and does not return a design PASS.</p></section>}
  <section className={styles.card}><h2>Numerical reference checks</h2><p><a href="https://blog.struct.work/stirrup-spacing-and-the-beta-factor-beam-shear-design-to-csa-a23-3/" target="_blank" rel="noreferrer">Struct.work 2024 worked shear example</a>: bw = 500 mm, dv = 662 mm, f′c = 30 MPa, Av = 200 mm², fyt = 400 MPa, β = 0.18, θ = 35°. Published Vc ≈ 212 kN, Vr ≈ 355 kN at 450 mm spacing and 469 kN at 250 mm spacing. These compare section equations only.</p><p><a href="https://jabacus.com/engineering/concrete2019/concrete_mr.php" target="_blank" rel="noreferrer">Jabacus 2019 default example</a>: b = 300 mm, d = 400 mm, As = 200 mm², f′c = 25 MPa, fy = 400 MPa → Mr = 26.62 kN·m. This checks one flexural arithmetic case; the source omits the overall depth.</p>
    <p><a href="https://skyciv.com/docs/skyciv-rc-design/code-verification/csa-a23-verification/" target="_blank" rel="noreferrer">SkyCiv example 3.4</a>: CSA 2014 reference, Mr = 142.04 kN·m. This is an additional equilibrium benchmark, not verification of the 2019 or 2024 edition.</p></section>
 </>;
}

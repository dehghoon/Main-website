"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { getSupabase } from "@/lib/supabase-browser";
import styles from "./wood.module.css";
import MemberViewer from "@/app/components/member-viewer";

const fields = [
  ["span", "Span (in)", "144"], ["b", "Actual width (in)", "3.5"], ["d", "Actual depth (in)", "11.25"],
  ["le", "Effective unbraced beam length (in)", "144"], ["bearing", "End bearing length (in)", "3"],
  ["w", "Design combination UDL (lbf/in)", "10"], ["total", "Total service UDL (lbf/in)", "8"],
  ["live", "Live service UDL (lbf/in)", "5"], ["limitTotal", "Total deflection limit: L /", "240"],
  ["limitLive", "Live deflection limit: L /", "360"],
] as const;
const properties = [
  ["Fb_x", "Strong-axis bending Fb (psi)", "1200"], ["Fb_y", "Weak-axis bending Fb (psi)", "1200"],
  ["Fv", "Shear Fv (psi)", "150"], ["Fc", "Compression parallel Fc (psi)", "1000"],
  ["Ft", "Tension Ft (psi)", "700"], ["Fc_perp", "Bearing perpendicular Fc⊥ (psi)", "500"],
  ["E", "Modulus E (psi)", "1200000"], ["Emin", "Stability modulus Emin (psi)", "400000"],
] as const;
type Check = { check_id: string; status: string; demand?: number; capacity?: number; utilization?: number; unit?: string; reason?: string };
type Result = { checked_scope_status: string; whole_member_status: string; checks: Check[]; limitations: string[] };
const format = (value?: number) => typeof value === "number" ? value.toLocaleString(undefined, { maximumFractionDigits: 4 }) : "—";
export default function WoodCalculator() {
  const generation = useRef(0);
  const [geometry, setGeometry] = useState({width:3.5, depth:11.25, length:144});
  const [allowed, setAllowed] = useState(false);
  const [accessMessage, setAccessMessage] = useState("Checking your account access…");
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
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
        const response = await fetch("/api/entitlements/execution?tool=wood_design", {
          headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store", signal: AbortSignal.timeout(12000),
        });
        const body = await response.json();
        if (revision !== check) return;
        if (response.ok && body.active === true && body.tool === "wood_design") {
          setToken(accessToken); setAllowed(true);
        } else setAccessMessage("Approved Beta access is required. Employees can sign in through Employee Workspace.");
      } catch { if (revision === check) setAccessMessage("Account access could not be verified. Please try again."); }
    }
    const subscription = auth.auth.onAuthStateChange((_event, session) => { void verify(session?.access_token); });
    const before = revision;
    void auth.auth.getSession().then(({ data }) => { if (revision === before) void verify(data.session?.access_token); });
    return () => { ++revision; ++generation.current; subscription.data.subscription.unsubscribe(); };
  }, []);
  async function run(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!token || !allowed) return;
    const sessionGeneration = generation.current;
    const data = new FormData(event.currentTarget);
    setBusy(true); setError(""); setResult(null);
    try {
      const n = (name: string) => Number(data.get(name));
      const adjustments = JSON.parse(String(data.get("adjustments") || "{}")) as Record<string, Record<string, number>>;
      if (!adjustments || typeof adjustments !== "object" || Array.isArray(adjustments)) throw new Error("Enter adjustment factors as an object keyed by material property.");
      for (const key of Object.keys(adjustments)) if (!properties.some(([name]) => name === key)) throw new Error(`Unknown adjustment property: ${key}`);
      const material = { designation: String(data.get("designation")), category: "sawn_lumber",
        ...Object.fromEntries(properties.map(([key]) => [key, { reference_psi: n(key), adjustments: adjustments[key] ?? {}, source: String(data.get("source")) }])) };
      const response = await fetch("/api/calculators/wood", {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ method: data.get("method"), duration: data.get("duration"),
          span_in: n("span"), width_in: n("b"), depth_in: n("d"), beam_effective_length_in: n("le"),
          combination_udl_lbf_per_in: n("w"), total_sls_udl_lbf_per_in: n("total"), live_sls_udl_lbf_per_in: n("live"),
          compression_edge_continuously_braced: data.get("braced") === "on",
          bearing_length_in: n("bearing"), total_limit_divisor: n("limitTotal"), live_limit_divisor: n("limitLive"),
          material, engineer_confirmed_inputs_and_factors: data.get("confirmed") === "on" }),
      });
      const body = await response.json();
      if (sessionGeneration !== generation.current) return;
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) { setAllowed(false); setToken(null); }
        const detail = body.detail;
        throw new Error(typeof detail === "string" ? detail : Array.isArray(detail) ? detail.map((x: { msg?: string }) => x.msg).join("; ") : "The calculation could not be completed. Check your inputs and account access.");
      }
      setResult(body as Result);
    } catch (problem) { if (sessionGeneration === generation.current) setError(problem instanceof Error ? problem.message : "Calculation unavailable."); }
    finally { if (sessionGeneration === generation.current) setBusy(false); }
  }
  if (!allowed) return <section className={styles.card}><p>{accessMessage}</p>
    <a className="primaryButton" href="/customer-login?tool=wood_design">Sign in / request Beta access</a>{" "}
    <a href="/blog/login">Employee sign in</a></section>;
  return <>
    <MemberViewer material="wood" {...geometry} unit="in" />
    <form className={styles.card} onSubmit={run} onChange={event=>{++generation.current;setBusy(false);setError("");setResult(null); const form=event.currentTarget; setGeometry({width:Number((form.elements.namedItem("b") as HTMLInputElement).value),depth:Number((form.elements.namedItem("d") as HTMLInputElement).value),length:Number((form.elements.namedItem("span") as HTMLInputElement).value)});}}>
      <h2>Simply supported beam · uniform downward load</h2>
      <p>Example values are shown. Replace them with your actual dimensions and documented material values. Include self-weight in the supplied loads. The design load must already represent your ASD combination or factored LRFD combination.</p>
      <div className={styles.grid}>
        <label>Design method<select name="method" defaultValue="ASD"><option>ASD</option><option>LRFD</option></select></label>
        <label>Load duration<select name="duration" defaultValue="normal">{["permanent", "normal", "2-month", "7-day", "10-min", "impact"].map(x => <option key={x}>{x}</option>)}</select></label>
        {fields.map(([key, label, value]) => <label key={key}>{label}<input name={key} type="number" min={key === "w" || key === "total" || key === "live" ? "0" : "0.000001"} step="any" defaultValue={value} required /></label>)}
      </div>
      <label className={styles.confirm}><input name="braced" type="checkbox" /> Compression edge is continuously laterally braced against displacement and the supports prevent rotation (CL = 1).</label>
      <h3>Engineer supplied material properties</h3>
      <div className={styles.grid}><label>Species / grade / designation<input name="designation" placeholder="Enter the actual grade and designation" required /></label>
        <label>Source for material values and adjustment factors<input name="source" placeholder="Document, edition, table / page" minLength={3} required /></label>
        {properties.map(([key, label, value]) => <label key={key}>{label}<input name={key} type="number" min="0.000001" step="any" defaultValue={value} required /></label>)}
      </div>
      <details><summary>Other adjustment factors by property</summary>
        <p>Enter the applicable documented factors. An empty object means no additional adjustment. For example, {`{"Fb_x":{"CM":0.85}}`}. Load duration, LRFD conversion, and beam stability are calculated separately.</p>
        <textarea name="adjustments" aria-label="Adjustment factors by property" defaultValue="{}" rows={4} />
      </details>
      <label className={styles.confirm}><input name="confirmed" type="checkbox" required /> I confirmed the entered values, factor applicability and effective length. I understand this Beta is incomplete and for evaluation only. This is a prismatic, unnotched single sawn member; connections and minor-axis restraint are checked separately. I will not treat component results as complete member approval.</label>
      <button className="primaryButton" disabled={busy}>{busy ? "Calculating…" : "Run component checks"}</button>
    </form>
    <section className={styles.card}><h2>Verification references</h2><p>Published NDS 2018 examples from <a href="https://calcs.com/docs/calculators/us/beams/timberBeamLRFDNDS-2024" target="_blank" rel="noreferrer">Calcs.com / Breyer examples 6-18 and 6-19</a> are used to compare section resistance arithmetic. The source explicitly identifies the examples as 2018; they do not certify the full 2024 design route. Material values and adjustment applicability remain engineer supplied. Instantaneous bending deflection excludes creep and shear deformation.</p></section>
    {error && <p role="alert" className={styles.card}>{error}</p>}
    {result && <section className={styles.card}><h2>Component checks: {result.checked_scope_status}</h2>
      <p><strong>Whole member: not checked.</strong> These results do not provide engineering approval.</p>
      <div className={styles.table}><table><thead><tr><th>Check</th><th>Demand</th><th>Capacity / limit</th><th>Use</th><th>Status</th></tr></thead>
        <tbody>{result.checks.map((x, i) => <tr key={i}><td>{x.check_id.replaceAll("_", " ")}</td><td>{format(x.demand)} {x.unit}</td><td>{format(x.capacity)} {x.unit}</td><td>{typeof x.utilization === "number" ? `${format(x.utilization * 100)}%` : "—"}</td><td>{x.status}{x.reason ? ` · ${x.reason}` : ""}</td></tr>)}</tbody></table></div>
      <p>Scope: NDS 2024, one rectangular sawn member, full-span uniform loading. Connections, fire, durability, shear deflection, creep, notches, built-up members, engineered wood products and CSA O86 are excluded.</p>
    </section>}
  </>;
}

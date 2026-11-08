"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
type Survey = { id:string; created_at:string; full_name:string|null; company_name:string|null; email:string|null; phone:string|null; response:unknown };
type Result = {responses:Survey[];total:number;page:number};
const sections = ["Customer Discovery","Employees","Beta Access","Starter & Pro","Pro Rewards"] as const;
export default function AccessManager() {
 const [section,setSection]=useState<(typeof sections)[number]>("Customer Discovery");
 const [state,setState]=useState<"loading"|"denied"|"allowed"|"error">("loading");
 const [token,setToken]=useState("");
 const [data,setData]=useState<Result|null>(null);
 const [page,setPage]=useState(0);
 const [error,setError]=useState("");
 useEffect(()=>{let live=true;async function check(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key){if(live)setState("error");return;}
  const auth=createClient(url,key);const {data:{session}}=await auth.auth.getSession();
  if(!session){if(live)setState("denied");return;}
  // The server validates the JWT and verified admin identity; never authorize using a client-side email check.
  const response=await fetch("/api/admin/customer-discovery?page=0",{headers:{Authorization:"Bearer "+session.access_token},cache:"no-store"});
  if(!live)return;
  if(response.status===401||response.status===403){setState("denied");return;}
  if(!response.ok){setState("error");return;}
  setToken(session.access_token);setData(await response.json());setState("allowed");
 }void check();return()=>{live=false}},[]);
 useEffect(()=>{if(state!=="allowed"||!token||section!=="Customer Discovery")return;let live=true;
  async function load(){const response=await fetch("/api/admin/customer-discovery?page="+page,{headers:{Authorization:"Bearer "+token},cache:"no-store"});
  if(!live)return;if(!response.ok){setError("Unable to load survey responses.");return;}setData(await response.json());setError("");}
  void load();return()=>{live=false};
 },[state,token,page,section]);
 return <main className="authShell" style={{padding:"32px 16px"}}><section className="authCard" style={{maxWidth:1080,width:"100%"}}>
 <a href="/">← LinkoTech</a><span className="eyebrow">Administration</span><h1>Access Manager</h1>
 {state==="loading"&&<p role="status">Checking administrator access…</p>}
 {state==="denied"&&<p role="alert">You don't have access to this page. <a href="/customer-login">Sign in</a></p>}
 {state==="error"&&<p role="alert">Unable to verify access. Please try again later.</p>}
 {state==="allowed"&&<><nav aria-label="Access Manager sections" style={{display:"flex",flexWrap:"wrap",gap:10,margin:"20px 0"}}>
 {sections.map(s=><button key={s} type="button" aria-pressed={section===s} onClick={()=>setSection(s)}>{s}</button>)}</nav>
 {section==="Customer Discovery"?<section><h2>Customer Discovery responses</h2>{error&&<p role="alert">{error}</p>}
 <p>{data?.total??0} submissions</p>{data?.responses.map(item=><article key={item.id} style={{border:"1px solid #ccd8e0",borderRadius:12,padding:16,margin:"12px 0",overflowWrap:"anywhere"}}>
 <h3>{item.full_name||"Unnamed respondent"}</h3><p>{item.company_name||"No company"} · {new Date(item.created_at).toLocaleString()}</p>
 <p>Email: {item.email||"—"} · Phone: {item.phone||"—"}</p><details><summary>View answers</summary><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{JSON.stringify(item.response,null,2)}</pre></details></article>)}
 <div style={{display:"flex",gap:12}}><button disabled={page===0} onClick={()=>setPage(p=>p-1)}>Previous</button><button disabled={!data||(page+1)*25>=data.total} onClick={()=>setPage(p=>p+1)}>Next</button></div>
 </section>:<section><h2>{section}</h2><p>This management function is not yet enabled. No permissions, subscriptions, or rewards can be changed from this screen until secure server-side approval workflows are implemented and tested.</p>
 {section==="Pro Rewards"&&<p>Verified rewards must remain reserved until the official Pro launch. Do not start the two-month period early.</p>}</section>}</>}
 </section></main>;
}

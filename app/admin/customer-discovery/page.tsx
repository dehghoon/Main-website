"use client";
import { useEffect, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type SurveyResponse = { id:string; created_at:string; full_name:string|null; company_name:string|null; email:string|null; phone:string|null; preferred_contact_method:string|null; response:unknown };
type Result = { responses:SurveyResponse[]; total:number; page:number };
let client:SupabaseClient|null = null;
function getClient() {
  if (client) return client;
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client=createClient(url,key);
  return client;
}
export default function CustomerDiscoveryAdmin() {
  const [result,setResult]=useState<Result|null>(null);
  const [page,setPage]=useState(0);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    let active=true;
    async function load() {
      setLoading(true);setError("");
      const supabase=getClient();
      if (!supabase) { if(active){setError("Authentication is not configured.");setLoading(false);} return; }
      const {data:{session}}=await supabase.auth.getSession();
      if (!session) { if(active){setError("Sign in through Client Workspace first.");setLoading(false);} return; }
      try {
        const response=await fetch("/api/admin/customer-discovery?page="+page,{headers:{Authorization:"Bearer "+session.access_token},cache:"no-store"});
        if(!response.ok) throw new Error(response.status===403?"Access denied. Only the verified administrator can view responses.":response.status===503?"Survey integration is not configured.":"Unable to load responses ("+response.status+").");
        const json=await response.json() as Result;
        if(active)setResult(json);
      } catch(e) {if(active){setResult(null);setError(e instanceof Error?e.message:"Unable to load responses.");}}
      finally {if(active)setLoading(false);}
    }
    void load();
    return ()=>{active=false;};
  },[page]);
  return <main style={{maxWidth:1000,margin:"48px auto",padding:24}}>
    <h1>Customer Discovery — Private Admin</h1>
    <p><a href="/customer-login">Client Workspace</a></p>
    {loading&&<p role="status">Loading responses…</p>}
    {error&&<p role="alert">{error}</p>}
    {result&&!loading&&<><p>{result.total} submissions · Page {page+1}</p>
      {result.responses.map(item=><article key={item.id} style={{border:"1px solid #b6c3cd",borderRadius:10,padding:20,marginBottom:16,overflowWrap:"anywhere"}}>
        <h2>{item.full_name||"Unnamed respondent"}</h2>
        <p>{new Date(item.created_at).toLocaleString()} · {item.company_name||"No company"}</p>
        <p>Email: {item.email||"—"} · Phone: {item.phone||"—"} · Preferred contact: {item.preferred_contact_method||"—"}</p>
        <details><summary>View questionnaire answers</summary><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{JSON.stringify(item.response,null,2)}</pre></details>
      </article>)}
      <nav style={{display:"flex",gap:12}}>
        <button type="button" disabled={page===0} onClick={()=>setPage(p=>p-1)}>Previous</button>
        <button type="button" disabled={(page+1)*25>=result.total} onClick={()=>setPage(p=>p+1)}>Next</button>
      </nav>
    </>}
  </main>;
}

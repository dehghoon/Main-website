"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import AccessRequestsPanel from "../../owner/access-requests/AccessRequestsPanel";
type Survey = { id:string; created_at:string; full_name:string|null; company_name:string|null; email:string|null; phone:string|null; response:unknown };
type Result = {responses:Survey[];total:number;page:number};
const sections = ["Customer Discovery","Employees","Timesheet","Weblog","Labeling","Beta Access","Starter & Pro","Pro Rewards"] as const;
export default function AccessManager() {
 const [section,setSection]=useState<(typeof sections)[number]>("Customer Discovery");
 const [state,setState]=useState<"loading"|"denied"|"allowed"|"error">("loading");
 const [token,setToken]=useState("");
 const [data,setData]=useState<Result|null>(null);
 const [page,setPage]=useState(0);
 const [error,setError]=useState("");
 const [labeling,setLabeling]=useState<{email:string;permissions:string[]}[]>([]);
 const [labelingMessage,setLabelingMessage]=useState("");
 const [labelingLoading,setLabelingLoading]=useState(false);
 const [catalog,setCatalog]=useState<{permission:string;area:string;label:string;description:string|null}[]>([]);
 const [catalogMessage,setCatalogMessage]=useState("");
 const [timesheetProfiles,setTimesheetProfiles]=useState<{id:string;full_name:string;email:string;role:string}[]>([]);
 const [timesheetMessage,setTimesheetMessage]=useState("");
 const [grantEmail,setGrantEmail]=useState("");
 const [grantPermission,setGrantPermission]=useState("");
 const [grantMessage,setGrantMessage]=useState("");
 const [grantBusy,setGrantBusy]=useState(false);
 const [trialCustomer,setTrialCustomer]=useState("");
 const [trialType,setTrialType]=useState<"released"|"beta">("released");
 const [trialTool,setTrialTool]=useState("");
 const [trialGrant,setTrialGrant]=useState("");
 const [trialStart,setTrialStart]=useState("");
 const [trialExpiry,setTrialExpiry]=useState("");
 const [trialMessage,setTrialMessage]=useState("");
 const [trialBusy,setTrialBusy]=useState(false);
 const [rewards,setRewards]=useState<{user_id:string;customer_email:string;status:string;requested_at:string;verified_at:string|null;granted_at:string|null;expires_at:string|null}[]>([]);
 const [rewardsMessage,setRewardsMessage]=useState("");
 const [rewardsBusy,setRewardsBusy]=useState(false);
 const [rewardReviewNote,setRewardReviewNote]=useState("");
 async function loadRewards(){
  if(!token)return;setRewardsBusy(true);setRewardsMessage("");
  try{const r=await fetch("/api/admin/access-manager/pro-rewards",{headers:{Authorization:"Bearer "+token},cache:"no-store"});const b=await r.json();if(!r.ok)throw new Error(b.error||"Unable to load rewards");setRewards(b.requests??[]);}
  catch(e){setRewardsMessage(e instanceof Error?e.message:"Unable to load rewards");}
  finally{setRewardsBusy(false);}
 }
 async function reviewReward(userId:string,decision:"verify"|"reject"|"activate"){
  setRewardsBusy(true);setRewardsMessage("");
  try{const r=await fetch("/api/admin/access-manager/pro-rewards",{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({userId,decision,reason:rewardReviewNote})});const b=await r.json();if(!r.ok)throw new Error(b.detail||b.error||"Review rejected");await loadRewards();}
  catch(e){setRewardsMessage(e instanceof Error?e.message:"Review rejected");}
  finally{setRewardsBusy(false);}
 }
 async function manageTrial(action:"grant"|"extend"|"revoke"){
  setTrialBusy(true);setTrialMessage("");
  try{
   const response=await fetch("/api/admin/access-manager/customer-trials",{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({action,accessType:trialType,toolKey:trialTool,customerId:trialCustomer,grantId:trialGrant||null,startsAt:trialStart?new Date(trialStart).toISOString():null,expiresAt:trialExpiry?new Date(trialExpiry).toISOString():null})});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error||"Request rejected");
   setTrialGrant(result.grantId);setTrialMessage("Trial "+action+" recorded; product access requires server-side entitlement enforcement.");
  }catch(e){setTrialMessage(e instanceof Error?e.message:"Trial operation failed");}
  finally{setTrialBusy(false);}
 }

 useEffect(()=>{let live=true;async function check(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key){if(live)setState("error");return;}
  const auth=createClient(url,key);const {data:{session}}=await auth.auth.getSession();
  if(!session){if(live)setState("denied");return;}
  // The server validates the JWT and verified admin identity; never authorize using a client-side email check.
  const response=await fetch("/api/admin/access-manager/me",{headers:{Authorization:"Bearer "+session.access_token},cache:"no-store"});
  if(!live)return;
  if(response.status===401||response.status===403){setState("denied");return;}
  if(!response.ok){setState("error");return;}
  setToken(session.access_token);setState("allowed");
 }void check();return()=>{live=false}},[]);
 useEffect(()=>{if(state!=="allowed"||!token||section!=="Customer Discovery")return;let live=true;
  async function load(){const response=await fetch("/api/admin/customer-discovery?page="+page,{headers:{Authorization:"Bearer "+token},cache:"no-store"});
  if(!live)return;if(!response.ok){setError("Unable to load survey responses.");return;}setData(await response.json());setError("");}
  void load();return()=>{live=false};
 },[state,token,page,section]);
 async function changePlatformPermission(enabled:boolean) {
  if(!token||!grantEmail||!grantPermission)return;
  setGrantBusy(true);setGrantMessage("");
  try{
   const r=await fetch("/api/admin/access-manager/permissions",{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({email:grantEmail,permission:grantPermission,enabled})});
   const result=await r.json();
   if(!r.ok)throw new Error(result.error??"Permission change rejected");
   setGrantMessage(enabled?"Platform permission grant accepted by audited RPC.":"Platform permission revoke accepted by audited RPC.");
  }catch(e){setGrantMessage(e instanceof Error?e.message:"Permission change failed");}
  finally{setGrantBusy(false);}
 }
 async function loadTimesheet() {
  if(!token)return;setTimesheetMessage("");
  try {const r=await fetch("/api/admin/access-manager/timesheet",{headers:{Authorization:"Bearer "+token},cache:"no-store"});
   if(!r.ok)throw new Error("Timesheet role inspection unavailable ("+r.status+").");
   const body=await r.json();setTimesheetProfiles(body.profiles??[]);
  }catch(e){setTimesheetMessage(e instanceof Error?e.message:"Unable to load Timesheet roles.");}
 }
 async function loadCatalog() {
  if(!token)return;setCatalogMessage("");
  try{const r=await fetch("/api/admin/access-manager/catalog",{headers:{Authorization:"Bearer "+token},cache:"no-store"});
   if(!r.ok)throw new Error("Permission catalog unavailable ("+r.status+").");
   const body=await r.json();setCatalog(body.catalog??[]);
  }catch(e){setCatalogMessage(e instanceof Error?e.message:"Unable to load catalog.");}
 }
 async function loadLabeling() {
  if(!token)return;setLabelingLoading(true);setLabelingMessage("");
  try {const r=await fetch("/api/admin/access-manager/labeling",{headers:{Authorization:"Bearer "+token},cache:"no-store"});
   if(!r.ok)throw new Error("Labeling permissions are not available ("+r.status+").");
   const body=await r.json();setLabeling(body.employees??[]);
  }catch(e){setLabelingMessage(e instanceof Error?e.message:"Unable to load permissions.");}
  finally{setLabelingLoading(false);}
 }
 async function setLabelingPermission(email:string,permission:string,enabled:boolean) {
  if(!token)return;setLabelingLoading(true);setLabelingMessage("");
  try {const r=await fetch("/api/admin/access-manager/labeling",{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({email,permission,enabled})});
   if(!r.ok)throw new Error("Permission update was rejected ("+r.status+").");
   await loadLabeling();
  }catch(e){setLabelingMessage(e instanceof Error?e.message:"Unable to update permission.");}
  finally{setLabelingLoading(false);}
 }
 return <main className="authShell" style={{padding:"32px 16px"}}><section className="authCard" style={{maxWidth:1080,width:"100%"}}>
 <a href="/">← LinkoTech</a><span className="eyebrow">Administration</span><h1>Access Manager</h1>
 {state==="loading"&&<p role="status">Checking administrator access…</p>}
 {state==="denied"&&<p role="alert">You don't have access to this page. <a href="/customer-login">Sign in</a></p>}
 {state==="error"&&<p role="alert">Unable to verify access. Please try again later.</p>}
 {state==="allowed"&&<><nav aria-label="Access Manager sections" style={{display:"flex",flexWrap:"wrap",gap:10,margin:"20px 0"}}>
 {sections.map(s=><button key={s} type="button" aria-pressed={section===s} onClick={()=>{setSection(s);setGrantPermission("");setGrantMessage("");if(s==="Labeling")void loadLabeling();if(s==="Employees"||s==="Timesheet"||s==="Weblog")void loadCatalog();if(s==="Timesheet")void loadTimesheet();if(s==="Pro Rewards")void loadRewards();}}>{s}</button>)}</nav>
 {section==="Customer Discovery"?<section><h2>Customer Discovery responses</h2>{error&&<p role="alert">{error}</p>}
 <p>{data?.total??0} submissions</p>{data?.responses.map(item=><article key={item.id} style={{border:"1px solid #ccd8e0",borderRadius:12,padding:16,margin:"12px 0",overflowWrap:"anywhere"}}>
 <h3>{item.full_name||"Unnamed respondent"}</h3><p>{item.company_name||"No company"} · {new Date(item.created_at).toLocaleString()}</p>
 <p>Email: {item.email||"—"} · Phone: {item.phone||"—"}</p><details><summary>View answers</summary><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{JSON.stringify(item.response,null,2)}</pre></details></article>)}
 <div style={{display:"flex",gap:12}}><button disabled={page===0} onClick={()=>setPage(p=>p-1)}>Previous</button><button disabled={!data||(page+1)*25>=data.total} onClick={()=>setPage(p=>p+1)}>Next</button></div>
 </section>:section==="Labeling"?<section><h2>Labeling permissions</h2><p>Owner-managed employee permissions. Changes use the existing audited Labeling RPC.</p><button type="button" disabled={labelingLoading} onClick={()=>void loadLabeling()}>Refresh employees</button>{labelingMessage&&<p role="alert">{labelingMessage}</p>}
 {labeling.map(employee=><article key={employee.email} style={{border:"1px solid #ccd8e0",padding:14,marginTop:12,borderRadius:10}}><strong>{employee.email}</strong><div style={{display:"flex",flexWrap:"wrap",gap:12,marginTop:12}}>
 {(["labeling.workspace","labeling.upload","labeling.annotate","labeling.submit"] as const).map(permission=><label key={permission} style={{display:"flex",alignItems:"center",gap:6}}><input type="checkbox" disabled={labelingLoading} checked={employee.permissions?.includes(permission)??false} onChange={e=>void setLabelingPermission(employee.email,permission,e.target.checked)}/>{permission}</label>)}</div></article>)}
 </section>:section==="Employees"||section==="Timesheet"||section==="Weblog"?<section><h2>{section} permissions</h2>
 <p>Active platform permission catalog. Owner can grant or revoke these permissions using the existing audited server function. Application-level enforcement is verified separately.</p>
 <button type="button" onClick={()=>void loadCatalog()}>Refresh permission catalog</button>
 {catalogMessage&&<p role="alert">{catalogMessage}</p>}
 {section==="Employees"&&<><h3>Employee access requests</h3><AccessRequestsPanel />
 <h3>Owner permission grant / revoke</h3><p>Uses the existing audited platform permission function. Only registered employee accounts and active catalog permissions are eligible.</p>
 <label>Employee email <input type="email" value={grantEmail} onChange={e=>setGrantEmail(e.target.value)} placeholder="employee@example.com"/></label>
 <label>Permission <select value={grantPermission} onChange={e=>setGrantPermission(e.target.value)}><option value="">Choose permission</option>{catalog.map(p=><option key={p.permission} value={p.permission}>{p.area}: {p.label}</option>)}</select></label>
 <div style={{display:"flex",gap:10,marginTop:12}}><button type="button" disabled={grantBusy||!grantEmail||!grantPermission} onClick={()=>void changePlatformPermission(true)}>Grant permission</button><button type="button" disabled={grantBusy||!grantEmail||!grantPermission} onClick={()=>void changePlatformPermission(false)}>Revoke permission</button></div>{grantMessage&&<p role="status">{grantMessage}</p>}
 </> }
 {section==="Timesheet"&&<><h3>Existing Timesheet roles (read-only)</h3><p>Owner is a platform role, not a Timesheet database role. Role changes are disabled until database-level authorization is verified.</p><button type="button" onClick={()=>void loadTimesheet()}>Refresh Timesheet users</button>{timesheetMessage&&<p role="alert">{timesheetMessage}</p>}{timesheetProfiles.map(p=><p key={p.id}>{p.full_name} · {p.email} — <strong>{p.role}</strong></p>)}</>}
 {section!=="Employees"&&<><h3>Owner grant / revoke {section} permissions</h3><label>Employee email <input type="email" value={grantEmail} onChange={e=>setGrantEmail(e.target.value)} placeholder="employee@example.com"/></label><label>Permission <select value={grantPermission} onChange={e=>setGrantPermission(e.target.value)}><option value="">Choose permission</option>{catalog.filter(p=>p.area.toLowerCase().includes(section==="Timesheet"?"timesheet":"blog")).map(p=><option key={p.permission} value={p.permission}>{p.label}</option>)}</select></label><div style={{display:"flex",gap:10,marginTop:12}}><button type="button" disabled={grantBusy||!grantEmail||!grantPermission||!grantPermission.startsWith(section==="Timesheet"?"timesheet.":"blog.")} onClick={()=>void changePlatformPermission(true)}>Grant</button><button type="button" disabled={grantBusy||!grantEmail||!grantPermission||!grantPermission.startsWith(section==="Timesheet"?"timesheet.":"blog.")} onClick={()=>void changePlatformPermission(false)}>Revoke</button></div>{grantMessage&&<p role="status">{grantMessage}</p>}</>}
 {catalog.filter(item=>section==="Employees"||item.area?.toLowerCase().includes(section==="Timesheet"?"time":"blog")||item.permission?.toLowerCase().includes(section==="Timesheet"?"time":"blog")).map(item=><article key={item.permission} style={{border:"1px solid #ccd8e0",borderRadius:10,padding:12,marginTop:10}}><strong>{item.label}</strong><p>{item.permission} · {item.area}</p><p>{item.description}</p></article>)}
 </section>:section==="Beta Access"?<section><h2>Customer trial access</h2>
 <p>Owner-only trial grants. Use the customer's authenticated user ID. Trial access starts and expires at the specified time; product backends must check the entitlement on every protected operation.</p>
 <label>Access type <select value={trialType} onChange={e=>setTrialType(e.target.value as "released"|"beta")}><option value="released">Completed tool trial</option><option value="beta">Unfinished tool beta access</option></select></label>
 {trialType==="beta"&&<label>Unfinished tool key <input value={trialTool} onChange={e=>setTrialTool(e.target.value)} placeholder="tool identifier"/></label>}
 <label>Customer user ID <input value={trialCustomer} onChange={e=>setTrialCustomer(e.target.value)} placeholder="Customer UUID"/></label>
 <label>Existing grant ID (for extend/revoke) <input value={trialGrant} onChange={e=>setTrialGrant(e.target.value)} placeholder="Trial UUID"/></label>
 <label>Starts at <input type="datetime-local" value={trialStart} onChange={e=>setTrialStart(e.target.value)}/></label>
 <label>Expires at <input type="datetime-local" value={trialExpiry} onChange={e=>setTrialExpiry(e.target.value)}/></label>
 <div style={{display:"flex",flexWrap:"wrap",gap:10,marginTop:12}}>
 <button disabled={trialBusy||!trialCustomer||!trialStart||!trialExpiry} onClick={()=>void manageTrial("grant")}>Grant trial</button>
 {trialType==="released"&&<button disabled={trialBusy||!trialCustomer||!trialGrant||!trialExpiry} onClick={()=>void manageTrial("extend")}>Extend trial</button>}
 <button disabled={trialBusy||!trialCustomer||!trialGrant} onClick={()=>void manageTrial("revoke")}>Revoke trial</button></div>
 {trialMessage&&<p role="status">{trialMessage}</p>}
 <p>Requires the staged customer-trial database migration; not available in production until migration and security tests pass.</p>
 </section>:section==="Pro Rewards"?<section><h2>Customer Discovery — two-month Pro rewards</h2><p>Verify eligible requests now. Activation is separate and is blocked by the database until the official Pro launch. Review the original survey response before verification.</p><button type="button" disabled={rewardsBusy} onClick={()=>void loadRewards()}>Refresh reward requests</button><p>Confirm the customer identity against the actual Customer Discovery submission. A reward request alone does not prove survey completion.</p><label>Survey verification evidence (submission reference and matching email) <input value={rewardReviewNote} onChange={e=>setRewardReviewNote(e.target.value)} placeholder="Survey reference and identity match"/></label>{rewardsMessage&&<p role="alert">{rewardsMessage}</p>}{rewards.map(r=><article key={r.user_id} style={{border:"1px solid #ccd8e0",padding:12,marginTop:10,borderRadius:10}}><p><strong>{r.customer_email}</strong> — {r.status}</p><p>Customer ID: {r.user_id}</p><p>Requested: {new Date(r.requested_at).toLocaleString()}</p>{r.status==="pending"&&<><button disabled={rewardsBusy||rewardReviewNote.trim().length<10} onClick={()=>void reviewReward(r.user_id,"verify")}>Verify eligibility</button><button disabled={rewardsBusy} onClick={()=>void reviewReward(r.user_id,"reject")}>Reject</button></>}{r.status==="verified"&&<button disabled={rewardsBusy} onClick={()=>void reviewReward(r.user_id,"activate")}>Activate after official Pro launch</button>}{r.expires_at&&<p>Expires: {new Date(r.expires_at).toLocaleString()}</p>}</article>)}</section>:<section><h2>{section}</h2><p>This management function is not yet enabled. No permissions, subscriptions, or rewards can be changed from this screen until secure server-side approval workflows are implemented and tested.</p>
 </section>}</>}
 </section></main>;
}

"use client";
import {useEffect,useState} from "react";
import {getSupabase} from "@/lib/supabase-browser";
import {validHandoff} from "@/lib/tool-access/session-handoff";
export default function ToolSession(){
 const [status,setStatus]=useState("Connecting your Linkoteq account…");const [returnPath,setReturnPath]=useState("");const [tool,setTool]=useState("");const [login,setLogin]=useState(false);
 useEffect(()=>{
  let active=true;let revision=0;const params=new URLSearchParams(window.location.search);const key=params.get("tool"),origin=params.get("origin"),state=params.get("state");
  if(!validHandoff(key,origin,state)||!window.opener){setStatus("Open this account connection from the calculator's Connect button.");return;}
  setReturnPath(window.location.pathname+window.location.search);setTool(key);const client=getSupabase();if(!client){setStatus("Account connection is temporarily unavailable.");return;}
  async function connect(){const current=++revision;const {data}=await client!.auth.getSession();if(!active||revision!==current)return;
   const session=data.session;if(!session){setLogin(true);setStatus("Sign in once, then return directly to your calculator.");return;}setLogin(false);
   try{const response=await fetch(`/api/entitlements/execution?tool=${key}`,{headers:{Authorization:`Bearer ${session.access_token}`},cache:"no-store",signal:AbortSignal.timeout(12000)});const body=await response.json();if(!active||revision!==current)return;
    if(!response.ok||body.active!==true||body.tool!==key){setStatus(response.status===403?"This account needs approved access for this calculator. Request access in Client Workspace.":"Account access could not be verified. Please retry.");return;}
    if(!session.expires_at||session.expires_at*1000<=Date.now()+10000){setStatus("Your session is expiring. Sign in again.");setLogin(true);return;}
    // Explicit target origin and caller nonce; no refresh token, URL token or storage write.
    window.opener.postMessage({type:"linkoteq:account-handoff",tool:key,state,token:session.access_token,expiresAt:session.expires_at},origin!);
    setStatus("Connected. You can return to the calculator and close this window.");
   }catch{if(active&&revision===current)setStatus("Account connection failed. Close this window and retry from the calculator.");}
  }
  void connect();const {data:listener}=client.auth.onAuthStateChange(()=>{setTimeout(()=>{if(active)void connect();},0);});return()=>{active=false;++revision;listener.subscription.unsubscribe();};
 },[]);
 const q=encodeURIComponent(returnPath);
 return <main className="authShell"><section className="authCard"><h1>Connect your calculator</h1><p role="status">{status}</p>{login&&returnPath&&<p><a className="primaryButton" href={`/blog/login?returnTo=${q}`}>Employee sign in</a>{" "}<a href={`/customer-login?tool=${tool}&returnTo=${q}`}>Client sign in</a></p>}<p><a href={`/customer-login?tool=${tool}`}>Request calculator access</a></p><button onClick={()=>window.close()}>Return to calculator</button></section></main>;
}

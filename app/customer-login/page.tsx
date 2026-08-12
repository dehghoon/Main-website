"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";

export default function ClientWorkspacePage() {
  const [mode,setMode]=useState<"login"|"signup">("login");
  const [message,setMessage]=useState("");
  function submit(event:FormEvent){event.preventDefault();setMessage("Client Workspace authentication is ready for UI review. Database connection will be enabled after the client workspace tables and subscription model are created in Supabase.");}
  return <main className="authShell"><section className="authCard">
    <a href="/"><Image src="/linkotech-logo.svg" alt="LinkoTech" width={260} height={64} priority /></a>
    <span className="eyebrow">Client Access</span><h1>Client Workspace</h1><p>Client access will be controlled by subscription plan and entitlement status. The form is intentionally not connected to Supabase yet.</p>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,margin:"18px 0"}}><button type="button" onClick={()=>{setMode("login");setMessage("")}} style={{opacity:mode==="login"?1:.55}}>Log In</button><button type="button" onClick={()=>{setMode("signup");setMessage("")}} style={{opacity:mode==="signup"?1:.55}}>Sign Up</button></div>
    <form className="authForm" onSubmit={submit}>
      {mode==="signup"&&<><label>Full name<input required /></label><label>Company name<input required /></label></>}
      <label>Email<input type="email" required /></label>
      <label>Password<input type="password" minLength={8} required /></label>
      {mode==="signup"&&<label>Confirm password<input type="password" minLength={8} required /></label>}
      <button type="submit">{mode==="login"?"Log In":"Create Client Account"}</button>
    </form>
    {message&&<div className="authStatus">{message}</div>}
    <p style={{marginTop:20}}><a href="/pricing">View Plans</a> · <a href="/">Back to Home</a></p>
  </section></main>;
}

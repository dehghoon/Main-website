"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabase } from "@/lib/supabase-browser";

const TIMESHEET_URL = "https://timesheet.linkoteq.com/";

export default function EmployeeWorkspacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login"|"signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");

  async function continueToDestination() {
    const supabase = getSupabase();
    if (searchParams.get("next") === "timesheet" && supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const hash = new URLSearchParams({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          token_type: "bearer",
          expires_in: String(session.expires_in || 3600),
        });
        window.location.href = `${TIMESHEET_URL}#${hash.toString()}`;
        return;
      }
    }
    router.push("/blog/dashboard");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return setMessage("Supabase environment variables are not configured yet.");
    if (mode === "signup") {
      if (password !== confirm) return setMessage("Passwords do not match.");
      setMessage("Creating account…");
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options:{ data:{ full_name:name.trim() } } });
      if (error) return setMessage(error.message);
      if (!data.session) return setMessage("Account created. Check your email if confirmation is enabled.");
    } else {
      setMessage("Signing in…");
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) return setMessage(error.message);
    }
    await continueToDestination();
  }

  const forTimesheet = searchParams.get("next") === "timesheet";

  return <main className="authShell"><section className="authCard">
    <a href="/"><Image src="/linkotech-logo.svg" alt="LinkoTech" width={260} height={64} priority /></a>
    <span className="eyebrow">Employee Access</span><h1>Employee Workspace</h1><p>{forTimesheet ? "Sign in once with your LinkoTech employee account to continue to Timesheet." : "One employee identity for LinkoTech internal tools, Timesheet, and the company publishing workspace. Employee accounts receive full internal access."}</p>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,margin:"18px 0"}}><button type="button" onClick={()=>{setMode("login");setMessage("")}} style={{opacity:mode==="login"?1:.55}}>Log In</button><button type="button" onClick={()=>{setMode("signup");setMessage("")}} style={{opacity:mode==="signup"?1:.55}}>Sign Up</button></div>
    <form className="authForm" onSubmit={submit}>
      {mode === "signup" && <label>Full name<input value={name} onChange={(e)=>setName(e.target.value)} required /></label>}
      <label>Company email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
      <label>Password<input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
      {mode === "signup" && <label>Confirm password<input type="password" minLength={8} value={confirm} onChange={(e)=>setConfirm(e.target.value)} required /></label>}
      <button type="submit">{mode === "login" ? (forTimesheet ? "Log In & Open Timesheet" : "Log In") : "Create Employee Account"}</button>
    </form>
    {message && <div className="authStatus">{message}</div>}
    <p style={{marginTop:20}}>{forTimesheet ? <a href="/">Back to LinkoTech</a> : <><a href="/blog/login?next=timesheet">Open Timesheet</a> · <a href="/blog">Back to Blog</a></>}</p>
  </section></main>;
}

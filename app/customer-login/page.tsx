"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const discoveryUrl = "mailto:hello@linkoteq.com?subject=Customer%20Discovery%20survey%20and%20Pro%20offer";

type Preference = { beta_opt_in: boolean };
let browserClient: SupabaseClient | null = null;
function supabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!browserClient) browserClient = createClient(url, key);
  return browserClient;
}

export default function ClientWorkspacePage() {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [betaChoice, setBetaChoice] = useState<boolean | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const client = supabaseClient();
    if (!client) return;
    let mounted = true;
    async function syncUser(id: string | null) {
      if (!mounted) return;
      setUserId(id);
      if (!id) { setBetaChoice(null); return; }
      const { data, error } = await client!.from("client_beta_preferences")
        .select("beta_opt_in").eq("user_id", id).maybeSingle();
      if (!mounted) return;
      if (error) { setMessage("Account connected, but beta preferences are temporarily unavailable."); return; }
      setBetaChoice(data ? (data as Preference).beta_opt_in : null);
      if (!data) setShowWelcome(true);
    }
    void client.auth.getUser().then(({ data }) => syncUser(data.user?.id ?? null));
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      // Delay database reads until after Supabase completes its auth callback.
      setTimeout(() => { void syncUser(session?.user?.id ?? null); }, 0);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = supabaseClient();
    if (!client) { setMessage("Registration is temporarily unavailable. Please contact hello@linkoteq.com."); return; }
    if (mode === "signup" && password !== confirm) { setMessage("Passwords do not match."); return; }
    setBusy(true); setMessage("");
    try {
      if (mode === "signup") {
        const { data, error } = await client.auth.signUp({
          email: email.trim(), password,
          options: {
            data: { full_name: fullName.trim(), company_name: company.trim() },
            emailRedirectTo: `${window.location.origin}/customer-login`,
          },
        });
        if (error) throw error;
        if (data.session && data.user) {
          setUserId(data.user.id); setShowWelcome(true);
          setMessage("Account created. Please choose whether to request access to experimental tools.");
        } else {
          setNeedsConfirmation(true);
          setMessage("Check your email to confirm your account. After confirmation, sign in to choose beta access.");
        }
      } else {
        const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        setUserId(data.user.id);
        setMessage("Signed in successfully.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to continue. Please try again.");
    } finally { setBusy(false); }
  }

  async function chooseBeta(optIn: boolean) {
    const client = supabaseClient();
    if (!client || !userId) return;
    setBusy(true); setMessage("");
    const { data: user, error: authError } = await client.auth.getUser();
    if (authError || user.user?.id !== userId) {
      setMessage("Please sign in again before saving your choice."); setBusy(false); return;
    }
    const { error } = await client.from("client_beta_preferences")
      .upsert({ user_id: userId, beta_opt_in: optIn, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) setMessage("Could not save your preference. Please retry.");
    else { setBetaChoice(optIn); setShowWelcome(false); setMessage(optIn ? "Experimental access requested. These tools are incomplete and must not be relied upon for engineering decisions. Access to the separate 3D application is not yet granted by this choice." : "Preference saved. Experimental tools will remain hidden in your client workspace."); }
    setBusy(false);
  }

  async function signOut() {
    await supabaseClient()?.auth.signOut();
    setUserId(null); setBetaChoice(null); setShowWelcome(false); setMessage("Signed out.");
  }

  return <main className="authShell"><section className="authCard">
    <a href="/"><Image src="/linkotech-logo.svg" alt="LinkoTech" width={260} height={64} priority /></a>
    <span className="eyebrow">Client Access</span><h1>Client Workspace</h1>
    {!supabaseClient() && <p role="alert">Account service is not configured in this environment. Please contact <a href="mailto:hello@linkoteq.com">hello@linkoteq.com</a>.</p>}
    {userId ? <>
      <p>You are signed in. Verified, generally available tools will appear here as they become available.</p>
      {(showWelcome || betaChoice === null) && <div role="group" aria-label="Experimental tool preference">
        <h2>Would you like experimental access?</h2>
        <p>Some LinkoTech tools are incomplete and may contain errors. Opting in records your interest in experimental access. It does not grant access to a separate application. Experimental tools are not certified or reliable for professional engineering.</p>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}><button type="button" disabled={busy} onClick={()=>void chooseBeta(true)}>Yes, request experimental access</button><button type="button" disabled={busy} onClick={()=>void chooseBeta(false)}>No, hide incomplete tools</button></div>
      </div>}
      {betaChoice !== null && <div>
        <p><strong>Experimental access preference:</strong> {betaChoice ? "Requested" : "Hidden"}</p>
        {betaChoice && <p>3D Structural Model — access pending approval and separate application authorization.</p>}
        <button type="button" disabled={busy} onClick={()=>setShowWelcome(true)}>Change experimental access preference</button>
      </div>}
      <div style={{padding:16,marginTop:20,border:"1px solid #ccd8e0",borderRadius:12}}>
        <h2>Customer Discovery reward</h2>
        <p>Complete the Customer Discovery questionnaire to qualify for an offer of <strong>two months of free Pro access</strong>, subject to submission verification and activation. Completing the form does not automatically activate a subscription or unlock unavailable features.</p>
        <a href={discoveryUrl} target="_blank" rel="noopener noreferrer">Request the Customer Discovery questionnaire</a>
      </div>
      <button type="button" onClick={()=>void signOut()} style={{marginTop:20}}>Sign out</button>
    </> : <>
      <p>Sign up for a client account. You can choose whether to see experimental tools after confirming your email and signing in.</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,margin:"18px 0"}}>
        <button type="button" onClick={()=>{setMode("login");setMessage("")}} aria-pressed={mode==="login"}>Log In</button>
        <button type="button" onClick={()=>{setMode("signup");setMessage("")}} aria-pressed={mode==="signup"}>Sign Up</button>
      </div>
      <form className="authForm" onSubmit={submit}>
        {mode==="signup" && <><label>Full name<input value={fullName} onChange={e=>setFullName(e.target.value)} required maxLength={120} /></label><label>Company name (optional)<input value={company} onChange={e=>setCompany(e.target.value)} maxLength={120} /></label></>}
        <label>Email<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
        <label>Password<input type="password" autoComplete={mode==="signup"?"new-password":"current-password"} minLength={8} value={password} onChange={e=>setPassword(e.target.value)} required /></label>
        {mode==="signup" && <label>Confirm password<input type="password" autoComplete="new-password" minLength={8} value={confirm} onChange={e=>setConfirm(e.target.value)} required /></label>}
        <button type="submit" disabled={busy || !supabaseClient()}>{busy?"Please wait…":mode==="login"?"Log In":"Create Client Account"}</button>
      </form>
      {needsConfirmation && <p>Already confirmed your email? Choose Log In above.</p>}
      <p>After registration you will be invited to choose experimental access and learn about the Customer Discovery Pro offer.</p>
    </>}
    {message && <div className="authStatus" role="status">{message}</div>}
    <p style={{marginTop:20}}><a href="/pricing">View Plans</a> · <a href="/">Back to Home</a></p>
  </section></main>;
}

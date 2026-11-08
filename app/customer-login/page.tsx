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
  const [trialActive, setTrialActive] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [rewardStatus, setRewardStatus] = useState<string | null>(null);
  const [rewardDates, setRewardDates] = useState<{start: string | null; end: string | null}>({start:null,end:null});

  useEffect(() => {
    const client = supabaseClient();
    if (!client) return;
    let mounted = true;
    async function syncUser(id: string | null) {
      if (!mounted) return;
      setUserId(id);
      if (!id) { setTrialActive(false); setBetaChoice(null); setRewardStatus(null); setRewardDates({start:null,end:null}); return; }
      const {data:{session}}=await client!.auth.getSession();
      if(session?.access_token){
        try{
          const trial=await fetch("/api/entitlements/trial",{headers:{Authorization:"Bearer "+session.access_token},cache:"no-store"});
          const status=trial.ok?await trial.json():null;
          if(mounted)setTrialActive(status?.active===true);
        }catch{if(mounted)setTrialActive(false);}
      }
      const reward = await client!.from("customer_discovery_rewards").select("status,granted_at,expires_at").eq("user_id", id).maybeSingle();
      if (mounted && !reward.error) {
        setRewardStatus(reward.data?.status ?? null);
        setRewardDates({start:reward.data?.granted_at ?? null,end:reward.data?.expires_at ?? null});
      }
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

  async function requestReward() {
    const client = supabaseClient();
    if (!client || !userId) return;
    setBusy(true);
    const { data } = await client.auth.getUser();
    if (data.user?.id !== userId) { setMessage("Sign in again to request this offer."); setBusy(false); return; }
    const { error } = await client.from("customer_discovery_rewards").insert({ user_id: userId });
    if (error) setMessage("Could not submit the reward request. Please contact support.");
    else { setRewardStatus("pending"); setMessage("Your reward request is pending verification. The two-month Pro period will start only after the Pro tools officially launch and your reward is activated."); }
    setBusy(false);
  }

  async function signOut() {
    await supabaseClient()?.auth.signOut();
    setUserId(null); setTrialActive(false); setBetaChoice(null); setShowWelcome(false); setMessage("Signed out.");
  }

  return <main className="authShell"><section className="authCard">
    <a href="/"><Image src="/linkotech-logo.svg" alt="LinkoTech" width={260} height={64} priority /></a>
    <span className="eyebrow">Client Access</span><h1>Client Workspace</h1>
    {!supabaseClient() && <p role="alert">Account service is not configured in this environment. Please contact <a href="mailto:hello@linkoteq.com">hello@linkoteq.com</a>.</p>}
    {userId ? <>
      <p>You are signed in. Verified, generally available tools will appear here as they become available.</p>
      {(showWelcome || betaChoice === null) && <div role="group" aria-label="Experimental tool preference">
        <h2>Would you like experimental access?</h2>
        <p><strong>Warning: These tools are still being developed and may not work properly.</strong> Some features may be missing, results may be incorrect, and availability may be interrupted. Use them only for evaluation and feedback, never for engineering decisions or production work. Opting in only records your interest; it does not grant access.</p>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}><button type="button" disabled={busy} onClick={()=>void chooseBeta(true)}>Yes, request experimental access</button><button type="button" disabled={busy} onClick={()=>void chooseBeta(false)}>No, hide incomplete tools</button></div>
      </div>}
      {betaChoice !== null && <div>
        <p><strong>Experimental access preference:</strong> {betaChoice ? "Requested" : "Hidden"}</p>
        {betaChoice && <div role="note" style={{border:"1px solid #b7791f",borderRadius:10,padding:14,margin:"12px 0"}}>
          <strong>Important: Experimental tools are unfinished and may not work correctly.</strong>
          <p>These tools are under active development. Features may be missing, calculations or outputs may be incorrect, and the service may be interrupted. They are provided for evaluation and feedback only, not for professional engineering, safety-critical decisions, or production work. Independently verify all results. Your feedback helps us improve them.</p>
          <p>{trialActive ? "Your trial is active. Individual tools will appear only when their access integration is ready." : "Your request is pending Owner approval. No experimental tools are unlocked."}</p>
        </div>}
        <button type="button" disabled={busy} onClick={()=>setShowWelcome(true)}>Change experimental access preference</button>
      </div>}
      <div style={{padding:16,marginTop:20,border:"1px solid #ccd8e0",borderRadius:12}}>
        <h2>Customer Discovery reward</h2>
        <p>Complete the Customer Discovery questionnaire to qualify for an offer of <strong>two months of free Pro access</strong>, after your submission is verified and the Pro tools are officially completed and launched. Your two-month period will not begin while the Pro tools are incomplete. Completing the form does not automatically activate a subscription or unlock unavailable features.</p>
        <a href={discoveryUrl}>Request the Customer Discovery questionnaire</a>
        <p>After completing the questionnaire, request verification here. Verification reserves eligibility only. Your two free months start after official Pro product launch and activation, not on questionnaire completion.</p>
        {rewardStatus ? <div role="status"><p>Reward status: <strong>{rewardStatus === "verified" ? "Reserved — starts after official Pro launch" : rewardStatus === "granted" ? "Activated" : rewardStatus === "pending" ? "Pending verification" : rewardStatus}</strong></p>{rewardStatus === "granted" && rewardDates.start && rewardDates.end && <p>Free Pro period: {new Date(rewardDates.start).toLocaleDateString()} to {new Date(rewardDates.end).toLocaleDateString()}.</p>}</div> : <button type="button" disabled={busy} onClick={()=>void requestReward()}>I completed the questionnaire — request verification</button>}
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

"use client";

import Image from "next/image";
import { BETA_WARNING, ENGINEERING_TOOLS, type EngineeringToolKey } from "../../lib/tool-access/catalog";
import { PUBLIC_TOOLS, toolPreviewPath, toolRequestPath } from "@/lib/tool-discovery";
import { trackToolFunnel } from "@/lib/tool-funnel-analytics";
import { FormEvent, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase-browser";

const pendingSignupKey = "linkoteq.tool-signup";

function storeToolSignup(userId: string, toolKey: EngineeringToolKey) {
  try { window.localStorage.setItem(pendingSignupKey, JSON.stringify({ userId, toolKey })); }
  catch { /* Browser storage may be unavailable. */ }
}

function consumeToolSignup(userId: string) {
  try {
    const pending = JSON.parse(window.localStorage.getItem(pendingSignupKey) ?? "null");
    if (pending?.userId !== userId) return;
    window.localStorage.removeItem(pendingSignupKey);
    return PUBLIC_TOOLS.find(tool => tool.key === pending.toolKey);
  } catch { /* Browser storage may be unavailable. */ }
}

const discoveryUrl = "mailto:hello@linkoteq.com?subject=Customer%20Discovery%20survey%20and%20Pro%20offer";

type Preference = { beta_opt_in: boolean };
// Use the same browser auth session as the shared header, including email confirmation.
function supabaseClient(): SupabaseClient | null {
  return getSupabase() as SupabaseClient | null;
}

export default function ClientWorkspacePage() {
  const [requestedToolKey, setRequestedToolKey] = useState<EngineeringToolKey | null>(null);
  const requestedTool = PUBLIC_TOOLS.find(tool => tool.key === requestedToolKey);
  const [accessLoaded, setAccessLoaded] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
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
  const [toolAccess, setToolAccess] = useState<Record<string, boolean>>({});
  const [needsGrantDisclaimer, setNeedsGrantDisclaimer] = useState<Record<string, boolean>>({});
  const [pendingRequests, setPendingRequests] = useState<string[]>([]);
  const [trialDisclaimerAccepted, setTrialDisclaimerAccepted] = useState<Record<string, boolean>>({});
  const [savedDisclaimer, setSavedDisclaimer] = useState<Record<string, boolean>>({});
  const [preferenceLoaded, setPreferenceLoaded] = useState(false);
  const [rewardStatus, setRewardStatus] = useState<string | null>(null);
  const [rewardDates, setRewardDates] = useState<{start: string | null; end: string | null}>({start:null,end:null});

  useEffect(() => {
    const toolKey = new URLSearchParams(window.location.search).get("tool");
    const selected = PUBLIC_TOOLS.find(tool => tool.key === toolKey);
    if (selected) {
      setRequestedToolKey(selected.key);
      setMode("signup");
    }

    const client = supabaseClient();
    if (!client) return;
    let mounted = true;
    let syncVersion = 0;
    let currentUserId: string | null = null;
    async function syncUser(id: string | null) {
      if (!mounted) return;
      const version = ++syncVersion;
      const isCurrent = () => mounted && syncVersion === version;
      if (id !== currentUserId) {
        currentUserId = id;
        setUserId(id);
        setAccessLoaded(false); setToolAccess({}); setNeedsGrantDisclaimer({}); setPendingRequests([]);
        setSavedDisclaimer({}); setTrialDisclaimerAccepted({}); setBetaChoice(null);
        setPreferenceLoaded(false); setRewardStatus(null); setRewardDates({ start: null, end: null });
      }
      if (!id) return;
      const {data:{session}}=await client!.auth.getSession();
      if (!isCurrent()) return;
      if (session?.user.id === id && session.user.email_confirmed_at) {
        const signupTool = consumeToolSignup(id);
        if (signupTool) {
          if (!selected) setRequestedToolKey(signupTool.key);
          trackToolFunnel("sign_up", signupTool.key, signupTool.trialDays ? "trial" : "beta");
        }
      }
      if(session?.user.id === id && session.access_token){
        const checks=await Promise.all(ENGINEERING_TOOLS.map(async tool=>{
          try {
            const response=await fetch("/api/entitlements/tool?tool="+encodeURIComponent(tool.key),{headers:{Authorization:"Bearer "+session.access_token},cache:"no-store"});
            const result=response.ok?await response.json():null;
            return {
              toolKey: tool.key,
              active: result?.active === true,
              requiresDisclaimer: result?.disclaimerRequired === true && result?.requestRequired === false,
            };
          } catch {
            return { toolKey: tool.key, active: false, requiresDisclaimer: false };
          }
        }));
        if (isCurrent()) {
          setToolAccess(Object.fromEntries(checks.map(check => [check.toolKey, check.active])));
          setNeedsGrantDisclaimer(Object.fromEntries(checks.map(check => [check.toolKey, check.requiresDisclaimer])));
        }
      }
      if (!isCurrent()) return;
      const [{ data: requests }, { data: acceptances }] = await Promise.all([
        client!.from("customer_tool_access_requests").select("tool_key").eq("customer_id",id).eq("status","pending"),
        client!.from("customer_tool_disclaimer_acceptances").select("tool_key").eq("customer_id",id).eq("disclaimer_version","engineering-trial-v1"),
      ]);
      if (isCurrent() && requests) setPendingRequests(requests.map(item => item.tool_key));
      if (isCurrent()) {
        setSavedDisclaimer(Object.fromEntries((acceptances??[]).map(row=>[row.tool_key,true])));
        setAccessLoaded(true);
      }
      const reward = await client!.from("customer_discovery_rewards").select("status,granted_at,expires_at").eq("user_id", id).maybeSingle();
      if (isCurrent() && !reward.error) {
        setRewardStatus(reward.data?.status ?? null);
        setRewardDates({start:reward.data?.granted_at ?? null,end:reward.data?.expires_at ?? null});
      }
      const { data, error } = await client!.from("client_beta_preferences")
        .select("beta_opt_in").eq("user_id", id).maybeSingle();
      if (!isCurrent()) return;
      if (error) { setMessage("Account connected, but beta preferences are temporarily unavailable."); setPreferenceLoaded(false); return; }
      setBetaChoice(data ? (data as Preference).beta_opt_in : null);
      setPreferenceLoaded(true);
    }
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      // Delay database reads until after Supabase completes its auth callback.
      setTimeout(() => { void syncUser(session?.user?.id ?? null); }, 0);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!userId || !requestedToolKey || !accessLoaded) return;
    const section = document.getElementById(`request-${requestedToolKey}`);
    section?.focus({ preventScroll: true });
    section?.scrollIntoView({ block: "start" });
  }, [userId, requestedToolKey, accessLoaded]);

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
            emailRedirectTo: window.location.origin + (requestedTool ? toolRequestPath(requestedTool.key) : "/customer-login"),
          },
        });
        if (error) throw error;
        if (data.session && data.user) {
          if (requestedTool) trackToolFunnel("sign_up", requestedTool.key, requestedTool.trialDays ? "trial" : "beta");
          setUserId(data.user.id);
          setMessage("Account created.");
        } else {
          if (requestedTool && data.user?.id && data.user.identities?.length) {
            storeToolSignup(data.user.id, requestedTool.key);
          }
          setNeedsConfirmation(true);
          setMessage(requestedTool
            ? `Check your email to confirm your account and continue your ${requestedTool.name} request.`
            : "Check your email to confirm your account, then sign in.");
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
    else { setBetaChoice(optIn); setMessage(optIn ? "Beta interest saved. You can now submit a request for an individual tool." : "Preference saved. Experimental tools are hidden in your client workspace."); }
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

  async function requestTool(toolKey: EngineeringToolKey, accessType: "trial" | "beta") {
    const client=supabaseClient();
    if(!client||!userId||!accessLoaded)return;
    if (accessType === "beta" && betaChoice !== true) return;
    if(accessType==="trial"&&!trialDisclaimerAccepted[toolKey]&&!savedDisclaimer[toolKey]){setMessage("Please read and accept the engineering disclaimer first.");return;}
    setBusy(true);setMessage("");
    try {
      const {data:{user},error:authError}=await client.auth.getUser();
      if(authError||user?.id!==userId)throw new Error("Please sign in again.");
      if(accessType==="trial"&&!savedDisclaimer[toolKey]) {
        const {data:accepted,error:acceptError}=await client.rpc("accept_customer_tool_disclaimer",{p_tool_key:toolKey,p_version:"engineering-trial-v1"});
        if(acceptError||accepted!==true)throw acceptError??new Error("Disclaimer acknowledgment could not be saved.");
        setSavedDisclaimer(current=>({...current,[toolKey]:true}));
      }
      if (needsGrantDisclaimer[toolKey]) {
        const { data: { session } } = await client.auth.getSession();
        const response = await fetch("/api/entitlements/tool?tool=" + toolKey, {
          headers: { Authorization: "Bearer " + session?.access_token },
          cache: "no-store",
        });
        if (!response.ok) throw new Error("The acknowledgment was saved. Refresh to check your Trial access.");
        const result = await response.json();
        setNeedsGrantDisclaimer(current => ({ ...current, [toolKey]: result.disclaimerRequired === true }));
        setToolAccess(current => ({ ...current, [toolKey]: result.active === true }));
        setMessage(result.active ? "Disclaimer acknowledged. Your Trial is active." : "Disclaimer acknowledged. Your Trial is no longer active.");
        return;
      }
      if(pendingRequests.includes(toolKey)||toolAccess[toolKey]){setMessage("An access request is already pending or approved.");return;}
      const {error}=await client.from("customer_tool_access_requests").insert({customer_id:userId,tool_key:toolKey,access_type:accessType});
      if(error)throw error;
      setPendingRequests(current=>[...current,toolKey]);
      trackToolFunnel("tool_access_request_submitted", toolKey, accessType);
      setMessage("Request submitted. Access remains locked until Owner approval.");
    }catch(error){setMessage(error instanceof Error?error.message:"Request could not be submitted. Please try again.");}
    finally{setBusy(false);}
  }

  async function signOut() {
    await supabaseClient()?.auth.signOut();
    setUserId(null); setAccessLoaded(false); setPendingRequests([]); setBetaChoice(null); setMessage("Signed out.");
  }

  return <main className="authShell"><section className="authCard">
    <a href="/"><Image src="/linkotech-logo.svg" alt="LinkoTech" width={260} height={64} priority /></a>
    <span className="eyebrow">Client Access</span><h1>Client Workspace</h1>
    {!supabaseClient() && <p role="alert">Account service is not configured in this environment. Please contact <a href="mailto:hello@linkoteq.com">hello@linkoteq.com</a>.</p>}
    {userId ? <>
      <div style={{padding:16,marginTop:20,border:"1px solid #ccd8e0",borderRadius:12}}>
        <h2>Your engineering tools</h2>
        {!accessLoaded && <p role="status">Checking your access…</p>}
        {ENGINEERING_TOOLS
          .filter(tool => tool.trialDays || tool.key === requestedToolKey || betaChoice === true)
          .sort((a, b) => Number(b.key === requestedToolKey) - Number(a.key === requestedToolKey))
          .map(tool => {
            const approved = toolAccess[tool.key] === true;
            const pending = pendingRequests.includes(tool.key);
            const selected = tool.key === requestedToolKey;
            const needsDisclaimer = Boolean(tool.trialDays && !savedDisclaimer[tool.key]);
            return <section
              key={tool.key}
              id={`request-${tool.key}`}
              tabIndex={selected ? -1 : undefined}
              aria-labelledby={`name-${tool.key}`}
              style={{padding:"12px 0",borderBottom:"1px solid #ddd",scrollMarginTop:18}}
            >
              <h3 id={`name-${tool.key}`}>{tool.name}</h3>
              {!tool.trialDays && betaChoice !== true ? (
                <div>
                  <p>{BETA_WARNING}</p>
                  <button type="button" disabled={busy || !preferenceLoaded} onClick={()=>void chooseBeta(true)}>
                    Opt in to Beta tools
                  </button>
                </div>
              ) : accessLoaded && (
                <>
                  {approved && tool.url ? (
                    <a href={tool.url}>Open {tool.name}</a>
                  ) : pending ? (
                    <p>Request pending Owner approval.</p>
                  ) : (
                    <>
                      {needsDisclaimer && (
                        <details open={selected || undefined} style={{border:"1px solid #a87b28",borderRadius:8,padding:12,margin:"8px 0"}}>
                          <summary style={{cursor:"pointer",fontWeight:700}}>Read engineering disclaimer</summary>
                          <p>All inputs, assumptions, applicable codes, calculation results, and engineering decisions must be independently reviewed and verified by the responsible qualified engineer. Linkoteq software is an aid, not a substitute for professional engineering judgment. The engineer remains responsible for the suitability, accuracy, and safe use of the results. Do not rely on an unverified output for design or construction.</p>
                          <label><input type="checkbox" checked={trialDisclaimerAccepted[tool.key]===true} onChange={event=>setTrialDisclaimerAccepted(current=>({...current,[tool.key]:event.target.checked}))}/> I have read and understand this disclaimer for {tool.name}.</label>
                        </details>
                      )}
                      {approved ? <p>Approved. This tool is still in development.</p> : (
                        <button type="button" disabled={busy || (needsDisclaimer && !trialDisclaimerAccepted[tool.key])} onClick={()=>void requestTool(tool.key,tool.trialDays?"trial":"beta")}>
                          {needsGrantDisclaimer[tool.key] ? "Accept disclaimer and continue" : tool.trialDays ? `Request ${tool.trialDays}-day Trial` : "Request Beta Access"}
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </section>;
          })}
      </div>
      {preferenceLoaded && <details style={{margin:"18px 0"}}>
        <summary>Experimental tool preferences</summary>
        <p>{BETA_WARNING}</p>
        {betaChoice === null ? (
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <button type="button" disabled={busy} onClick={()=>void chooseBeta(true)}>Opt in to experimental tools</button>
            <button type="button" disabled={busy} onClick={()=>void chooseBeta(false)}>Keep experimental tools hidden</button>
          </div>
        ) : (
          <button type="button" disabled={busy} onClick={()=>void chooseBeta(!betaChoice)}>
            {betaChoice ? "Hide experimental tools" : "Show experimental tools"}
          </button>
        )}
      </details>}
      <details style={{padding:16,marginTop:20,border:"1px solid #ccd8e0",borderRadius:12}}><summary style={{cursor:"pointer",fontWeight:700}}>Trial access and Customer Discovery reward details</summary>
        <h2>Completed tools — trial access</h2>
        <p>Trials of completed, released tools are separate from early access to unfinished tools. Choosing not to try unfinished tools does not prevent you from requesting a trial of completed tools. Completed-tool trials require their own Owner approval and product entitlement; no tool is unlocked merely by selecting an interest preference.</p>
        <h2>Customer Discovery reward</h2>
        <p>Complete the Customer Discovery questionnaire to qualify for an offer of <strong>two months of free Pro access</strong>, after your submission is verified and the Pro tools are officially completed and launched. Your two-month period will not begin while the Pro tools are incomplete. Completing the form does not automatically activate a subscription or unlock unavailable features.</p>
        <a href={discoveryUrl}>Request the Customer Discovery questionnaire</a>
        <p>After completing the questionnaire, request verification here. Verification reserves eligibility only. Your two free months start after official Pro product launch and activation, not on questionnaire completion.</p>
        {rewardStatus ? <div role="status"><p>Reward status: <strong>{rewardStatus === "verified" ? "Reserved — starts after official Pro launch" : rewardStatus === "granted" ? "Activated" : rewardStatus === "pending" ? "Pending verification" : rewardStatus}</strong></p>{rewardStatus === "granted" && rewardDates.start && rewardDates.end && <p>Free Pro period: {new Date(rewardDates.start).toLocaleDateString()} to {new Date(rewardDates.end).toLocaleDateString()}.</p>}</div> : <button type="button" disabled={busy} onClick={()=>void requestReward()}>I completed the questionnaire — request verification</button>}
      </details>
      <button type="button" onClick={()=>void signOut()} style={{marginTop:20}}>Sign out</button>
    </> : <>
      {requestedTool ? (
        <div>
          <p>Sign in or create a client account to request {requestedTool.trialDays ? "a 30-day Trial of" : "Beta access to"} <strong>{requestedTool.name}</strong>. Requests require approval.</p>
          <a href={toolPreviewPath(requestedTool)}>Back to the {requestedTool.name} preview</a>
        </div>
      ) : <p>Sign in or create a client account to request access to engineering tools.</p>}
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

    </>}
    {message && <div className="authStatus" role="status">{message}</div>}
    <p style={{marginTop:20}}><a href="/pricing">View Plans</a> · <a href="/">Back to Home</a></p>
  </section></main>;
}

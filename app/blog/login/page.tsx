"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase-browser";

const TIMESHEET_URL = "https://timesheet.linkoteq.com/";

function mapAuthError(message: string) {
  const value = message.toLowerCase();
  if (value.includes("email not confirmed")) {
    return "Email confirmation is required. Use Resend confirmation email, then confirm the message before logging in.";
  }
  if (value.includes("invalid login credentials")) {
    return "Login failed. Check your email and password. If you have not confirmed your email, use Resend confirmation email.";
  }
  return message;
}

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  if (value.startsWith("/blog/login")) return "/";
  return value;
}

export default function EmployeeWorkspacePage() {
  const router = useRouter();
  const [forTimesheet, setForTimesheet] = useState(false);
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmationPending, setConfirmationPending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wantsTimesheet = params.get("next") === "timesheet";
    const requestedReturnTo = safeReturnTo(params.get("returnTo"));
    setForTimesheet(wantsTimesheet);
    setReturnTo(requestedReturnTo);

    const supabase = getSupabase();
    if (!supabase) return;

    void supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return;
      if (wantsTimesheet) {
        void continueToDestination(true, requestedReturnTo);
      } else if (requestedReturnTo) {
        router.replace(requestedReturnTo);
      } else {
        router.replace("/blog/dashboard");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function continueToDestination(
    forceTimesheet = forTimesheet,
    requestedReturnTo = returnTo,
  ) {
    const supabase = getSupabase();
    if (forceTimesheet && supabase) {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const hash = new URLSearchParams({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          token_type: "bearer",
          expires_in: String(data.session.expires_in || 3600),
        });
        window.location.href = `${TIMESHEET_URL}#${hash.toString()}`;
        return;
      }
    }

    router.push(requestedReturnTo ?? "/blog/dashboard");
  }

  function confirmationRedirectUrl() {
    const url = new URL("/blog/login", window.location.origin);
    if (forTimesheet) {
      url.searchParams.set("next", "timesheet");
    } else if (returnTo) {
      url.searchParams.set("returnTo", returnTo);
    }
    return url.toString();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return setMessage("Supabase environment variables are not configured yet.");

    const normalizedEmail = email.trim();
    if (!normalizedEmail) return setMessage("Email is required.");

    setBusy(true);
    setMessage("");
    try {
      if (mode === "signup") {
        if (password !== confirm) return setMessage("Passwords do not match.");

        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: confirmationRedirectUrl(),
          },
        });

        if (error) {
          setConfirmationPending(false);
          return setMessage(mapAuthError(error.message));
        }
        if (!data.user) {
          setConfirmationPending(false);
          return setMessage("Signup did not return a user record. No authenticated account was created.");
        }
        if (data.session) {
          setConfirmationPending(false);
          setMessage("Account created and signed in.");
          await continueToDestination();
          return;
        }
        if (data.user.identities?.length === 0) {
          setConfirmationPending(true);
          return setMessage("No new identity was created for this email. Use Log In or request another confirmation email.");
        }

        setConfirmationPending(true);
        return setMessage("Registration accepted, but no authenticated session exists yet. Confirm your email before logging in. If the email does not arrive, use Resend confirmation email.");
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (error) {
        const mapped = mapAuthError(error.message);
        setConfirmationPending(mapped.toLowerCase().includes("confirmation"));
        return setMessage(mapped);
      }

      setConfirmationPending(false);
      setMessage("Signed in.");
      await continueToDestination();
    } finally {
      setBusy(false);
    }
  }

  async function resendConfirmation() {
    const supabase = getSupabase();
    if (!supabase) return setMessage("Supabase environment variables are not configured yet.");
    const normalizedEmail = email.trim();
    if (!normalizedEmail) return setMessage("Enter your email first.");

    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: normalizedEmail,
        options: { emailRedirectTo: confirmationRedirectUrl() },
      });
      if (error) return setMessage(mapAuthError(error.message));
      setConfirmationPending(true);
      setMessage("Confirmation email requested. Check Inbox, Spam, and Junk. Delivery depends on the Supabase email provider configuration.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="authShell">
      <section className="authCard">
        <a href="/">
          <Image src="/linkotech-logo.svg" alt="LinkoTech" width={260} height={64} priority />
        </a>

        <span className="eyebrow">Employee Access</span>
        <h1>Employee Workspace</h1>
        <p>
          {forTimesheet
            ? "Sign in once with your LinkoTech employee account to continue to Timesheet."
            : "One employee identity for LinkoTech internal tools. Employee authorization is managed separately from signup."}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "18px 0" }}>
          {(["login", "signup"] as const).map((item) => (
            <button
              key={item}
              type="button"
              disabled={busy}
              onClick={() => {
                setMode(item);
                setMessage("");
              }}
              style={{ opacity: mode === item ? 1 : 0.55 }}
            >
              {item === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        <form className="authForm" onSubmit={submit}>
          {mode === "signup" && (
            <label>
              Full name
              <input value={name} onChange={(event) => setName(event.target.value)} required disabled={busy} />
            </label>
          )}

          <label>
            Company email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={busy} />
          </label>

          <label>
            Password
            <input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required disabled={busy} />
          </label>

          {mode === "signup" && (
            <label>
              Confirm password
              <input type="password" minLength={8} value={confirm} onChange={(event) => setConfirm(event.target.value)} required disabled={busy} />
            </label>
          )}

          <button type="submit" disabled={busy}>
            {busy ? "Please wait …" : mode === "login" ? (forTimesheet ? "Log In & Open Timesheet" : "Log In") : "Create Employee Account"}
          </button>
        </form>

        {(confirmationPending || mode === "signup") && (
          <div style={{ marginTop: 12 }}>
            <button type="button" onClick={() => void resendConfirmation()} disabled={busy || !email.trim()}>
              Resend confirmation email
            </button>
          </div>
        )}

        {message && <div className="authStatus">{message}</div>}

        <p style={{ marginTop: 20 }}>
          {forTimesheet ? (
            <a href="/">Back to LinkoTech</a>
          ) : returnTo ? (
            <a href={returnTo}>Back to previous page</a>
          ) : (
            <>
              <a href="/blog/login?next=timesheet">Open Timesheet</a> · <a href="/blog">Back to Blog</a>
            </>
          )}
        </p>
      </section>
    </main>
  );
}

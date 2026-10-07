"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase-browser";

const TIMESHEET_URL = "https://timesheet.linkoteq.com/";

function authMessage(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("email not confirmed")) {
    return "Email confirmation is still required. Use Resend confirmation email below, then confirm the message before logging in.";
  }
  if (normalized.includes("invalid login credentials")) {
    return "Login failed. Check your email and password. If you just signed up and have not confirmed your email, use Resend confirmation email below.";
  }
  return message;
}

export default function EmployeeWorkspacePage() {
  const router = useRouter();
  const [forTimesheet, setForTimesheet] = useState(false);
  const [mode, setMode] = useState<|"login" | "signup">("login");
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
    setForTimesheet(wantsTimesheet);
    const supabase = getSupabase();
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return;
      if (wantsTimesheet) void continueToDestination(true);
      else router.replace("/blog/dashboard");
    });
  }, [router]);

  async function continueToDestination(forceTimesheet = forTimesheet) {
    const supabase = getSupabase();
    if (forceTimesheet && supabase) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
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
    if (!supabase) {
      setMessage("Supabase environment variables are not configured yet.");
      return;
    }

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
    setMessage("Email is required.");
    return;
  }

  setBusy(true);
  setMessage("");
  try {
    if (mode === "signup") {
      if (password !== confirm) {
        setMessage("Passwords do not match.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo: `${window.location.origin}/blog/login`,
        },
      });

      if (error) {
        setConfirmationPending(false);
        setMessage(authMessage(error.message));
        return;
      }

      if (!data.user) {
        setConfirmationPending(false);
        setMessage("Signup did not return a user record. No authenticated account was created.");
        return;
      }

      if (data.session) {
        setConfirmationPending(false);
        setMessage("Account created and signed in.");
        await continueToDestination();
        return;
      }

      if (data.user.identities && data.user.identities.length === 0) {
        setConfirmationPending(true);
        setMessage(
          "No new identity was created for this email. If you already registered, use Log In or request another confirmation email.",
        );
        return;
      }

      setConfirmationPending(true);
      setMessage(
        "Registration accepted, but no authenticated session exists yet. Confirm your email before logging in. If the message does not arrive, use Resend confirmation email.",
      );
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (error) {
      const mapped = authMessage(error.message);
      setConfirmationPending(
        mapped.includes("confirmation") || mapped.includes("Resend confirmation email"),
      );
      setMessage(mapped);
      return;
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
    if (!supabase) {
      setMessage("Supabase environment variables are not configured yet.");
      return;
    }

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
    setMessage("Enter your email before requesting another confirmation message.");
    return;
  }

    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: normalizedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/blog/login`,
        },
      });

      if (error) {
        setMessage(authMessage(error.message));
        return;
      }

      setConfirmationPending(true);
      setMessage(
        "Confirmation email requested. Check Inbox, Spam, and Junk. Delivery still depends on the Supabase email provider configuration.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="authShell">
      <section className="authCard">
        <a href="/">
          <Image
            src="/linkotech-logo.svg"
            alt="LinkoTech"
            width={260}
            height={64}
            priority
          />
        </a>

        <span className="eyebrow">Employee Access</span>
        <h1>Employee Workspace</h1>
        <p>
          {forTimesheet
            ? "Sign in once with your LinkoTech employee account to continue to Timesheet."
            : "One employee identity for LinkoTech internal tools, Timesheet, and the company publishing workspace. Employee authorization is managed separately from signup."}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            margin: "18px 0",
          }}
        >
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
            style={{ opacity: mode === "login" ? 1 : 0.55 }}
          >
            Log In
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setMode("signup");
              setMessage("");
            }}
            style={{ opacity: mode === "signup" ? 1 : 0.55 }}
          >
            Sign Up
          </button>
        </div>

        <form className="authForm" onSubmit={submit}>
          {mode === "signup" && (
            <label>
              Full name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                disabled={busy}
              />
            </label>
          )}

          <label>
            Company email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={busy}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={busy}
            />
          </label>

          {mode === "signup" && (
            <label>
              Confirm password
              <input
                type="password"
                minLength={8}
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                required
                disabled={busy}
              />
            </label>
          )}

          <button type="submit" disabled={busy}>
            {busy
              ? "Please wait …"
              : mode === "login"
                ? forTimesheet
                  ? "Log In & Open Timesheet"
                  : "Log In"
                : "Create Employee Account"}
          </button>
        </form>

        {(confirmationPending || mode === "signup") && (
          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              onClick={() => void resendConfirmation()}
              disabled={busy || !email.trim()}
            >
              Resend confirmation email
            </button>
          </div>
        )}

        {message && <div className="authStatus">{message}</div>}

        <p style={{ marginTop: 20 }}>
          {forTimesheet ? (
            <a href="/">Back to LinkoTech</a>
          ) : (
            <>
              <a href="/blog/login?next=timesheet">Open Timesheet</a> · {" "}
              <a href="/blog">Back to Blog</a>
            </>
          )}
        </p>
      </section>
    </main>
  );
}

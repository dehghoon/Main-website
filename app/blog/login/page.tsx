"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase-browser";

export default function AuthorLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function login(event: FormEvent) {
    event.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return setMessage("Supabase environment variables are not configured yet.");
    setMessage("Signing in…");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return setMessage(error.message);
    router.push("/blog/dashboard");
  }

  return <main className="authShell"><section className="authCard">
    <a href="/"><Image src="/linkotech-logo.svg" alt="LinkoTech" width={260} height={64} priority /></a>
    <h1>Author workspace</h1><p>Company authors can sign in here to draft and publish LinkoTech blog posts.</p>
    <form className="authForm" onSubmit={login}>
      <label>Company email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
      <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
      <button type="submit">Log in</button>
    </form>
    {message && <div className="authStatus">{message}</div>}
    <p style={{marginTop:20}}><a href="/blog">← Back to Blog</a></p>
  </section></main>;
}

"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase-browser";

type Post = { id: string; title: string; status: string; created_at: string };

export default function BlogDashboard() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("");
  const [status, setStatus] = useState("Checking access…");

  async function load() {
    const supabase = getSupabase();
    if (!supabase) return setStatus("Supabase is not configured.");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return router.replace("/blog/login");
    setAuthor((auth.user.user_metadata?.full_name as string) || auth.user.email || "LinkoTech");
    const { data, error } = await supabase.from("blog_posts").select("id,title,status,created_at").order("created_at", { ascending: false });
    if (error) setStatus(error.message); else { setPosts((data as Post[]) || []); setStatus(""); }
  }

  useEffect(() => { void load(); }, []);

  async function save(event: FormEvent, publish: boolean) {
    event.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return setStatus("Supabase is not configured.");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return router.replace("/blog/login");
    setStatus(publish ? "Publishing…" : "Saving draft…");
    const { error } = await supabase.from("blog_posts").insert({
      title: title.trim(), excerpt: excerpt.trim() || null, body: body.trim(), author_id: auth.user.id,
      author_name: author, status: publish ? "published" : "draft", published_at: publish ? new Date().toISOString() : null,
    });
    if (error) return setStatus(error.message);
    setTitle(""); setExcerpt(""); setBody(""); setStatus(publish ? "Published." : "Draft saved.");
    await load();
  }

  async function logout() { const supabase = getSupabase(); if (supabase) await supabase.auth.signOut(); router.replace("/blog/login"); }

  return <main className="dashboard">
    <div className="dashboardTop"><a href="/"><Image src="/linkotech-logo.svg" alt="LinkoTech" width={250} height={64} priority /></a><div><a href="/blog" style={{marginRight:16}}>View Blog</a><button onClick={logout} className="navCta">Log out</button></div></div>
    <div className="dashboardGrid">
      <section className="dashboardPanel"><span className="eyebrow">Employee Workspace</span><h2>Create a post</h2><form className="authForm" onSubmit={(e) => save(e, true)}>
        <label>Title<input value={title} onChange={(e)=>setTitle(e.target.value)} required /></label>
        <label>Excerpt<input value={excerpt} onChange={(e)=>setExcerpt(e.target.value)} /></label>
        <label>Article body<textarea value={body} onChange={(e)=>setBody(e.target.value)} required /></label>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}><button type="button" onClick={(e)=>save(e as unknown as FormEvent, false)}>Save draft</button><button type="submit">Publish post</button></div>
      </form>{status && <div className="authStatus">{status}</div>}</section>
      <aside className="dashboardPanel"><h2>Recent posts</h2><div className="postList">{posts.map(p=><div className="postRow" key={p.id}><strong>{p.title}</strong><span>{p.status} · {new Date(p.created_at).toLocaleDateString()}</span></div>)}{!posts.length && <p>No posts yet.</p>}</div></aside>
    </div>
  </main>;
}

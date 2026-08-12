"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase-browser";

type Post = { id: string; title: string; excerpt: string | null; body: string; author_name: string | null; published_at: string | null; created_at: string };

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [status, setStatus] = useState("Loading insights…");

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setStatus("The blog is ready; connect Supabase to publish company posts.");
      return;
    }
    supabase.from("blog_posts").select("id,title,excerpt,body,author_name,published_at,created_at").eq("status", "published").order("published_at", { ascending: false }).then(({ data, error }) => {
      if (error) setStatus("Blog posts are temporarily unavailable.");
      else { setPosts((data as Post[]) || []); setStatus(data?.length ? "" : "No posts have been published yet."); }
    });
  }, []);

  return (
    <main className="blogPage">
      <header className="blogHeader">
        <a href="/"><Image src="/linkotech-logo.svg" alt="LinkoTech" width={260} height={64} priority /></a>
        <nav><a href="/">Company</a><a href="/#tools">Tools</a><a href="/blog">Blog</a><a className="authorLink" href="/blog/login">Employee Workspace</a></nav>
      </header>
      <section className="blogHero">
        <span className="eyebrow">LinkoTech Journal</span>
        <h1>Engineering software, AI, and digital workflows.</h1>
        <p>Company perspectives on structural engineering tools, drawing intelligence, product development, validation, and the future of connected engineering workflows.</p>
      </section>
      <section className="blogGrid" aria-live="polite">
        {posts.map((post) => (
          <article className="blogCard" key={post.id}>
            <div className="meta">{post.author_name || "LinkoTech"} · {new Date(post.published_at || post.created_at).toLocaleDateString()}</div>
            <h2>{post.title}</h2>
            <p>{post.excerpt || post.body.slice(0, 180) + (post.body.length > 180 ? "…" : "")}</p>
            <span className="readLink">Company insight</span>
          </article>
        ))}
        {!posts.length && <article className="blogCard"><div className="meta">LinkoTech Journal</div><h2>Publishing workspace ready</h2><p>{status}</p><a className="readLink" href="/blog/login">Employee Workspace →</a></article>}
      </section>
    </main>
  );
}

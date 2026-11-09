import type { Metadata } from "next";
import Image from "next/image";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Structural Engineering Articles & Digital Workflows | LinkoTech",
  description: "Practical articles on structural engineering, BIM, IFC, model validation, and digital engineering workflows.",
  alternates: { canonical: "https://www.linkoteq.com/blog" },
};

type Post = { id:string; title:string; excerpt:string|null; body:string; author_name:string|null; published_at:string|null; created_at:string; slug:string|null; cover_image_url:string|null; tags:string[] };

async function publishedPosts(): Promise<Post[]> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return [];
  const query = new URLSearchParams({select:"id,title,excerpt,body,author_name,published_at,created_at,slug,cover_image_url,tags",status:"eq.published",order:"published_at.desc",limit:"100"});
  try {
    const response = await fetch(`${base}/rest/v1/blog_posts?${query}`, {headers:{apikey:key,Authorization:`Bearer ${key}`},cache:"no-store"});
    if (!response.ok) return [];
    return await response.json() as Post[];
  } catch { return []; }
}

export default async function BlogPage() {
  const posts = await publishedPosts();
  return <main className="blogPage">
    <header className="blogHeader"><a href="/"><Image src="/linkotech-logo.svg" alt="LinkoTech" width={260} height={64} priority /></a><nav><a href="/">Company</a><a href="/#tools">Tools</a><a href="/blog">Blog</a><a className="authorLink" href="/blog/login">Employee Workspace</a></nav></header>
    <section className="blogHero"><span className="eyebrow">LinkoTech Journal</span><h1>Engineering software, AI, and digital workflows.</h1><p>Technical articles, engineering workflows, calculator launches, practical examples, and product thinking for structural engineers.</p></section>
    <section className="blogGrid">{posts.map(post=><article className="blogCard richBlogCard" key={post.id}>{post.cover_image_url&&<img className="blogCardCover" src={post.cover_image_url} alt={post.title} />}<div className="meta">{post.author_name||"LinkoTech"} · {new Date(post.published_at||post.created_at).toLocaleDateString()}</div><h2>{post.title}</h2><p>{post.excerpt||post.body.replace(/<[^>]+>/g,"").slice(0,180)+(post.body.length>180?"…":"")}</p>{!!post.tags?.length&&<div className="blogCardTags">{post.tags.slice(0,3).map(t=><span key={t}>#{t}</span>)}</div>}<a className="readLink" href={post.slug?`/blog/${post.slug}`:"/blog"}>Read Article →</a></article>)}{!posts.length&&<article className="blogCard"><div className="meta">LinkoTech Journal</div><h2>Articles temporarily unavailable</h2><p>Please check back soon.</p></article>}</section>
  </main>;
}

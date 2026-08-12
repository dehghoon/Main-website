"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase-browser";

type Post = { id:string; title:string; excerpt:string|null; body:string; author_name:string|null; published_at:string|null; created_at:string; slug:string|null; cover_image_url:string|null; tags:string[] };

export default function BlogPage(){
 const [posts,setPosts]=useState<Post[]>([]); const [status,setStatus]=useState("Loading insights…");
 useEffect(()=>{const s=getSupabase();if(!s){setStatus("The blog is ready; connect Supabase to publish company posts.");return;}s.from("blog_posts").select("id,title,excerpt,body,author_name,published_at,created_at,slug,cover_image_url,tags").eq("status","published").order("published_at",{ascending:false}).then(({data,error})=>{if(error)setStatus("Blog posts are temporarily unavailable.");else{setPosts((data as Post[])||[]);setStatus(data?.length?"":"No posts have been published yet.");}});},[]);
 return <main className="blogPage">
  <header className="blogHeader"><a href="/"><Image src="/linkotech-logo.svg" alt="LinkoTech" width={260} height={64} priority /></a><nav><a href="/">Company</a><a href="/#tools">Tools</a><a href="/blog">Blog</a><a className="authorLink" href="/blog/login">Employee Workspace</a></nav></header>
  <section className="blogHero"><span className="eyebrow">LinkoTech Journal</span><h1>Engineering software, AI, and digital workflows.</h1><p>Technical articles, engineering workflows, calculator launches, practical examples, and product thinking for structural engineers.</p></section>
  <section className="blogGrid" aria-live="polite">{posts.map(post=><article className="blogCard richBlogCard" key={post.id}>{post.cover_image_url&&<img className="blogCardCover" src={post.cover_image_url} alt={post.title} />}<div className="meta">{post.author_name||"LinkoTech"} · {new Date(post.published_at||post.created_at).toLocaleDateString()}</div><h2>{post.title}</h2><p>{post.excerpt||post.body.replace(/<[^>]+>/g,"").slice(0,180)+(post.body.length>180?"…":"")}</p>{!!post.tags?.length&&<div className="blogCardTags">{post.tags.slice(0,3).map(t=><span key={t}>#{t}</span>)}</div>}<a className="readLink" href={post.slug?`/blog/${post.slug}`:"/blog"}>Read Article →</a></article>)}{!posts.length&&<article className="blogCard"><div className="meta">LinkoTech Journal</div><h2>Publishing workspace ready</h2><p>{status}</p><a className="readLink" href="/blog/login">Employee Workspace →</a></article>}</section>
 </main>;
}

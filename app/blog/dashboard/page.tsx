"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase-browser";

type Post = { id: string; title: string; status: string; created_at: string };
const LINKEDIN_COMPANY = "https://www.linkedin.com/company/10945024";
const W_SECTION = "https://wsection.linkoteq.com/";

export default function BlogDashboard() {
  const router = useRouter();
  const [posts,setPosts]=useState<Post[]>([]); const [title,setTitle]=useState(""); const [excerpt,setExcerpt]=useState(""); const [body,setBody]=useState("");
  const [author,setAuthor]=useState(""); const [status,setStatus]=useState("Checking access…"); const [cover,setCover]=useState(""); const [video,setVideo]=useState("");
  const [tags,setTags]=useState(""); const [seoTitle,setSeoTitle]=useState(""); const [seoDescription,setSeoDescription]=useState("");
  const [calculatorName,setCalculatorName]=useState("W-Section"); const [calculatorUrl,setCalculatorUrl]=useState(W_SECTION); const [linkedinCopy,setLinkedinCopy]=useState("");
  const [scheduledAt,setScheduledAt]=useState("");

  const slug=useMemo(()=>title.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"").slice(0,90),[title]);
  const suggestedLinkedIn=useMemo(()=>`${title || "New engineering article"}\n\n${excerpt || "Practical engineering insight from LinkoTech."}${calculatorUrl ? `\n\nTry ${calculatorName}: ${calculatorUrl}`:""}\n\n#StructuralEngineering #EngineeringTechnology #LinkoTech`,[title,excerpt,calculatorName,calculatorUrl]);

  async function load(){ const supabase=getSupabase(); if(!supabase)return setStatus("Supabase is not configured."); const {data:auth}=await supabase.auth.getUser(); if(!auth.user)return router.replace("/blog/login"); setAuthor((auth.user.user_metadata?.full_name as string)||auth.user.email||"LinkoTech"); const {data,error}=await supabase.from("blog_posts").select("id,title,status,created_at").order("created_at",{ascending:false}); if(error)setStatus(error.message);else{setPosts((data as Post[])||[]);setStatus("");}}
  useEffect(()=>{void load();},[]);

  async function save(event:FormEvent,publish:boolean){event.preventDefault();const supabase=getSupabase();if(!supabase)return setStatus("Supabase is not configured.");const {data:auth}=await supabase.auth.getUser();if(!auth.user)return router.replace("/blog/login");setStatus(publish?"Publishing…":"Saving draft…");const {error}=await supabase.from("blog_posts").insert({title:title.trim(),excerpt:excerpt.trim()||null,body:body.trim(),author_id:auth.user.id,author_name:author,status:publish?"published":"draft",published_at:publish?new Date().toISOString():null,slug:slug||null,cover_image_url:cover.trim()||null,video_url:video.trim()||null,tags:tags.split(",").map(x=>x.trim()).filter(Boolean),seo_title:seoTitle.trim()||title.trim()||null,seo_description:seoDescription.trim()||excerpt.trim()||null,calculator_name:calculatorName.trim()||null,calculator_url:calculatorUrl.trim()||null,linkedin_copy:(linkedinCopy.trim()||suggestedLinkedIn)||null,scheduled_at:scheduledAt?new Date(scheduledAt).toISOString():null});if(error)return setStatus(error.message);setTitle("");setExcerpt("");setBody("");setCover("");setVideo("");setTags("");setSeoTitle("");setSeoDescription("");setLinkedinCopy("");setScheduledAt("");setStatus(publish?"Published.":"Draft saved.");await load();}
  async function logout(){const supabase=getSupabase();if(supabase)await supabase.auth.signOut();router.replace("/blog/login");}
  async function copyLinkedIn(){await navigator.clipboard.writeText(linkedinCopy.trim()||suggestedLinkedIn);setStatus("LinkedIn post copied.");}

  return <main className="dashboard">
    <div className="dashboardTop"><a href="/"><Image src="/linkotech-logo.svg" alt="LinkoTech" width={250} height={64} priority /></a><div><a href="/blog" style={{marginRight:16}}>View Blog</a><a href={LINKEDIN_COMPANY} target="_blank" rel="noreferrer" style={{marginRight:16}}>LinkoTech LinkedIn</a><button onClick={logout} className="navCta">Log out</button></div></div>
    <div className="dashboardGrid">
      <section className="dashboardPanel"><span className="eyebrow">Employee Workspace · Content Studio</span><h2>Create & market an engineering post</h2><form className="authForm" onSubmit={(e)=>save(e,true)}>
        <label>Title<input value={title} onChange={e=>setTitle(e.target.value)} required /></label>
        <label>Excerpt<input value={excerpt} onChange={e=>setExcerpt(e.target.value)} /></label>
        <label>Article body<textarea value={body} onChange={e=>setBody(e.target.value)} required style={{minHeight:260}} /></label>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><label>Cover image URL<input type="url" value={cover} onChange={e=>setCover(e.target.value)} placeholder="https://..." /></label><label>Video URL<input type="url" value={video} onChange={e=>setVideo(e.target.value)} placeholder="YouTube / Vimeo / hosted video" /></label></div>
        <label>Tags / topics<input value={tags} onChange={e=>setTags(e.target.value)} placeholder="steel, structural engineering, CSA S16" /></label>
        <fieldset style={{border:"1px solid #d8dee8",borderRadius:12,padding:16}}><legend>SEO</legend><label>SEO title<input value={seoTitle} onChange={e=>setSeoTitle(e.target.value)} placeholder={title||"Search title"} /></label><label>Meta description<textarea value={seoDescription} onChange={e=>setSeoDescription(e.target.value)} placeholder={excerpt||"Search description"} /></label><small>Slug: /blog/{slug||"article-slug"}</small></fieldset>
        <fieldset style={{border:"1px solid #d8dee8",borderRadius:12,padding:16}}><legend>Calculator marketing</legend><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><label>Tool name<input value={calculatorName} onChange={e=>setCalculatorName(e.target.value)} /></label><label>Tool URL<input type="url" value={calculatorUrl} onChange={e=>setCalculatorUrl(e.target.value)} /></label></div><p style={{margin:"8px 0 0"}}>Use this CTA inside the article to move readers directly from engineering content to the calculator.</p></fieldset>
        <fieldset style={{border:"2px solid #0a66c2",borderRadius:12,padding:16}}><legend>LinkedIn-first marketing</legend><label>LinkedIn post<textarea value={linkedinCopy} onChange={e=>setLinkedinCopy(e.target.value)} placeholder={suggestedLinkedIn} style={{minHeight:160}} /></label><div style={{display:"flex",gap:10,flexWrap:"wrap"}}><button type="button" onClick={()=>setLinkedinCopy(suggestedLinkedIn)}>Generate LinkedIn Draft</button><button type="button" onClick={copyLinkedIn}>Copy LinkedIn Post</button><a className="navCta" href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Flinkoteq.com%2Fblog" target="_blank" rel="noreferrer">Open LinkedIn Share</a></div></fieldset>
        <label>Schedule (optional)<input type="datetime-local" value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)} /></label>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}><button type="button" onClick={e=>save(e as unknown as FormEvent,false)}>Save draft</button><button type="submit">Publish post</button></div>
      </form>{status&&<div className="authStatus">{status}</div>}
      <div style={{marginTop:18,padding:16,border:"1px dashed #aab4c4",borderRadius:12}}><strong>AI-ready, lightweight architecture</strong><p style={{marginBottom:0}}>AI writing actions are intentionally not executed in the browser. The studio is ready for a server-side API route later, so an API key never ships to visitors and no AI model runs on your Vercel instance.</p></div></section>
      <aside className="dashboardPanel"><h2>Recent posts</h2><p>LinkedIn is the primary distribution channel. Each article can carry a calculator CTA, SEO metadata, media links, and ready-to-copy LinkedIn copy.</p><div className="postList">{posts.map(p=><div className="postRow" key={p.id}><strong>{p.title}</strong><span>{p.status} · {new Date(p.created_at).toLocaleDateString()}</span></div>)}{!posts.length&&<p>No posts yet.</p>}</div></aside>
    </div>
  </main>;
}

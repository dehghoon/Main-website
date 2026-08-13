"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabase } from "@/lib/supabase-browser";

type Article={title:string;excerpt:string|null;body:string;author_name:string|null;show_author_name:boolean;published_at:string|null;created_at:string;cover_image_url:string|null;video_url:string|null;cover_image_alt:string|null;cover_image_title:string|null;cover_image_caption:string|null;cover_image_meta:string|null;cover_image_position:string|null;cover_image_size:string|null;video_title:string|null;video_caption:string|null;video_thumbnail_url:string|null;video_meta:string|null;tags:string[];calculator_name:string|null;calculator_url:string|null;seo_title:string|null;seo_description:string|null;linkedin_copy:string|null};

type DestinationKind="linkedin-page"|"linkedin-group"|"facebook-page"|"facebook-group";
const DESTINATION_LABELS:Record<DestinationKind,string>={
 "linkedin-page":"LinkedIn Page / Company URL",
 "linkedin-group":"LinkedIn Group URL",
 "facebook-page":"Facebook Page URL",
 "facebook-group":"Facebook Group URL"
};

export default function ArticleClient(){
 const params=useParams<{slug:string}>(); const [article,setArticle]=useState<Article|null>(null); const [status,setStatus]=useState("Loading article…"); const [copied,setCopied]=useState("");
 useEffect(()=>{const s=getSupabase();if(!s)return setStatus("Article service is unavailable.");void s.from("blog_posts").select("title,excerpt,body,author_name,show_author_name,published_at,created_at,cover_image_url,video_url,cover_image_alt,cover_image_title,cover_image_caption,cover_image_meta,cover_image_position,cover_image_size,video_title,video_caption,video_thumbnail_url,video_meta,tags,calculator_name,calculator_url,seo_title,seo_description,linkedin_copy").eq("slug",params.slug).eq("status","published").single().then(({data,error})=>{if(error||!data)setStatus("Article not found.");else{setArticle(data as Article);setStatus("");}});},[params.slug]);
 if(!article)return <main className="publicArticle"><p>{status}</p></main>;
 const canonicalUrl=`https://www.linkoteq.com/blog/${params.slug}`;
 const shareVersion=encodeURIComponent(article.published_at||article.created_at);
 const shareUrl=`${canonicalUrl}?share=${shareVersion}`;
 const socialCopy=(article.linkedin_copy||`${article.title}\n\n${article.excerpt||""}\n\n#LinkoTech #Engineering #StructuralEngineering`).trim();
 const socialPayload=`${socialCopy}\n\n${canonicalUrl}`;
 const encodedShareUrl=encodeURIComponent(shareUrl); const socialText=encodeURIComponent(`${socialCopy}\n\n${shareUrl}`); const titleText=encodeURIComponent(article.title);
 async function copyLink(){await navigator.clipboard.writeText(canonicalUrl);setCopied("Link copied");setTimeout(()=>setCopied(""),1800);}
 async function copySocial(){await navigator.clipboard.writeText(socialPayload);setCopied("Social media post copied");setTimeout(()=>setCopied(""),1800);}
 async function openWithCopy(destination:string,message:string){await navigator.clipboard.writeText(socialPayload);setCopied(message);window.open(destination,"_blank","noopener,noreferrer");setTimeout(()=>setCopied(""),3000);}
 async function shareLinkedIn(){await openWithCopy(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedShareUrl}`,"Post copied — paste it into LinkedIn");}
 async function shareFacebook(){await openWithCopy(`https://www.facebook.com/sharer/sharer.php?u=${encodedShareUrl}`,"Post copied — choose the Facebook destination available to your account");}
 function normalizeDestination(kind:DestinationKind,value:string){
  const raw=value.trim(); if(!raw)return null;
  try{const u=new URL(raw);const host=u.hostname.replace(/^www\./,"");const needsLinkedIn=kind.startsWith("linkedin");const ok=needsLinkedIn?host==="linkedin.com":host==="facebook.com"||host==="m.facebook.com";return ok?u.toString():null;}catch{return null;}
 }
 async function shareToDestination(kind:DestinationKind){
  const key=`linkotech-share-${kind}`;
  const saved=typeof window!=="undefined"?localStorage.getItem(key)||"":"";
  const entered=window.prompt(`${DESTINATION_LABELS[kind]}\n\nPaste the exact Page, Company, or Group URL you can post to. This is saved only on this device.`,saved);
  if(entered===null)return;
  const destination=normalizeDestination(kind,entered);
  if(!destination){setCopied(`Please enter a valid ${kind.startsWith("linkedin")?"LinkedIn":"Facebook"} URL.`);setTimeout(()=>setCopied(""),2600);return;}
  localStorage.setItem(key,destination);
  await openWithCopy(destination,"Post copied — destination opened. Start a post there and paste the approved marketing copy.");
 }
 async function shareInstagram(){await navigator.clipboard.writeText(socialPayload);setCopied("Instagram caption copied");setTimeout(()=>setCopied(""),1800);}
 return <main className="publicArticle">
  <a className="articleBrand" href="/"><Image src="/linkotech-logo.svg" alt="LinkoTech" width={230} height={58} priority /></a>
  <article className="articleShell">
   {article.cover_image_url&&<figure className={`mediaFigure media-${article.cover_image_size||"wide"} media-${article.cover_image_position||"center"}`}><img src={article.cover_image_url} alt={article.cover_image_alt||article.title} title={article.cover_image_title||undefined}/>{article.cover_image_caption&&<figcaption>{article.cover_image_caption}</figcaption>}{article.cover_image_meta&&<div className="articleMediaMeta">{article.cover_image_meta}</div>}</figure>}
   <div className="articleMeta">{article.show_author_name&&article.author_name?<>{article.author_name} · </>:null}{new Date(article.published_at||article.created_at).toLocaleDateString()}</div><h1>{article.title}</h1>{article.excerpt&&<p className="articleLead">{article.excerpt}</p>}
   <div className="articleRichBody" dangerouslySetInnerHTML={{__html:article.body}} />
   {article.video_url&&<figure className="mediaBlock videoBlock">{article.video_thumbnail_url&&<img src={article.video_thumbnail_url} alt={article.video_title||"Video thumbnail"}/>}<div className="videoLinkCard"><strong>{article.video_title||"Related video"}</strong>{article.video_caption&&<p>{article.video_caption}</p>}<a href={article.video_url} target="_blank" rel="noreferrer">Watch video →</a>{article.video_meta&&<span className="articleMediaMeta">{article.video_meta}</span>}</div></figure>}
   {article.calculator_url&&<section className="articleToolCta"><div><span>Related engineering tool</span><h2>{article.calculator_name||"LinkoTech Calculator"}</h2><p>Continue from the article into the interactive engineering workflow.</p></div><a href={article.calculator_url} target="_blank" rel="noreferrer">Try the Calculator →</a></section>}
   {!!article.tags?.length&&<div className="articleTags">{article.tags.map(t=><span key={t}>#{t}</span>)}</div>}
   <section className="sharePanel">
    <div className="sharePanelTitle"><div><strong>Share this article</strong><span>Uses the approved Social Media Marketing copy</span></div></div>
    <div className="socialSharePreview">
      {article.cover_image_url?<div className="socialShareMedia"><img src={article.cover_image_url} alt={article.cover_image_alt||article.title}/></div>:<div className="socialShareMedia socialShareMediaEmpty">LinkoTech</div>}
      <div className="socialShareCopy"><span className="socialShareDomain">linkoteq.com</span><h3>{article.title}</h3><p>{socialCopy}</p></div>
    </div>
    <div className="socialCopyBar"><div><strong>{article.title}</strong><p>{socialCopy}</p><span>{canonicalUrl}</span></div><button type="button" onClick={copySocial}>Copy</button></div>

    <div className="shareDestinationGroup"><strong>LinkedIn</strong><div className="shareButtons shareButtonsPrimary"><button type="button" className="linkedinShare" onClick={shareLinkedIn}>Profile</button><button type="button" onClick={()=>shareToDestination("linkedin-page")}>Page / Company</button><button type="button" onClick={()=>shareToDestination("linkedin-group")}>Group</button></div><small>For Page / Company or Group, paste the destination URL once; it is remembered on this device.</small></div>
    <div className="shareDestinationGroup"><strong>Facebook</strong><div className="shareButtons shareButtonsPrimary"><button type="button" onClick={shareFacebook}>Profile / Share Dialog</button><button type="button" onClick={()=>shareToDestination("facebook-page")}>Page</button><button type="button" onClick={()=>shareToDestination("facebook-group")}>Group</button></div><small>Page and Group buttons open the exact destination you enter, avoiding broken generic Facebook URLs.</small></div>

    <div className="shareButtons shareButtonsPrimary"><a href={`https://twitter.com/intent/tweet?text=${socialText}`} target="_blank" rel="noreferrer">X</a><a href={`https://t.me/share/url?url=${encodedShareUrl}&text=${encodeURIComponent(socialCopy)}`} target="_blank" rel="noreferrer">Telegram</a></div>
    <div className="shareButtons shareButtonsSecondary"><a href={`https://www.reddit.com/submit?url=${encodedShareUrl}&title=${titleText}`} target="_blank" rel="noreferrer">Reddit</a><a href={`mailto:?subject=${titleText}&body=${socialText}`}>Email</a><button type="button" onClick={shareInstagram}>Instagram Caption</button><button type="button" onClick={copyLink}>Copy Link</button></div>
    {copied&&<div className="shareFeedback">{copied}</div>}
   </section>
  </article>
 </main>;
}

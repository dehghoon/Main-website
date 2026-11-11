import type { Metadata } from "next";
import ArticleClient, { type Article } from "./article-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props={params:Promise<{slug:string}>};
type MetaArticle={title:string;excerpt:string|null;seo_title:string|null;seo_description:string|null;cover_image_url:string|null;cover_image_alt:string|null};

async function getArticle(slug:string):Promise<MetaArticle|null>{
 const base=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!base||!anon)return null;
 const query=new URLSearchParams({slug:`eq.${slug}`,status:"eq.published",select:"title,excerpt,seo_title,seo_description,cover_image_url,cover_image_alt",limit:"1"});
 try{
  const r=await fetch(`${base}/rest/v1/blog_posts?${query.toString()}`,{
   headers:{apikey:anon,Authorization:`Bearer ${anon}`},
   cache:"no-store"
  });
  if(!r.ok)return null;
  const rows=await r.json();
  return rows?.[0]||null;
 }catch{return null;}
}

export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {slug}=await params;
 const article=await getArticle(slug);
 const canonical=`https://www.linkoteq.com/blog/${slug}`;
 if(!article){
  return {
   metadataBase:new URL("https://www.linkoteq.com"),
   title:"LinkoTech Blog",
   description:"Engineering insight from LinkoTech.",
   alternates:{canonical},
   openGraph:{type:"article",url:canonical,siteName:"LinkoTech",title:"LinkoTech Blog",description:"Engineering insight from LinkoTech."},
   twitter:{card:"summary",title:"LinkoTech Blog",description:"Engineering insight from LinkoTech."}
  };
 }
 const title=article.seo_title||article.title;
 const description=article.seo_description||article.excerpt||"Engineering insight from LinkoTech.";
 const image=article.cover_image_url?.trim()||undefined;
 const alt=article.cover_image_alt||article.title;
 return {
  metadataBase:new URL("https://www.linkoteq.com"),
  title:`${title} | LinkoTech`,
  description,
  alternates:{canonical},
  openGraph:{
   type:"article",
   url:canonical,
   siteName:"LinkoTech",
   title,
   description,
   images:image?[{url:image,width:1200,height:630,alt,type:"image/jpeg"}]:undefined
  },
  twitter:{card:image?"summary_large_image":"summary",title,description,images:image?[image]:undefined},
  other:image?{"telegram:image":image}:undefined
 };
}


const ARTICLE_COLUMNS="title,excerpt,body,author_name,show_author_name,published_at,created_at,cover_image_url,video_url,cover_image_alt,cover_image_title,cover_image_caption,cover_image_meta,cover_image_position,cover_image_size,video_title,video_caption,video_thumbnail_url,video_meta,tags,calculator_name,calculator_url,seo_title,seo_description,linkedin_copy";
async function getFullArticle(slug:string):Promise<Article|null>{
 if(!/^[a-z0-9-]+$/.test(slug))return null;
 const base=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!base||!anon)return null;
 const query=new URLSearchParams({slug:`eq.${slug}`,status:"eq.published",select:ARTICLE_COLUMNS,limit:"1"});
 try{
  const response=await fetch(`${base}/rest/v1/blog_posts?${query.toString()}`,{headers:{apikey:anon,Authorization:`Bearer ${anon}`},cache:"no-store"});
  if(!response.ok)return null;
  const rows=await response.json();
  return rows?.[0]||null;
 }catch{return null;}
}

export default async function ArticlePage({params}:Props){
 const {slug}=await params;
 const article=await getFullArticle(slug);
 if(!article)return <ArticleClient initialArticle={null}/>;
 const canonical=`https://www.linkoteq.com/blog/${slug}`;
 const structuredData={
  "@context":"https://schema.org",
  "@type":"BlogPosting",
  headline:article.title,
  description:article.seo_description||article.excerpt||undefined,
  mainEntityOfPage:{"@type":"WebPage","@id":canonical},
  url:canonical,
  author:{"@type":"Organization",name:"Linkoteq",url:"https://www.linkoteq.com"},
  publisher:{"@type":"Organization",name:"Linkoteq",url:"https://www.linkoteq.com"},
  ...(article.cover_image_url?{image:[article.cover_image_url]}:{}),
  ...(article.published_at?{datePublished:article.published_at}:{}),
 };
 return <>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData).replace(/</g,"\\\\u003c")}} />
  <ArticleClient initialArticle={article}/>
 </>;
}

import type { Metadata } from "next";
import ArticleClient from "./article-client";

type Props={params:Promise<{slug:string}>};
type MetaArticle={title:string;excerpt:string|null;seo_title:string|null;seo_description:string|null;cover_image_url:string|null};

async function getArticle(slug:string):Promise<MetaArticle|null>{
 const base=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!base||!anon)return null;
 const query=new URLSearchParams({slug:`eq.${slug}`,status:"eq.published",select:"title,excerpt,seo_title,seo_description,cover_image_url",limit:"1"});
 try{
  const r=await fetch(`${base}/rest/v1/blog_posts?${query.toString()}`,{headers:{apikey:anon,Authorization:`Bearer ${anon}`},next:{revalidate:300}});
  if(!r.ok)return null;
  const rows=await r.json();
  return rows?.[0]||null;
 }catch{return null;}
}

export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {slug}=await params;
 const article=await getArticle(slug);
 const canonical=`https://www.linkoteq.com/blog/${slug}`;
 if(!article)return {title:"LinkoTech Blog",alternates:{canonical}};
 const title=article.seo_title||article.title;
 const description=article.seo_description||article.excerpt||"Engineering insight from LinkoTech.";
 const image=article.cover_image_url||undefined;
 return {
  metadataBase:new URL("https://www.linkoteq.com"),
  title:`${title} | LinkoTech`,
  description,
  alternates:{canonical},
  openGraph:{type:"article",url:canonical,siteName:"LinkoTech",title,description,images:image?[{url:image,alt:article.title}]:undefined},
  twitter:{card:image?"summary_large_image":"summary",title,description,images:image?[image]:undefined}
 };
}

export default async function ArticlePage({params}:Props){
 await params;
 return <ArticleClient/>;
}

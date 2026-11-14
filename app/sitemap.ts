import type { MetadataRoute } from "next";
import { PUBLIC_TOOLS, SITE_ORIGIN, toolPreviewPath } from "@/lib/tool-discovery";

export const dynamic = "force-dynamic";
const origin = SITE_ORIGIN;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {url:origin+"/",changeFrequency:"monthly",priority:1},
    {url:origin+"/blog",changeFrequency:"daily",priority:0.9},
    {url:origin+"/news",changeFrequency:"weekly",priority:0.7},
    {url:origin+"/pricing",changeFrequency:"monthly",priority:0.5},
    {url:origin+"/tools",changeFrequency:"monthly",priority:0.8},
    ...PUBLIC_TOOLS.map(tool => ({url: origin + toolPreviewPath(tool), changeFrequency: "monthly" as const, priority: 0.7})),
  ];
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return entries;
  const query = new URLSearchParams({select:"slug,published_at",status:"eq.published",order:"published_at.desc",limit:"1000"});
  try {
    const response = await fetch(`${base}/rest/v1/blog_posts?${query}`,{headers:{apikey:key,Authorization:`Bearer ${key}`},cache:"no-store"});
    if (!response.ok) return entries;
    const posts = await response.json() as Array<{slug:string|null;published_at:string|null}>;
    for (const post of posts) {
      if (!post.slug || !/^[a-z0-9-]+$/.test(post.slug)) continue;
      entries.push({url:`${origin}/blog/${post.slug}`,...(post.published_at?{lastModified:new Date(post.published_at)}:{}),changeFrequency:"monthly",priority:0.7});
    }
  } catch { /* Keep static routes available when CMS is unreachable. */ }
  return entries;
}

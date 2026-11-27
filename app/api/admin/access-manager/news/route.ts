import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { commandCenterError, requireCommandCenterOwner } from "@/lib/command-center/server";

import { getNewsFeed } from "@/lib/news-feed";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", Vary: "Authorization" };

export async function GET(request: NextRequest) {
  try {
    await requireCommandCenterOwner(request.headers.get("authorization"));

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      const published = await getNewsFeed();
      if (!published) throw new Error("news_storage_unavailable");
      const reports = published.slice(0, 20).map(card => ({
        id: card.slug, title: card.title, subtitle: card.summary,
        source_url: card.sourceUrl, created_at: card.date,
        publications: card.links.map(link => ({
          platform: link.platform, status: "published", external_post_url: link.url,
        })),
        website: { video_links: Object.fromEntries(card.videoLinks.map(link => [link.platform, link.url])) },
      }));
      return NextResponse.json({ reports, publishedOnly: true }, { headers });
    }

    const db = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const assets = await db.from("ai_news_social_assets")
      .select("id,title,subtitle,source_url,created_at,creative_status,image_status,creative_brief")
      .order("created_at", { ascending: false }).order("id").limit(20);
    if (assets.error) throw assets.error;
    if (!assets.data.length) return NextResponse.json({ reports: [] }, { headers });

    const ids = assets.data.map(asset => asset.id);
    const [publications, website] = await Promise.all([
      db.from("ai_news_social_publications")
        .select("asset_id,platform,status,caption,external_post_url,published_at")
        .in("asset_id", ids),
      db.from("ai_news_website_feed")
        .select("asset_id,slug,summary,social_links,video_links")
        .in("asset_id", ids),
    ]);
    if (publications.error || website.error) throw new Error("news_outputs_unavailable");
    const reports = assets.data.map(asset => ({
      ...asset,
      publications: publications.data.filter(item => item.asset_id === asset.id),
      website: website.data.find(item => item.asset_id === asset.id) ?? null,
    }));
    return NextResponse.json({ reports }, { headers });
  } catch (error) {
    const result = commandCenterError(error);
    return NextResponse.json({ error: result.error }, { status: result.status, headers });
  }
}

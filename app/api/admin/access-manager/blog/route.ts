import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { commandCenterError, requireCommandCenterOwner } from "@/lib/command-center/server";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", Vary: "Authorization" };

export async function GET(request: NextRequest) {
  try {
    await requireCommandCenterOwner(request.headers.get("authorization"));

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const privateKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const key = privateKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("blog_storage_unavailable");

    const db = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const now = new Date().toISOString();
    const columns = "id,title,slug,excerpt,status,created_at,published_at,cover_image_url";
    const [published, drafts] = await Promise.all([
      db.from("blog_posts").select(columns).eq("status", "published")
        .lte("published_at", now).order("published_at", { ascending: false }).order("id").limit(20),
      privateKey
        ? db.from("blog_posts").select(columns).eq("status", "draft")
          .order("created_at", { ascending: false }).order("id").limit(20)
        : Promise.resolve({ data: null, error: null }),
    ]);
    if (published.error || drafts.error) throw new Error("blog_reports_unavailable");

    const summarize = (post: NonNullable<typeof published.data>[number]) => {
      const { cover_image_url, ...metadata } = post;
      return { ...metadata, hasCover: Boolean(cover_image_url) };
    };
    const social = privateKey && published.data.length
      ? await db.from("blog_social_publications")
        .select("id,post_id,platform,status,due_at,external_post_id")
        .in("post_id", published.data.map(post => post.id))
        .order("platform")
      : null;
    return NextResponse.json({
      social: privateKey && !social?.error ? social?.data ?? [] : null,
      published: published.data.map(summarize),
      drafts: drafts.data?.map(summarize) ?? null,
    }, { headers });
  } catch (error) {
    const result = commandCenterError(error);
    return NextResponse.json({ error: result.error }, { status: result.status, headers });
  }
}

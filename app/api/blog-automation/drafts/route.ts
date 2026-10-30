import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function authorized(actual: string | null, expected: string): boolean {
  if (!actual?.startsWith("Bearer ") || !expected) return false;
  const a = createHash("sha256").update(actual.slice(7)).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: NextRequest) {
  const secret = process.env.BLOG_AUTOMATION_SECRET || "";
  if (!authorized(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const author = process.env.BLOG_AUTOMATION_AUTHOR_ID;
  if (!url || !key || !author) {
    return NextResponse.json({ error: "Automation is not configured" }, { status: 503 });
  }
  let input: Record<string, unknown>;
  try { input = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const title = clean(input.title, 180);
  const body = clean(input.body_html, 100000);
  const slug = clean(input.slug, 90);
  if (!title || !body || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return NextResponse.json({ error: "Valid title, body_html and slug are required" }, { status: 400 });
  }
  const imageUrl = clean(input.cover_image_url, 2000);
  if (imageUrl && (!imageUrl.startsWith("https://") || !/^https:\/\/[^\s]+$/.test(imageUrl))) {
    return NextResponse.json({ error: "Image must be a public HTTPS URL" }, { status: 400 });
  }
  const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: existing, error: lookupError } = await client.from("blog_posts").select("id,status").eq("slug", slug).maybeSingle();
  if (lookupError) return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  if (existing) return NextResponse.json({ id: existing.id, status: existing.status, duplicate: true }, { status: 200 });
  const tags = Array.isArray(input.tags) ? input.tags.filter((x): x is string => typeof x === "string").slice(0, 8).map(x => x.slice(0, 40)) : [];
  const { data, error } = await client.from("blog_posts").insert({
    title, body, slug, author_id: author, status: "draft", published_at: null,
    excerpt: clean(input.excerpt, 500) || null,
    seo_title: clean(input.seo_title, 80) || title,
    seo_description: clean(input.seo_description, 180) || null,
    linkedin_copy: clean(input.linkedin_copy, 3000) || null,
    cover_image_url: imageUrl || null,
    cover_image_alt: clean(input.cover_image_alt, 200) || null,
    cover_image_caption: clean(input.cover_image_caption, 400) || null,
    cover_image_size: "wide", cover_image_position: "center", tags,
  }).select("id,status,slug").single();
  if (error?.code === "23505") return NextResponse.json({ error: "Duplicate slug" }, { status: 409 });
  if (error) return NextResponse.json({ error: "Draft could not be saved" }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

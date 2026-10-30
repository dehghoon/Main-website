import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
const MAX_BYTES = 150_000;
const allowedImageHosts = new Set((process.env.BLOG_AGENT_IMAGE_HOSTS || "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean));
function fail(error: string, status: number) { return NextResponse.json({ error }, { status }); }
function authenticated(req: NextRequest) {
  const supplied = req.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  const expectedHash = process.env.BLOG_AGENT_TOKEN_SHA256;
  if (!supplied || !expectedHash || !/^[a-f0-9]{64}$/i.test(expectedHash)) return false;
  const actual = createHash("sha256").update(supplied).digest();
  return timingSafeEqual(actual, Buffer.from(expectedHash, "hex"));
}
function safeImage(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string") throw new Error("Invalid image URL");
  const url = new URL(value);
  if (url.protocol !== "https:" || !allowedImageHosts.has(url.hostname.toLowerCase())) throw new Error("Image host not allowed");
  return url.toString();
}
export async function POST(req: NextRequest) {
  if (process.env.BLOG_AGENT_ENABLED !== "true") return NextResponse.json({ error: "Integration disabled" }, { status: 503 });
  if (!authenticated(req)) return fail("Unauthorized", 401);
  const length = Number(req.headers.get("content-length") || 0);
  if (length > MAX_BYTES) return fail("Payload too large", 413);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const authorId = process.env.BLOG_AGENT_AUTHOR_ID;
  if (!url || !key || !authorId) return fail("Blog integration not configured", 503);
  let input: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (Buffer.byteLength(raw) > MAX_BYTES) return fail("Payload too large", 413);
    input = JSON.parse(raw);
    if (!input || typeof input !== "object" || Array.isArray(input)) return fail("Invalid payload", 400);
  } catch { return fail("Invalid JSON", 400); }
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const body = typeof input.body_html === "string" ? input.body_html.trim() : "";
  const externalId = typeof input.external_id === "string" ? input.external_id.trim() : "";
  if (!title || title.length > 180 || !body || body.length > 100_000 || !/^[a-zA-Z0-9_-]{8,100}$/.test(externalId)) return fail("Invalid title, body or external_id", 400);
  // HTML is treated as untrusted. Renderers must sanitize before display.
  if (/<script\b|\bon\w+\s*=|javascript:|<iframe\b/i.test(body)) return fail("Unsafe HTML", 400);
  let image: string | null;
  try { image = safeImage(input.cover_image_url); } catch { return fail("Image must use an approved HTTPS host", 400); }
  const text = (name: string, max: number) => typeof input[name] === "string" ? (input[name] as string).slice(0, max).trim() || null : null;
  const slug = ("agent-" + externalId.toLowerCase()).slice(0, 110);
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: existing, error: readError } = await supabase.from("blog_posts").select("id,status,slug").eq("slug", slug).maybeSingle();
  if (readError) return fail("Database lookup failed", 502);
  if (existing) return NextResponse.json({ id: existing.id, status: existing.status, slug: existing.slug, duplicate: true });
  const payload = {
    title, body, slug, author_id: authorId, status: "draft", published_at: null,
    excerpt: text("excerpt", 1000), seo_title: text("seo_title", 180),
    seo_description: text("seo_description", 400), linkedin_copy: text("social_media_copy", 4000),
    cover_image_url: image, cover_image_alt: text("image_alt", 300),
    cover_image_title: text("image_title", 300), cover_image_caption: text("image_caption", 1000),
    cover_image_meta: text("image_meta", 1000),
    tags: Array.isArray(input.tags) ? input.tags.filter((x): x is string => typeof x === "string").slice(0, 12).map(x => x.slice(0, 60)) : [],
  };
  const { data, error } = await supabase.from("blog_posts").insert(payload).select("id,status,slug").single();
  if (error) return fail("Draft could not be saved", 502);
  return NextResponse.json({ ...data, duplicate: false }, { status: 201 });
}

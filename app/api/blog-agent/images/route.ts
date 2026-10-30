import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
function authorized(req: NextRequest): boolean {
  const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  const hash = process.env.BLOG_AGENT_TOKEN_SHA256;
  if (!token || !hash || !/^[0-9a-f]{64}$/i.test(hash)) return false;
  return timingSafeEqual(createHash("sha256").update(token).digest(), Buffer.from(hash, "hex"));
}
function format(data: Buffer): { ext: string; mime: string } | null {
  if (data.length >= 3 && data.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return { ext: "jpg", mime: "image/jpeg" };
  if (data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return { ext: "png", mime: "image/png" };
  if (data.length >= 12 && data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP") return { ext: "webp", mime: "image/webp" };
  return null;
}
export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  const length = Number(req.headers.get("content-length") || 0);
  if (length > MAX_IMAGE_BYTES) return NextResponse.json({ error: "Image too large" }, { status: 413 });
  // Reject requests without an expected image MIME; actual magic bytes are also checked.
  const declared = req.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (!["image/jpeg", "image/png", "image/webp"].includes(declared || "")) return NextResponse.json({ error: "Unsupported image MIME" }, { status: 415 });
  const bytes = Buffer.from(await req.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) return NextResponse.json({ error: "Image size invalid" }, { status: 413 });
  const kind = format(bytes);
  if (!kind || kind.mime !== declared) return NextResponse.json({ error: "Image signature mismatch" }, { status: 415 });
  // Media must be optimized by the caller. Additional decoding, dimensions and content scanning
  // are mandatory release gates before enabling production use.
  const path = `agent/${randomUUID()}.${kind.ext}`;
  const storage = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }).storage.from("blog-media");
  const { error } = await storage.upload(path, bytes, { contentType: kind.mime, upsert: false, cacheControl: "3600" });
  if (error) return NextResponse.json({ error: "Storage upload failed" }, { status: 502 });
  const { data } = storage.getPublicUrl(path);
  return NextResponse.json({ image_url: data.publicUrl, path, mime: kind.mime }, { status: 201 });
}

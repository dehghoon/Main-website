const sourceHosts = new Set(["linkoteq.com", "www.linkoteq.com"]);
const storageHost = "xssiwlwlsyxrwdbninqe.supabase.co";
const platformHosts = {
  linkedin: ["linkedin.com", "www.linkedin.com"],
  instagram: ["instagram.com", "www.instagram.com"],
  facebook: ["facebook.com", "www.facebook.com", "m.facebook.com"],
} as const;

export const platforms = ["linkedin", "instagram", "facebook"] as const;
export const platformLabels = { linkedin: "LinkedIn", instagram: "Instagram", facebook: "Facebook" };

function secureUrl(value: unknown): URL | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.port ? url : null;
  } catch {
    return null;
  }
}

export function parseNewsCard(data: unknown) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const row = data as Record<string, unknown>;
  const { slug, title, summary, image_alt: imageAlt, published_at: date } = row;
  if (typeof slug !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) ||
      typeof title !== "string" || !title.trim() || typeof summary !== "string" || !summary.trim() ||
      typeof imageAlt !== "string" || !imageAlt.trim() || typeof date !== "string" ||
      !Number.isFinite(Date.parse(date)) || Date.parse(date) > Date.now()) return null;

  const source = secureUrl(row.source_url);
  const image = secureUrl(row.image_url);
  if (!source || !image || !/\.jpe?g$/i.test(image.pathname)) return null;
  const websiteImage = sourceHosts.has(image.hostname) && image.pathname.startsWith("/marketing/");
  const storageImage = image.hostname === storageHost && image.pathname.startsWith("/storage/v1/object/public/blog-media/");
  if (!websiteImage && !storageImage) return null;

  const social = row.social_links;
  const urls = social && typeof social === "object" && !Array.isArray(social)
    ? social as Record<string, unknown> : {};
  const links = platforms.flatMap(platform => {
    const url = secureUrl(urls[platform]);
    const allowedHosts: readonly string[] = platformHosts[platform];
    return url && allowedHosts.includes(url.hostname) && url.pathname !== "/"
      ? [{ platform, url: url.href }] : [];
  });

  return { slug, title, summary, imageAlt, date, sourceUrl: source.href, imageUrl: image.href, links };
}

export async function getNewsFeed() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return null;

  const query = new URLSearchParams({
    select: "slug,title,summary,source_url,image_url,image_alt,social_links,published_at",
    order: "published_at.desc,slug.asc",
  });
  try {
    const response = await fetch(`${base}/rest/v1/ai_news_website_feed?${query}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const rows: unknown = await response.json();
    return Array.isArray(rows) ? rows.map(parseNewsCard).filter(card => card !== null) : null;
  } catch {
    return null;
  }
}

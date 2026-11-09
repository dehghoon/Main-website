import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/blog/login", "/blog/dashboard", "/api/"] }],
    sitemap: "https://www.linkoteq.com/sitemap.xml",
    host: "https://www.linkoteq.com",
  };
}

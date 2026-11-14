import { createElement } from "react";
import HeaderAuthBridge from "./components/header-auth-bridge";
import { headerAccountPath } from "@/lib/header-account";
import type { Metadata } from "next";
import "./globals.css";
import "./brand-extra.css";
import "./blog-cms.css";
import "./mobile-nav.css";
import "./global-header.css";
import "./3d-model-showcase.css";
import "./platform-refresh.css";
import "./site-surfaces.css";


export const metadata: Metadata = {
  title: "LinkoTech | Engineering Intelligence",
  description: "AI-powered engineering workflows, reusable calculation tools, and digital model intelligence.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <script defer src="/design-system/linkoteq-header-v1.js" />
        {/* Google tag (gtag.js) — shared by all website pages. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if (window.location.pathname !== ${JSON.stringify(headerAccountPath)}) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', 'G-P8NR3ZWDSQ');
  const tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=G-P8NR3ZWDSQ';
  document.head.appendChild(tag);
}`,
          }}
        />
      </head>
      <body>
        {createElement("linkoteq-header", { "public-tool-previews": "" })}
        <HeaderAuthBridge>{children}</HeaderAuthBridge>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import "./brand-extra.css";
import "./blog-cms.css";
import "./mobile-nav.css";
import "./global-header.css";
import "./3d-model-showcase.css";
import SiteHeader from "./components/site-header";

export const metadata: Metadata = {
  title: "LinkoTech | Engineering Intelligence",
  description: "AI-powered engineering workflows, reusable calculation tools, and digital model intelligence.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/* Google tag (gtag.js) — shared by all website pages. */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-P8NR3ZWDSQ" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-P8NR3ZWDSQ');`,
          }}
        />
      </head>
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}

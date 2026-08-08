import type { Metadata } from "next";
import "./globals.css";
import "./brand-extra.css";
import "./mobile-nav.css";
import "./global-header.css";
import SiteHeader from "./components/site-header";

export const metadata: Metadata = {
  title: "LinkoTech | Engineering Intelligence",
  description: "AI-powered engineering workflows, reusable calculation tools, and digital model intelligence.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}

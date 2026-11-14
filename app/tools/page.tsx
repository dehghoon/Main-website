import type { Metadata } from "next";
import { PUBLIC_TOOLS, SITE_ORIGIN, toolPreviewPath } from "@/lib/tool-discovery";
import { ENGINEERING_TOOLS } from "@/lib/tool-access/catalog";
import styles from "./tools.module.css";

const title = "Structural Engineering Tools | Linkoteq";
const description = "Explore sample outputs for Snow Load and W-Section and preview the 3D Structural Model Beta.";
const canonical = `${SITE_ORIGIN}/tools`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: { title, description, url: canonical, images: [`${SITE_ORIGIN}/tools/snow-load-preview.jpg`] },
};

export default function ToolsPage() {
  return (
    <main className={styles.shell}>
      <h1>Structural engineering tools</h1>
      <p>See sample calculations and preview the 3D workspace before creating an account.</p>
      <div className={styles.catalog}>
        {PUBLIC_TOOLS.map(tool => (
          <article className={styles.card} key={tool.key}>
            <span className={styles.badge}>{tool.trialDays ? `${tool.trialDays}-day Trial` : "Beta"}</span>
            <h2>{tool.name}</h2>
            <p>{tool.description}</p>
            <a className={styles.back} href={toolPreviewPath(tool)}>
              {tool.trialDays ? `See the ${tool.name} sample` : "Preview the 3D workspace"}
            </a>
          </article>
        ))}
      </div>
      <section aria-labelledby="development-title">
        <h2 id="development-title">In development</h2>
        <p>{ENGINEERING_TOOLS.filter(tool => !tool.url).map(tool => tool.name).join(" and ")} are in development.</p>
      </section>
    </main>
  );
}

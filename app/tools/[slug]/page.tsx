import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PUBLIC_TOOLS, SITE_ORIGIN, toolPreviewPath } from "@/lib/tool-discovery";
import { BETA_WARNING } from "@/lib/tool-access/catalog";
import ToolPreviewAnalytics from "../tool-preview-analytics";
import styles from "../tools.module.css";

type Props = { params: Promise<{ slug: string }> };

function getTool(slug: string) {
  const tool = PUBLIC_TOOLS.find(item => item.slug === slug);
  if (!tool) notFound();
  return tool;
}

export function generateStaticParams() {
  return PUBLIC_TOOLS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tool = getTool((await params).slug);
  const title = `${tool.name} | Linkoteq`;
  const canonical = SITE_ORIGIN + toolPreviewPath(tool);
  const image = `${SITE_ORIGIN}/tools/${tool.slug}-preview.jpg`;
  return {
    title,
    description: tool.description,
    alternates: { canonical },
    openGraph: {
      title,
      description: tool.description,
      url: canonical,
      images: [{ url: image, width: 1200, height: 630, alt: `${tool.name} preview` }],
    },
    twitter: { card: "summary_large_image", title, description: tool.description, images: [image] },
  };
}

export default async function ToolPreviewPage({ params }: Props) {
  const tool = getTool((await params).slug);
  return (
    <main className={styles.shell}>
      <a className={styles.back} href="/tools">← Engineering tools</a>
      <div className={styles.previewLayout}>
        <header className={styles.intro}>
          <span className={styles.badge}>{tool.trialDays ? `${tool.trialDays}-day Trial` : "Beta"}</span>
          <h1>{tool.name}</h1>
          <p>{tool.description}</p>
          <ToolPreviewAnalytics key={tool.key} toolKey={tool.key} trialDays={tool.trialDays} url={tool.url} />
        </header>
        {tool.preview ? (
          <section className={styles.example} aria-labelledby="example-title">
            <span className={styles.badge}>Sample calculation</span>
            <h2 id="example-title">{tool.preview.title}</h2>
            <h3>Selected inputs</h3>
            <dl className={styles.inputs}>
              {tool.preview.inputs.map(([label, value]) => (
                <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
              ))}
            </dl>
            <dl className={styles.result}>
              <dt>{tool.preview.resultLabel}</dt><dd>{tool.preview.result}</dd>
            </dl>
            <p className={styles.note}>{tool.preview.detail} For illustration only.</p>
            <a className={styles.back} href={tool.preview.source}>View the sample source</a>
          </section>
        ) : (
          <figure className={styles.model}>
            <Image
              src="/3d-model-preview.svg"
              alt="Preview of the 3D workspace showing a building frame with grid lines"
              width={1200}
              height={720}
              priority
            />
            <figcaption>3D workspace preview</figcaption>
          </figure>
        )}
      </div>
      {!tool.trialDays && <p className={styles.warning}>{BETA_WARNING}</p>}
    </main>
  );
}

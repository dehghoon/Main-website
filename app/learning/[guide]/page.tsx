import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE_ORIGIN } from '@/lib/tool-discovery';
import styles from '../learning.module.css';
import guideStyles from '../cable-tray-support-design/guide.module.css';
import { guides } from './guides';

type Props = { params: Promise<{ guide: string }> };

export function generateStaticParams() {
  return Object.keys(guides).map((guide) => ({ guide }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { guide } = await params;
  const entry = guides[guide];
  if (!entry) notFound();

  const title = `${entry.title} | Linkoteq`;
  const canonical = `${SITE_ORIGIN}/learning/${guide}`;
  return {
    title,
    description: entry.description,
    keywords: [...entry.keywords],
    alternates: { canonical },
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    openGraph: { type: 'article', title, description: entry.description, url: canonical },
  };
}

export default async function GuidePage({ params }: Props) {
  const { guide } = await params;
  const entry = guides[guide];
  if (!entry) notFound();

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/learning#${guide}`}>Learning &amp; Resources</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{entry.title}</span>
      </nav>
      <article className={guideStyles.article}>
        <header className={styles.hero}>
          <span className={styles.level}>{entry.level}</span>
          <h1>{entry.title}</h1>
          <p>{entry.intro}</p>
        </header>
        {entry.inputs && (
          <section aria-labelledby="inputs">
            <h2 id="inputs">Inputs and Prerequisites</h2>
            <p>{entry.inputs}</p>
          </section>
        )}
        <section aria-labelledby="principles">
          <h2 id="principles">{entry.principleTitle}</h2>
          <figure className={guideStyles.figure}>
            <ol className={guideStyles.flow} aria-label={entry.principleTitle}>
              {entry.diagram.map((stage) => <li key={stage}><strong>{stage}</strong></li>)}
            </ol>
          </figure>
          <ol>{entry.steps.map((step) => <li key={step}>{step}</li>)}</ol>
        </section>
        <section aria-labelledby="example">
          <h2 id="example">{entry.exampleTitle}</h2>
          <p className={guideStyles.result}>{entry.example}</p>
          <h3>Output Checks and Common Errors</h3>
          <p>{entry.check}</p>
          {entry.tool && <p><Link href={entry.tool}>Open the related Linkoteq tool preview</Link></p>}
        </section>
        <section aria-labelledby="references">
          <h2 id="references">Official References</h2>
          <ul>
            {entry.references.map(([title, url, note]) => (
              <li key={url}><a href={url}>{title}</a><p>{note}</p></li>
            ))}
          </ul>
        </section>
      </article>
    </main>
  );
}

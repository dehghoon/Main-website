import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { workbooks, workbookPath } from '@/lib/workbooks/catalog';
import { learningRobots } from '@/lib/learning/seo';
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
    robots: learningRobots(),
    openGraph: { type: 'article', title, description: entry.description, url: canonical },
  };
}

export default async function GuidePage({ params }: Props) {
  const { guide } = await params;
  const entry = guides[guide];
  if (!entry) notFound();
  const relatedWorkbooks = workbooks.filter(({ guides }) => guides.includes(guide));

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
        {entry.photo && (
          <figure className={guideStyles.photo}>
            <Image
              src={entry.photo.src}
              alt={entry.photo.alt}
              width={entry.photo.width}
              height={entry.photo.height}
              sizes="(max-width: 960px) 92vw, 928px"
            />
            <figcaption>
              <a href={entry.photo.source}>{entry.photo.credit}</a>
              {entry.photo.license && <> · <a href={entry.photo.license[1]}>{entry.photo.license[0]}</a></>}
            </figcaption>
          </figure>
        )}
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
        {relatedWorkbooks.length > 0 && (
          <section aria-labelledby="related-workbooks">
            <h2 id="related-workbooks">Related Calculation Workbooks</h2>
            <ul>{relatedWorkbooks.map(({ id, title }) => (
              <li key={id}><Link href={workbookPath(id)}>{title}</Link></li>
            ))}</ul>
          </section>
        )}
        {entry.video && (
          <section aria-labelledby="video">
            <h2 id="video">Related Video</h2>
            <p><a href={entry.video[1]}>{entry.video[0]} (YouTube)</a></p>
          </section>
        )}
      </article>
    </main>
  );
}

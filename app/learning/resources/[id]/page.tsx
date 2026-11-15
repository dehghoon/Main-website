import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { learningRobots } from '@/lib/learning/seo';
import { SITE_ORIGIN } from '@/lib/tool-discovery';
import { publishedLearningArticle } from '@/lib/learning/published';
import styles from '../../learning.module.css';

type Props = { params: Promise<{ id: string }> };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const article = await publishedLearningArticle(id);
  if (!article) notFound();

  const title = `${article.title} | Linkoteq`;
  const canonical = `${SITE_ORIGIN}/learning/resources/${article.id}`;
  return {
    title,
    description: article.summary,
    robots: learningRobots(),
    alternates: { canonical },
    openGraph: {
      type: 'article', title, description: article.summary, url: canonical,
      publishedTime: article.published_at ?? undefined,
    },
  };
}

export default async function PublishedResourcePage({ params }: Props) {
  const { id } = await params;
  const article = await publishedLearningArticle(id);
  if (!article) notFound();

  const articleMetadata = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.summary,
    datePublished: article.published_at,
    mainEntityOfPage: `${SITE_ORIGIN}/learning/resources/${article.id}`,
    publisher: { '@type': 'Organization', name: 'Linkoteq', url: SITE_ORIGIN },
  };

  return <main className={styles.page}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{
      __html: JSON.stringify(articleMetadata).replace(/</g, '\\u003c'),
    }} />
    <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
      <Link href="/learning">Resources &amp; Learning</Link>
      <span aria-hidden="true">/</span>
      <span aria-current="page">{article.title}</span>
    </nav>
    <article>
      <header className={styles.hero}>
        <p>{[article.category, article.subtopic].filter(Boolean).join(' / ')}</p>
        <h1>{article.title}</h1>
        <p>{article.summary}</p>
      </header>
      <div className={styles.articleBody}>{article.body}</div>
    </article>
  </main>;
}

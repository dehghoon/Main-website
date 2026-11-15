import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE_ORIGIN } from '@/lib/tool-discovery';
import { publishedLearningArticle } from '@/lib/learning/published';
import styles from '../../learning.module.css';

type Props = { params: Promise<{ id: string }> };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const article = await publishedLearningArticle(id);
  return {
    title: article ? `${article.title} | Linkoteq` : 'Resources & Learning | Linkoteq',
    description: article?.summary,
    robots: { index: false, follow: false },
    alternates: article ? { canonical: `${SITE_ORIGIN}/learning/resources/${article.id}` } : undefined,
  };
}

export default async function PublishedResourcePage({ params }: Props) {
  const { id } = await params;
  const article = await publishedLearningArticle(id);
  if (!article) notFound();

  return <main className={styles.page}>
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

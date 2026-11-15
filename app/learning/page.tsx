import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_ORIGIN } from '@/lib/tool-discovery';
import { publishedLearningCards } from '@/lib/learning/published';
import WorkspaceEntry from './workspace-entry';
import LearningBrowser from './learning-browser';
import styles from './learning.module.css';

const title = 'Structural Engineering Learning & Resources | Linkoteq';
const description = 'Explore practical structural engineering guides and references on design loads, steel connections, concrete, anchorage and BIM workflows, with links to official guidance.';
const canonical = `${SITE_ORIGIN}/learning`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  openGraph: { type: 'website', title, description, url: canonical },
  twitter: { card: 'summary', title, description },
};

export const dynamic = 'force-dynamic';

export default async function LearningPage() {
  const published = await publishedLearningCards();

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Learning &amp; Resources</span>
      </nav>

      <header className={styles.hero}>
        <h1>Learning &amp; Resources</h1>
        <p>Search engineering topics, worked guides and official references.</p>
        <nav className={styles.heroLinks} aria-label="Browse learning resources">
          <a className="primaryButton" href="#learning-search">Search Resources</a>
          <a className="secondaryButton" href="#folders">Browse by Folder</a>
        </nav>
      </header>

      <LearningBrowser published={published} />
      <WorkspaceEntry />

      <aside className={styles.notice}>
        Confirm the applicable code edition, jurisdiction and publisher guidance before using
        these resources in an engineering decision.
      </aside>
    </main>
  );
}

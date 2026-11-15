import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_ORIGIN } from '@/lib/tool-discovery';
import LearningBrowser from './learning-browser';
import styles from './learning.module.css';

const title = 'Structural Engineering Learning & Resources | Linkoteq';
const description = 'Explore 174 structural engineering resources on design loads, steel connections, concrete, anchorage and BIM workflows, with links to official guidance.';
const canonical = `${SITE_ORIGIN}/learning`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  openGraph: { type: 'website', title, description, url: canonical },
  twitter: { card: 'summary', title, description },
};

export default function LearningPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Learning &amp; Resources</span>
      </nav>

      <header className={styles.hero}>
        <h1>Learning &amp; Resources</h1>
        <p>Explore structural engineering topics, software workflows and official references.</p>
        <nav className={styles.heroLinks} aria-label="Browse learning resources">
          <a className="primaryButton" href="#topics">Browse by Topic</a>
          <a className="secondaryButton" href="#folders">Browse by Folder</a>
        </nav>
      </header>

      <section className={styles.section} aria-labelledby="worked-guides">
        <h2 id="worked-guides">Worked Guides</h2>
        <Link href="/learning/cable-tray-support-design" className="secondaryButton">
          Cable Tray Support Design and Installation
        </Link>
        <p className={styles.lead}>Calculate a support reaction and follow the load into the supporting structure.</p>
      </section>

      <LearningBrowser />

      <aside className={styles.notice}>
        Confirm the applicable code edition, jurisdiction and publisher guidance before using
        these resources in an engineering decision.
      </aside>
    </main>
  );
}

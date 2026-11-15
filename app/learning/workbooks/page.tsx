import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_ORIGIN } from '@/lib/tool-discovery';
import WorkbookBrowser from './workbook-browser';
import styles from '../learning.module.css';

const title = 'Structural Calculation Workbooks | Linkoteq';
const description = 'Browse structural Excel workbook summaries for wind, snow, steel, concrete, foundations and analysis.';
const canonical = `${SITE_ORIGIN}/learning/workbooks`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  robots: { index: false, follow: false },
  openGraph: { title, description, url: canonical, type: 'website' },
};

export default function WorkbooksPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/learning">Learning &amp; Resources</Link>
      </nav>
      <header className={styles.hero}>
        <h1>Calculation Workbooks</h1>
        <p>Find a workbook and see what goes in, where to read the results and which worked guides cover the same topic.</p>
      </header>
      <WorkbookBrowser />
    </main>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE_ORIGIN } from '@/lib/tool-discovery';
import { learningResources } from '@/lib/learning/catalog';
import { getWorkbook, workbookCategories, workbookPath } from '@/lib/workbooks/catalog';
import { workbookAsset } from '@/lib/workbooks/assets';
import WorkbookDownload from './download';
import learningStyles from '../../learning.module.css';
import styles from '../workbooks.module.css';

type Props = { params: Promise<{ id: string }> };
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const workbook = getWorkbook(id);
  if (!workbook) notFound();
  const title = `${workbook.title} Workbook | Linkoteq`;
  const canonical = SITE_ORIGIN + workbookPath(id);
  return {
    title,
    description: workbook.summary,
    alternates: { canonical },
    robots: { index: false, follow: false },
    openGraph: { title, description: workbook.summary, url: canonical, type: 'website' },
  };
}

export default async function WorkbookPage({ params }: Props) {
  const { id } = await params;
  const workbook = getWorkbook(id);
  if (!workbook) notFound();

  const hasGuide = Boolean(workbook.inputs && workbook.outputs);
  const preview = workbookAsset(id, 'preview');
  const download = workbookAsset(id, 'workbook');
  const configured = Boolean(process.env.WORKBOOK_GITHUB_TOKEN);
  const guides = learningResources.filter(({ id, guideHref }) => guideHref && workbook.guides.includes(id));

  return (
    <main className={learningStyles.page}>
      <nav className={learningStyles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/learning">Learning &amp; Resources</Link>
        <span aria-hidden="true">/</span>
        <Link href="/learning/workbooks">Calculation Workbooks</Link>
      </nav>
      <header className={learningStyles.hero}>
        <p>{workbookCategories[workbook.category]}</p>
        <h1>{workbook.title}</h1>
        <p>{workbook.summary}</p>
      </header>
      <section className={styles.detail} aria-labelledby="workbook-tour">
        <h2 id="workbook-tour">{hasGuide ? 'How to use this workbook' : 'Workbook availability'}</h2>
        {hasGuide && <div className={styles.grid}>
          <div className={styles.card}><h3>Where to start</h3><p>{workbook.inputs}</p></div>
          <div className={styles.card}><h3>Where to find the results</h3><p>{workbook.outputs}</p></div>
        </div>}
        {preview && configured && <figure className={styles.preview}>
          <img src={`/api/learning/workbooks/${id}?asset=preview`} alt={`Selected worksheet view from ${workbook.title}`} />
          <figcaption>Read-only worksheet excerpt</figcaption>
        </figure>}
        {workbook.note && <p>{workbook.note}</p>}
        {!hasGuide && <p>Worksheet instructions are unavailable for this file.</p>}
        {hasGuide && workbook.category !== 'references' &&
          <p>Workbook calculations have not been verified. Check the applicable code edition and assumptions.</p>}
        <WorkbookDownload id={id} available={Boolean(download && configured)} />
      </section>
      {guides.length > 0 && <section className={styles.detail} aria-labelledby="related-guides">
        <h2 id="related-guides">Related worked guides</h2>
        <ul>{guides.map((guide) => <li key={guide.id}><Link href={guide.guideHref!}>{guide.title}</Link></li>)}</ul>
      </section>}
    </main>
  );
}

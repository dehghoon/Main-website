'use client';

import Link from 'next/link';
import { useState } from 'react';
import { filterWorkbooks, workbookCategories, workbookPath } from '@/lib/workbooks/catalog';
import WorkbookPreview from './workbook-preview';
import styles from './workbooks.module.css';

export default function WorkbookBrowser({ privatePreviews }: { privatePreviews: Record<string, string> }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const results = filterWorkbooks(query, category);

  return (
    <section className={styles.browser} aria-label="Browse calculation workbooks">
      <div className={styles.controls} role="search" aria-label="Workbook filters">
        <label>Search workbooks
          <input type="search" value={query} placeholder="Try wind pressure, corbel or weld"
            onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>Category
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All categories</option>
            {Object.entries(workbookCategories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <button type="button" className="secondaryButton" onClick={() => {
          setQuery('');
          setCategory('');
        }}>Reset filters</button>
      </div>
      <p role="status">{results.length} {results.length === 1 ? 'workbook' : 'workbooks'} found
        {results.length === 0 && '. Try another term or category.'}
      </p>
      <div className={styles.grid}>
        {results.map((workbook) => (
          <article className={styles.card} key={workbook.id}>
            <span>{workbookCategories[workbook.category]}</span>
            <h2>{workbook.title}</h2>
            <p>{workbook.summary}</p>
            <WorkbookPreview id={workbook.id} privatePreview={privatePreviews[workbook.id]} thumbnail />
            <Link className={styles.guideLink} href={workbookPath(workbook.id)}
              aria-label={`${workbook.inputs ? 'Read workbook guide' : 'View workbook availability'} for ${workbook.title}`}>
              {workbook.inputs ? 'Read workbook guide' : 'View workbook availability'}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

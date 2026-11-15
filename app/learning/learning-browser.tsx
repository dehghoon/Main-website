'use client';

import Link from 'next/link';
import { type MouseEvent, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  filterLearningTopics,
  publicFolderTree,
  topicCategories,
  type PublicFolder,
  type TopicCategory,
} from '@/lib/learning/catalog';
import styles from './learning.module.css';

function FolderList({ folders, onNavigate }: {
  folders: readonly PublicFolder[];
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, id: string) => void;
}) {
  return (
    <ul className={styles.tree}>
      {folders.map(({ id, label, children }) => (
        <li key={id}>
          {children.length ? (
            <details className={styles.folder}>
              <summary>{label}</summary>
              <div className={styles.folderContents}>
                <a href={`#${id}`} onClick={(event) => onNavigate(event, id)}>View {label}</a>
                <FolderList folders={children} onNavigate={onNavigate} />
              </div>
            </details>
          ) : (
            <a href={`#${id}`} onClick={(event) => onNavigate(event, id)}>{label}</a>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function LearningBrowser() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<TopicCategory | ''>('');
  const [withGuide, setWithGuide] = useState(false);
  const results = filterLearningTopics(query, category, withGuide);

  function resetFilters() {
    setQuery('');
    setCategory('');
    setWithGuide(false);
  }

  useEffect(() => {
    const target = document.getElementById(window.location.hash.slice(1));
    if (target?.tagName === 'ARTICLE') target.scrollIntoView();
  }, []);

  function navigateFromFolder(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!results.some((resource) => resource.id === id)) flushSync(resetFilters);
    document.getElementById(id)?.focus({ preventScroll: true });
  }

  return (
    <>
      <section className={styles.section} aria-labelledby="topics">
        <h2 id="topics">Browse by Topic</h2>
        <div className={styles.discoveryControls} role="search" aria-label="Learning topic filters">
          <div>
            <label htmlFor="learning-search">Search topics and software</label>
            <input id="learning-search" type="search" value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try cable tray support, snow drift or Revit" />
          </div>
          <div>
            <label htmlFor="learning-category">Topic</label>
            <select id="learning-category" value={category} onChange={(event) => {
              const value = event.target.value;
              setCategory(Object.hasOwn(topicCategories, value) ? value as TopicCategory : '');
            }}>
              <option value="">All topics</option>
              {Object.entries(topicCategories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>
          <label className={styles.guideFilter}>
            <input type="checkbox" checked={withGuide} onChange={(event) => setWithGuide(event.target.checked)} />
            Has a worked guide
          </label>
          <button type="button" className={styles.reset} onClick={resetFilters}>Reset Filters</button>
        </div>
        <p className={styles.count} role="status">
          {results.length} {results.length === 1 ? 'topic' : 'topics'} found
          {results.length === 0 && '. Try another term or reset the filters.'}
        </p>
        <div className={styles.grid}>
          {results.map((resource) => (
            <article className={styles.card} key={resource.id} id={resource.id} tabIndex={-1}
              aria-labelledby={`${resource.id}-title`}>
              <p className={styles.topicLabel}>{topicCategories[resource.category]}</p>
              <h3 id={`${resource.id}-title`}>{resource.title}</h3>
              <p>{resource.summary}</p>
              {resource.guideHref && (
                <p><Link href={resource.guideHref} className="secondaryButton"
                  aria-label={`Read the worked guide for ${resource.title}`}>Read the worked guide</Link></p>
              )}
              <details className={styles.resourceGroup}>
                <summary>References and topic details</summary>
                <p>Suggested level: {resource.level}</p>
                <p>Keywords: {resource.keywords.join(', ')}</p>
                <div className={styles.references}>
                  {resource.references.map(({ title, url }) => <a key={url} href={url}>{title}</a>)}
                </div>
              </details>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="folders">
        <h2 id="folders">Browse by Folder</h2>
        <details className={styles.folder}>
          <summary>Show curated collections</summary>
          <div className={styles.folderContents}>
            <FolderList folders={publicFolderTree} onNavigate={navigateFromFolder} />
          </div>
        </details>
      </section>
    </>
  );
}

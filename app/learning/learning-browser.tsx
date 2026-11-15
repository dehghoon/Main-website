'use client';

import { type MouseEvent, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { ArrowUpRight } from 'lucide-react';
import {
  filterLearningTopics,
  levels,
  publicFolderTree,
  type LearningResource,
  type Level,
  type PublicFolder,
} from '@/lib/learning/catalog';
import styles from './learning.module.css';

function OfficialReferences({ references }: { references: LearningResource['references'] }) {
  return references.map(({ title, url }) => (
    <a key={url} href={url} target="_blank" rel="noopener noreferrer">
      {title}
      <ArrowUpRight size={15} aria-hidden="true" />
      <span className={styles.srOnly}> (opens in a new tab)</span>
    </a>
  ));
}

function FolderList({
  folders,
  onTopicClick,
}: {
  folders: readonly PublicFolder[];
  onTopicClick: (event: MouseEvent<HTMLAnchorElement>, id: string) => void;
}) {
  return (
    <ul className={styles.tree}>
      {folders.map((folder) => (
        <li key={folder.resource ?? folder.topic}>
          <details className={styles.folder}>
            <summary>{folder.label}</summary>
            <div className={styles.folderContents}>
              <a href={`#${folder.resource ?? folder.topic}`} onClick={(event) => onTopicClick(event, folder.resource ?? folder.topic)}>
                View {folder.label}
              </a>
              {folder.children && folder.children.length > 0 && (
                <FolderList folders={folder.children} onTopicClick={onTopicClick} />
              )}
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}

function revealResource(id: string) {
  const target = document.getElementById(id);
  const parent = target?.closest('details');
  if (parent instanceof HTMLDetailsElement) parent.open = true;
  return target;
}

export default function LearningBrowser() {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<Level | ''>('');
  const filtered = filterLearningTopics(query, level);

  const resourceCount = filtered.reduce((total, topic) => total + topic.resources.length, 0);

  useEffect(() => {
    function revealFragment() {
      const id = window.location.hash.slice(1);
      const target = revealResource(id);
      if (target?.closest('details')) target.scrollIntoView();
    }

    revealFragment();
    window.addEventListener('hashchange', revealFragment);
    return () => window.removeEventListener('hashchange', revealFragment);
  }, []);

  function resetFilters() {
    setQuery('');
    setLevel('');
  }

  function navigateToTopic(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    // Restore a filtered-out target before the browser follows its fragment link.
    if (!filtered.some((topic) => topic.id === id || topic.resources.some((resource) => resource.id === id))) flushSync(resetFilters);
    revealResource(id)?.focus({ preventScroll: true });
  }

  return (
    <>
      <section className={styles.section} aria-labelledby="topics">
        <h2 id="topics" tabIndex={-1}>Browse by Topic</h2>
        <div className={styles.controls} role="search" aria-label="Learning topic filters">
          <div>
            <label htmlFor="learning-search">Search topics and software</label>
            <input
              id="learning-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try ETABS, diaphragm or Revit"
            />
          </div>
          <div>
            <label htmlFor="learning-level">Difficulty</label>
            <select
              id="learning-level"
              value={level}
              onChange={(event) => {
                const selected = event.target.value;
                setLevel(levels.find((option) => option === selected) ?? '');
              }}
            >
              <option value="">All levels</option>
              {levels.map((option) => <option key={option}>{option}</option>)}
            </select>
          </div>
          <button type="button" className={styles.reset} onClick={resetFilters}>Reset Filters</button>
        </div>
        <p className={styles.count} role="status" aria-live="polite" aria-atomic="true">
          {resourceCount} {resourceCount === 1 ? 'resource' : 'resources'} across {filtered.length} {filtered.length === 1 ? 'category' : 'categories'}
          {filtered.length === 0 && '. Try another search term or difficulty.'}
        </p>
        <div className={styles.grid}>
          {filtered.map((topic) => (
            <article
              className={styles.card}
              id={topic.id}
              key={topic.id}
              tabIndex={-1}
              aria-labelledby={`${topic.id}-title`}
            >
              <span className={styles.level}>{topic.level}</span>
              <h3 id={`${topic.id}-title`}>{topic.title}</h3>
              <p>{topic.summary}</p>
              <ul>{topic.subtopics.map((item) => <li key={item}>{item}</li>)}</ul>
              <div className={styles.references}>
                <h4>Official references</h4>
                <OfficialReferences references={topic.references} />
              </div>
              {topic.resources.length > 0 && (
                <details className={styles.resourceGroup} open={query.trim() || level ? true : undefined}>
                  <summary>Explore {topic.resources.length} {topic.resources.length === 1 ? 'resource' : 'resources'}</summary>
                  <div className={styles.resources}>
                  {topic.resources.map((resource) => (
                    <section key={resource.id} id={resource.id} tabIndex={-1}
                      aria-labelledby={`${resource.id}-title`} className={styles.resource}>
                      <h4 id={`${resource.id}-title`}>{resource.title}</h4>
                      <span className={styles.level}>{resource.level}</span>
                      <p>{resource.summary}</p>
                      <p><strong>Keywords:</strong> {resource.keywords.join(', ')}</p>
                      <div className={styles.references}>
                        <OfficialReferences references={resource.references} />
                      </div>
                    </section>
                  ))}
                  </div>
                </details>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="folders">
        <h2 id="folders" tabIndex={-1}>Browse by Folder</h2>
        <p className={styles.lead}>Expand a folder to find its related learning topics.</p>
        <FolderList folders={publicFolderTree} onTopicClick={navigateToTopic} />
      </section>
    </>
  );
}

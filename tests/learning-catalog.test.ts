import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { filterLearningTopics, learningTopics, learningResources, publicFolderTree, type PublicFolder } from '../lib/learning/catalog.ts';

test('all 174 resources belong to the four original categories', () => {
  const topics = filterLearningTopics('', '');
  assert.deepEqual(topics.map(({ id }) => id), ['analysis', 'steel', 'concrete', 'bim']);
  assert.deepEqual(topics.map(({ resources }) => resources.length), [35, 31, 83, 25]);
});

test('resource search matches text, tools and difficulty', () => {
  assert.ok(filterLearningTopics('  REVIT   robot ', '').some(({ id }) => id === 'bim'));
  assert.ok(filterLearningTopics('diaphragm', '').some(({ id }) => id === 'steel'));
  const advanced = filterLearningTopics('', 'Advanced').flatMap(({ resources }) => resources);
  assert.ok(advanced.length > 0);
  assert.ok(advanced.every(({ level }) => level === 'Advanced'));
  assert.deepEqual(filterLearningTopics('zzzz-not-a-resource', ''), []);
});

function destinations(folders: readonly PublicFolder[]): string[] {
  return folders.flatMap(({ topic, resource, children }) => {
    const nested = destinations(children ?? []);
    if (!resource) return nested;
    assert.ok(learningResources[topic].some(({ id }) => id === resource));
    return [resource, ...nested];
  });
}

test('the public tree links once to every resource and anchors are unique', () => {
  const ids = Object.values(learningResources).flat().map(({ id }) => id);
  assert.deepEqual(destinations(publicFolderTree).sort(), ids.toSorted());
  const allIds = [...ids, ...learningTopics.map(({ id }) => id), 'topics', 'folders'];
  assert.equal(new Set(allIds).size, allIds.length);
  assert.ok(publicFolderTree.some(({ children }) => children?.some((child) => child.children?.length)));
});

test('every resource has public English text, tags and an HTTPS publisher link', () => {
  for (const { title, summary, keywords, references } of Object.values(learningResources).flat()) {
    assert.ok(title.trim() && summary.trim() && keywords.length && references.length);
    for (const { url } of references) {
      const reference = new URL(url);
      assert.equal(reference.protocol, 'https:');
      assert.equal(reference.username + reference.password, '');
    }
  }
});

test('the catalog excludes private paths and review remains outside search indexing', () => {
  const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
  assert.doesNotMatch(read('../lib/learning/catalog.ts'), /(?:[a-z]:\\|\/(?:Users|home|workspace)\/|file:\/\/|training[-_](?:inventory|catalog)|evidence_paths|original_path|child_folder_ids|root_folder_id|fromhassan|\.(?:zip|dwg|rvt|s2k)\b)/i);
  assert.match(read('../app/learning/page.tsx'), /robots: \{ index: false, follow: false/);
  assert.doesNotMatch(read('../app/sitemap.ts'), /\/learning\b/);
});

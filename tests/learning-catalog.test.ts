import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { filterLearningTopics, learningResources, publicFolderTree, topicCategories, type PublicFolder } from '../lib/learning/catalog.ts';
import { guides } from '../app/learning/[guide]/guides.ts';

test('search resolves the requested terms to the expected public topics', () => {
  const cases = {
    'cable tray support': 'cable-tray-and-support-systems',
    'pipe rack': 'pipe-rack',
    'rebar coupler': 'reinforcement-couplers',
    'floor loading assessment': 'floor-loading-assessment',
    'prestressed concrete': 'prestressed-concrete',
    'storm drainage': 'storm-drainage',
  };
  for (const [query, id] of Object.entries(cases)) assert.deepEqual(filterLearningTopics(query).map((r) => r.id), [id], query);
  assert.ok(filterLearningTopics('SAP2000').some((r) => r.id === 'sap2000-and-revit-model-exchange'));
  assert.deepEqual(filterLearningTopics('curtain wall'), []);
});

test('topic and guide filters compose and all twelve categories have resources', () => {
  for (const category of Object.keys(topicCategories)) assert.ok(learningResources.some((r) => r.category === category));
  const resources = filterLearningTopics('', 'industrial', true);
  assert.ok(resources.length > 0);
  assert.ok(resources.every((r) => r.category === 'industrial' && r.guideHref));
});

function folderIds(folders: readonly PublicFolder[]): string[] {
  return folders.flatMap(({ id, children }) => [id, ...folderIds(children)]);
}
test('public collections reach each canonical resource once', () => {
  const ids = learningResources.map(({ id }) => id);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(folderIds(publicFolderTree).sort(), ids.toSorted());
});

test('each linked work guide is registered and publisher URLs use HTTPS', () => {
  const targets = learningResources.flatMap(({ guideHref }) => guideHref ? [guideHref.split('/').at(-1)] : []);
  assert.deepEqual(targets.sort(), [...Object.keys(guides), 'cable-tray-support-design'].sort());
  for (const { references } of learningResources) {
    assert.ok(references.length);
    for (const { url } of references) assert.equal(new URL(url).protocol, 'https:');
  }
});

test('the preview remains noindex and local source paths remain private', () => {
  const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
  for (const path of ['../app/learning/page.tsx','../app/learning/%5Bguide%5D/page.tsx','../app/learning/cable-tray-support-design/page.tsx']) {
    assert.match(read(path), /index: false, follow: false/);
  }
  assert.doesNotMatch(read('../app/sitemap.ts'), /\/learning\b/);
  for (const path of ['../lib/learning/catalog.ts','../app/learning/%5Bguide%5D/guides.ts']) {
    assert.doesNotMatch(read(path), /(?:[a-z]:\\|file:\/\/|evidence_paths|original_path|fromhassan|\.(?:zip|dwg|rvt|s2k)\b)/i);
  }
});

test('difficulty combines with subject, query and worked-guide filters', () => {
  const resources = filterLearningTopics('', 'loads', true, 'Intermediate');
  assert.ok(resources.length);
  assert.ok(resources.every((resource) => resource.level === 'Intermediate' && resource.guideHref));
  assert.deepEqual(filterLearningTopics('roof snow loads', 'loads', true, 'Beginner'), []);
});

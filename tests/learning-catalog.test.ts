import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { filterLearningTopics, learningTopics, learningResources, publicFolderTree, type PublicFolder } from '../lib/learning/catalog.ts';

test('the four categories retain their order and each includes three resources', () => {
  const topics = filterLearningTopics('', '');
  assert.deepEqual(topics.map(({ id }) => id), ['analysis', 'steel', 'concrete', 'bim']);
  for (const topic of topics) assert.equal(topic.resources.length, 3);
});

test('search and difficulty expose matching resources within their categories', () => {
  assert.deepEqual(filterLearningTopics('  MODAL   response ', 'Advanced').flatMap(({ resources }) =>
    resources.map(({ id }) => id)), ['modal-response']);
  assert.deepEqual(filterLearningTopics('dynamo', 'Advanced').flatMap(({ resources }) =>
    resources.map(({ id }) => id)), ['dynamo-analysis']);
  assert.deepEqual(filterLearningTopics('dynamo', 'Beginner'), []);
  assert.deepEqual(filterLearningTopics('diaphragm', 'Advanced').map(({ id }) => id), ['steel']);
  assert.deepEqual(filterLearningTopics('revit welding', ''), []);
});

function destinations(folders: readonly PublicFolder[]): string[] {
  return folders.flatMap((folder) => {
    if ('children' in folder) return destinations(folder.children);
    if (!folder.resource) return [folder.topic];
    assert.ok(learningResources[folder.topic].some(({ id }) => id === folder.resource));
    return [folder.resource];
  });
}

test('the folder tree links to every resource exactly once', () => {
  const ids = Object.values(learningResources).flat().map(({ id }) => id);
  assert.deepEqual(destinations(publicFolderTree).sort(), ids.toSorted());
  assert.equal(new Set(ids).size, ids.length);
  for (const parent of ['Steel Deck and Diaphragms', 'Civil Engineering', 'Revit']) {
    assert.ok(publicFolderTree.some((folder) => folder.label === parent && 'children' in folder));
  }
});

test('references point to allowlisted HTTPS publisher hosts', () => {
  const hosts = new Set([
    'docs.csiamerica.com', 'nrc-publications.canada.ca', 'www.cisc-icca.ca', 'www.canam.com',
    'www.hilti.ca', 'www.autodesk.com', 'primer2.dynamobim.org', 'www.asce.org',
    'web.wiki.csiamerica.com', 'sdi.org', 'nvlpubs.nist.gov', 'www.concrete.org',
    'damassets.autodesk.net', 'help.autodesk.com',
  ]);
  for (const entry of [...learningTopics, ...Object.values(learningResources).flat()]) {
    assert.ok(entry.references.length > 0);
    for (const { url } of entry.references) {
      const reference = new URL(url);
      assert.equal(reference.protocol, 'https:');
      assert.equal(reference.username + reference.password, '');
      assert.ok(hosts.has(reference.hostname), reference.hostname);
    }
  }
});

test('the catalog excludes private paths, inventory markers and source file links', () => {
  const catalog = readFileSync(new URL('../lib/learning/catalog.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(catalog, /(?:[a-z]:\\|\/(?:Users|home|workspace)\/|file:\/\/|training[-_](?:inventory|catalog)|evidence_paths|original_path|child_folder_ids|root_folder_id|\.(?:zip|dwg|rvt|s2k)\b)/i);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { filterLearningTopics, learningTopics, publicFolderTree } from '../lib/learning/catalog.ts';

const ids = (query: string, level: 'Beginner' | 'Intermediate' | '' = '') =>
  filterLearningTopics(query, level).map(({ id }) => id);

test('the catalog has the four topics, in reading order', () => {
  assert.deepEqual(ids(''), ['analysis', 'steel', 'concrete', 'bim']);
});

test('search matches topics, subtopics and software with case-insensitive terms', () => {
  assert.deepEqual(ids('  ETABS   combinations '), ['analysis']);
  assert.deepEqual(ids('diaphragm'), ['steel']);
  assert.deepEqual(ids('ReViT'), ['bim']);
  assert.deepEqual(ids('SAP2000'), ['analysis', 'bim']);
  assert.deepEqual(ids('revit welding'), []);
});

test('difficulty combines with search and an empty filter includes all levels', () => {
  assert.deepEqual(ids('', 'Beginner'), ['analysis']);
  assert.deepEqual(ids('', 'Intermediate'), ['steel', 'concrete', 'bim']);
  assert.deepEqual(ids('sap2000', 'Intermediate'), ['bim']);
  assert.deepEqual(ids('etabs', 'Intermediate'), []);
});

test('the public tree preserves selected parent-child relationships and resolves all topic links', () => {
  assert.deepEqual(
    publicFolderTree.map((folder) => [
      folder.label,
      'children' in folder ? folder.children.map((child) => child.label) : [],
    ]),
    [
      ['Canadian Building Code Loads', []],
      ['Steel Deck and Diaphragms', ['Canam']],
      ['Civil Engineering', ['Concrete Design']],
      ['Revit', ['Robot to Revit']],
    ],
  );
  const destinations = publicFolderTree.flatMap((folder) =>
    'children' in folder
      ? folder.children.map((child) => 'topic' in child && child.topic)
      : [folder.topic],
  );
  assert.deepEqual(destinations, ids(''));
});

test('references point to the allowlisted HTTPS publisher hosts', () => {
  assert.deepEqual(learningTopics.map(({ references }) => references.map(({ url }) => {
    const reference = new URL(url);
    assert.equal(reference.protocol, 'https:');
    assert.equal(reference.username + reference.password, '');
    return reference.hostname;
  })), [
    ['docs.csiamerica.com', 'nrc-publications.canada.ca'],
    ['www.cisc-icca.ca', 'www.canam.com'],
    ['www.hilti.ca'],
    ['www.autodesk.com', 'primer2.dynamobim.org'],
  ]);
});

test('the catalog excludes private paths, inventory markers and source file links', () => {
  const catalog = readFileSync(new URL('../lib/learning/catalog.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(catalog, /(?:[a-z]:\\|\/(?:Users|home|workspace)\/|file:\/\/|training[-_](?:inventory|catalog)|evidence_paths|original_path|child_folder_ids|root_folder_id|\.(?:zip|dwg|rvt|s2k)\b)/i);
});

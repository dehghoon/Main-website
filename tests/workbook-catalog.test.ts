import assert from 'node:assert/strict';
import test from 'node:test';
import { filterWorkbooks, getWorkbook, workbookCategories, workbookPath, workbooks } from '../lib/workbooks/catalog.ts';
import { guides } from '../app/learning/[guide]/guides.ts';

test('workbook search finds verified terms and respects category filters', () => {
  for (const [term, id] of [
    ['MWFRS', 'wind-asce-7-10'],
    ['roof snow drift', 'roof-snow-distributions'],
    ['shear tab', 'single-plate-shear-connection'],
    ['masonry sliding', 'masonry-pier-checks'],
    ['soil bearing', 'footing-with-pier'],
  ]) {
    assert.ok(filterWorkbooks(term, '').some((workbook) => workbook.id === id), term);
  }
  assert.deepEqual(filterWorkbooks('roof snow drift', 'steel'), []);
  assert.deepEqual(filterWorkbooks('asdf nonexistent', ''), []);
  assert.equal(filterWorkbooks('', '').length, workbooks.length);
});

test('workbook IDs and related worked guides resolve without source paths', () => {
  assert.equal(workbooks.length, 139);
  assert.equal(workbooks.filter(({ inputs, outputs }) => inputs && outputs).length, 130);
  const keys = new Set(workbooks.map(({ id }) => id));
  assert.equal(keys.size, workbooks.length);
  for (const item of workbooks) {
    assert.match(item.id, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.ok(Object.hasOwn(workbookCategories, item.category));
    assert.equal(Boolean(item.inputs), Boolean(item.outputs));
    assert.ok(item.summary.trim());
    assert.equal(getWorkbook(item.id), item);
    assert.equal(workbookPath(item.id), '/learning/workbooks/' + item.id);
    for (const guide of item.guides) assert.ok(Object.hasOwn(guides, guide), guide);
    assert.doesNotMatch(JSON.stringify(item), /(?:Excell Spreadsheets|\.xls[mxb]?\b|github\.com\/dehghoon|\/workspace\/)/i);
  }
});

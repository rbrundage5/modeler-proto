import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('primary containment tree excludes every semantic relationship kind',async()=>{
  const source=await readFile(new URL('../public/src/app.js',import.meta.url),'utf8');
  const start=source.indexOf('function renderTree()');
  const end=source.indexOf('function treeRow(',start);
  assert.ok(start>=0&&end>start,'renderTree source must be locatable');
  const renderTree=source.slice(start,end);
  assert.doesNotMatch(renderTree,/project\.relationships/);
  assert.doesNotMatch(renderTree,/treeRow\([^\n]*['"]relationship['"]/);
});

test('relationship access remains available through cross-reference and diagram views',async()=>{
  const source=await readFile(new URL('../public/src/app.js',import.meta.url),'utf8');
  assert.match(source,/function renderXrefs\(/);
  assert.match(source,/project\.relationships\.filter\(x=>x\.sourceId===e\.id\|\|x\.targetId===e\.id\)/);
  assert.match(source,/selected\.type==='relationship'/);
});

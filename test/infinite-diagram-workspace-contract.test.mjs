import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../public/src/infinite-diagram-workspace.js',import.meta.url),'utf8');
const bootstrap=fs.readFileSync(new URL('../public/src/owned-tree-content.js',import.meta.url),'utf8');

test('workspace service resizes svg and visible diagram frame',()=>{
  assert.match(source,/setAttribute\('width'/);
  assert.match(source,/setAttribute\('height'/);
  assert.match(source,/setAttribute\('viewBox'/);
  assert.match(source,/querySelector\('\.diagram-frame'\)/);
});

test('workspace recalculates after canvas rerenders',()=>{
  assert.match(source,/MutationObserver\(schedule\)/);
  assert.match(source,/observe\(canvas,\{childList:true,subtree:true\}\)/);
});

test('workspace service is loaded by the application bootstrap path',()=>{
  assert.match(bootstrap,/import '\.\/infinite-diagram-workspace\.js';/);
});

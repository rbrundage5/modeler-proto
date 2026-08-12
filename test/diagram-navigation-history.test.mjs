import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('../public/src/diagram-navigation-history.js',import.meta.url),'utf8');

test('diagram navigation controller provides adjacent Back and Forward controls',()=>{
  assert.match(source,/id='diagramBack'/);
  assert.match(source,/id='diagramForward'/);
  assert.match(source,/◀ Back/);
  assert.match(source,/Forward ▶/);
  assert.match(source,/actions\.insertBefore\(back,select\)/);
});

test('history uses browser-style stack operations without globally deduplicating repeated diagrams',()=>{
  assert.match(source,/function pushHistory\(/);
  assert.match(source,/stack\.at\(-1\)!==id/);
  assert.match(source,/function popValid\(/);
  assert.doesNotMatch(source,/stack\.indexOf\(id\)===index/);
  assert.match(source,/MAX_HISTORY=100/);
});

test('explicit Back and Forward navigation is transactionally suppressed from normal history recording',()=>{
  assert.match(source,/pendingNavigation=\{target:id,direction\}/);
  assert.match(source,/pendingNavigation\?\.target===next/);
  assert.match(source,/forwardStack=\[\]/);
});

test('history skips stale or deleted diagrams and the current diagram',()=>{
  assert.match(source,/validDiagram\(id\)&&id!==current/);
  assert.match(source,/if\(validDiagram\(id\)&&id!==current\)return id/);
});

test('history navigation updates activeDiagramId through SystemsModelerAPI',()=>{
  assert.match(source,/next\.activeDiagramId=id/);
  assert.match(source,/service\.setProject\(next\)/);
});

test('history can be reset when project context changes',()=>{
  assert.match(source,/export function resetDiagramNavigationHistory/);
  assert.match(source,/reset:resetDiagramNavigationHistory/);
});

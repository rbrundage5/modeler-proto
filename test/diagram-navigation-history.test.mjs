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

test('diagram navigation tracks independent back and forward stacks',()=>{
  assert.match(source,/backStack\.push\(currentId\)/);
  assert.match(source,/forwardStack=\[\]/);
  assert.match(source,/forwardStack\.push\(present\)/);
  assert.match(source,/backStack\.push\(present\)/);
});

test('history navigation updates the active diagram through the modeler API',()=>{
  assert.match(source,/project\.activeDiagramId=id/);
  assert.match(source,/service\.setProject\(project\)/);
});

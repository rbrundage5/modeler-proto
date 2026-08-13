import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const child=fs.readFileSync(new URL('../public/src/child-diagram-navigation.js',import.meta.url),'utf8');
const tree=fs.readFileSync(new URL('../public/src/diagram-containment-tree.js',import.meta.url),'utf8');
const owned=fs.readFileSync(new URL('../public/src/owned-semantic-content.js',import.meta.url),'utf8');

test('child diagram capability is not limited to BDD/IBD drilldown',()=>{
  for(const token of ["ConstraintBlock:['Block Definition Diagram','Parametric Diagram'","UseCase:['Use Case Diagram','Sequence Diagram'","Activity:['Activity Diagram','Requirement Diagram','Allocation Diagram'","Requirement:['Requirement Diagram']","InstanceSpecification:['Instance Diagram']"])assert.ok(child.includes(token),token);
  assert.match(child,/definition\.contextKinds/);
});

test('created child diagrams are owned/indexed by their element and imported package ownership is preserved',()=>{
  assert.match(child,/ownerId:owner\.id,contextId:owner\.id/);
  assert.match(child,/owner\.childDiagramIds/);
  assert.match(child,/primaryChildDiagramId/);
  assert.match(child,/if\(!owner&&context\)\{diagram\.ownerId=context\.id/);
  assert.doesNotMatch(child,/context&&canOwnChildDiagram\(context\.kind,diagram\.diagramType\)&&diagram\.ownerId!==context\.id/);
});

test('model containment renders diagram rows beneath semantic owners',()=>{
  assert.match(tree,/row\.dataset\.type='diagram'/);
  assert.match(tree,/diagram\.ownerId/);
  assert.match(tree,/ownerRow\(tree,diagram\.ownerId\)/);
});

test('properties expose all semantically allowed owned child kinds from the profile',()=>{
  assert.match(owned,/ownerKinds\?\.includes/);
  assert.match(owned,/Owned semantic content/);
  assert.match(owned,/Valid owned types/);
});

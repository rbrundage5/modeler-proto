import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const child=fs.readFileSync(new URL('../public/src/child-diagram-navigation.js',import.meta.url),'utf8');
const tree=fs.readFileSync(new URL('../public/src/diagram-containment-tree.js',import.meta.url),'utf8');
const owned=fs.readFileSync(new URL('../public/src/owned-semantic-content.js',import.meta.url),'utf8');

test('child diagram capability is not limited to BDD/IBD drilldown',()=>{
  for(const token of ["ConstraintBlock:['Block Definition Diagram','Parametric Diagram'","UseCase:['Use Case Diagram','Sequence Diagram'","Activity:['Activity Diagram','Requirement Diagram','Allocation Diagram'","Requirement:['Requirement Diagram']","InstanceSpecification:['Instance Diagram']"])assert.match(child,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(child,/definition\.contextKinds/);
});

test('child diagrams are semantically owned and indexed beneath the owning element',()=>{
  assert.match(child,/ownerId:owner\.id,contextId:owner\.id/);
  assert.match(child,/owner\.childDiagramIds/);
  assert.match(child,/primaryChildDiagramId/);
  assert.match(child,/normalizeDiagramContainment/);
});

test('model containment renders diagram rows beneath semantic owners',()=>{
  assert.match(tree,/data-type=\\"diagram\\"/);
  assert.match(tree,/diagram\.ownerId/);
  assert.match(tree,/ownerRow\(tree,diagram\.ownerId\)/);
});

test('properties expose all semantically allowed owned child kinds from the profile',()=>{
  assert.match(owned,/d\.ownerKinds\?\.includes/);
  assert.match(owned,/Owned semantic content/);
  assert.match(owned,/Valid owned types/);
});

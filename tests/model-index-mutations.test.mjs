import test from 'node:test';
import assert from 'node:assert/strict';
import {buildProjectIndex,indexedChildren,indexedElement,indexedRelationship,indexedRelationshipsFor} from '../public/src/model-index.js';
import {indexElementAdded,indexElementMoved,indexElementRemoved,indexRelationshipAdded,indexRelationshipRemoved} from '../public/src/model-index-mutations.js';

test('incremental mutation hooks keep indexes coherent',()=>{
  const project={root:{id:'root'},elements:[],relationships:[],diagrams:[]};buildProjectIndex(project);
  const a={id:'a',externalId:'A',ownerId:'root'},b={id:'b',externalId:'B',ownerId:'a'};project.elements.push(a,b);indexElementAdded(project,a);indexElementAdded(project,b);
  assert.equal(indexedElement(project,'b'),b);assert.deepEqual(indexedChildren(project,'a'),[b]);
  b.ownerId='root';indexElementMoved(project,b,'a');assert.deepEqual(indexedChildren(project,'a'),[]);assert.ok(indexedChildren(project,'root').includes(b));
  const r={id:'r',sourceId:'a',targetId:'b'};project.relationships.push(r);indexRelationshipAdded(project,r);assert.equal(indexedRelationship(project,'r'),r);assert.ok(indexedRelationshipsFor(project,'b').includes(r));
  indexRelationshipRemoved(project,r);assert.equal(indexedRelationship(project,'r'),null);
  indexElementRemoved(project,b);assert.equal(indexedElement(project,'b'),null);
});

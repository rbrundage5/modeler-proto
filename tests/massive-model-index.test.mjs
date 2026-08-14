import test from 'node:test';
import assert from 'node:assert/strict';
import {buildProjectIndex,indexedChildren,indexedElement,indexedRelationship,indexedRelationshipsFor,indexStats} from '../public/src/model-index.js';

test('indexes 100k elements and relationships with stable identity lookup',()=>{
  const count=100000;
  const project={root:{id:'root'},elements:Array.from({length:count},(_,i)=>({id:`e-${i}`,externalId:`EXT-${i}`,ownerId:i<100?'root':`e-${i%100}`})),relationships:Array.from({length:count},(_,i)=>({id:`r-${i}`,sourceId:`e-${i}`,targetId:`e-${(i+1)%count}`})),diagrams:[]};
  buildProjectIndex(project);
  assert.equal(indexedElement(project,'e-99999')?.id,'e-99999');
  assert.equal(indexedRelationship(project,'r-99999')?.id,'r-99999');
  assert.ok(indexedChildren(project,'root').length>=100);
  assert.ok(indexedRelationshipsFor(project,'e-50000').length>=1);
  assert.deepEqual(indexStats(project),{elements:100001,relationships:100000,diagrams:0});
});

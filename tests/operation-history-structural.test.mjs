import test from 'node:test';
import assert from 'node:assert/strict';
import {buildProjectIndex,indexedElement,indexedRelationship} from '../public/src/model-index.js';
import {HistoryController} from '../public/src/history-controller.js';

function project(){return{root:{id:'root',name:'Root'},elements:[{id:'parent',externalId:'P',name:'Parent',ownerId:'root',kind:'Block'},{id:'child',externalId:'C',name:'Child',ownerId:'parent',kind:'Block'}],relationships:[{id:'r1',sourceId:'parent',targetId:'child',kind:'Dependency'}],diagrams:[{id:'d1',nodes:[{id:'n1',elementId:'parent',x:10,y:10,width:100,height:60},{id:'n2',elementId:'child',x:200,y:10,width:100,height:60}],edges:[{id:'edge1',relationshipId:'r1',sourceNodeId:'n1',targetNodeId:'n2'}]}]}}

test('delete element history stores and restores only deleted subtree impact',()=>{const p=project();buildProjectIndex(p);const h=new HistoryController(p);h.apply({type:'delete-element',elementId:'parent'});assert.equal(indexedElement(p,'parent'),null);assert.equal(indexedElement(p,'child'),null);assert.equal(indexedRelationship(p,'r1'),null);assert.equal(h.undo(),true);assert.equal(indexedElement(p,'parent').name,'Parent');assert.equal(indexedElement(p,'child').ownerId,'parent');assert.equal(indexedRelationship(p,'r1').targetId,'child');assert.equal(p.diagrams[0].nodes.length,2);assert.equal(p.diagrams[0].edges.length,1);assert.equal(h.redo(),true);assert.equal(indexedElement(p,'parent'),null)});

test('relationship deletion restores semantic record and every presentation',()=>{const p=project();buildProjectIndex(p);const h=new HistoryController(p);h.apply({type:'delete-relationship',relationshipId:'r1'});assert.equal(indexedRelationship(p,'r1'),null);assert.equal(p.diagrams[0].edges.length,0);h.undo();assert.equal(indexedRelationship(p,'r1').kind,'Dependency');assert.equal(p.diagrams[0].edges[0].id,'edge1')});

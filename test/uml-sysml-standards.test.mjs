import test from 'node:test';
import assert from 'node:assert/strict';
import {createProject,defaultElement,defaultRelationship} from '../public/src/model.js';
import {normalizeBddRelationship,bddRelationshipIssues} from '../public/src/bdd-relationships.js';
import {RELATIONSHIP_STANDARD_CONTRACT,ELEMENT_STANDARD_FAMILY,normalizeStandardRelationship,relationshipStandardStyle,relationshipStandardIssues,standardsCoverageIssues,setAggregateEnd} from '../public/src/uml-sysml-standards.js';
import {ELEMENTS,RELATIONSHIPS} from '../public/src/sysml-profile.js';

test('every declared UML/SysML element and relationship has a standards contract',()=>{
  assert.deepEqual(standardsCoverageIssues(),[]);
  assert.deepEqual(Object.keys(ELEMENT_STANDARD_FAMILY).sort(),Object.keys(ELEMENTS).sort());
  assert.deepEqual(Object.keys(RELATIONSHIP_STANDARD_CONTRACT).sort(),Object.keys(RELATIONSHIPS).sort());
});

test('Composition factory makes the whole owner the source composite end',()=>{
  const r=defaultRelationship('Composition','whole','part','owner');
  normalizeStandardRelationship(r);
  assert.equal(r.sourceId,'whole');assert.equal(r.targetId,'part');
  assert.equal(r.sourceAggregation,'composite');assert.equal(r.targetAggregation,'none');
  assert.equal(r.ownerEnd,'source');
  const style=relationshipStandardStyle(r);
  assert.equal(style.sourceMarker,'diamondFilled');assert.equal(style.targetMarker,'none');
});

test('legacy target-composite relationship is reversed so the actual whole becomes source',()=>{
  const r={kind:'Composition',sourceId:'part',targetId:'whole',sourceRole:'child',targetRole:'owner',sourceMultiplicity:'1',targetMultiplicity:'1',sourceNavigable:true,targetNavigable:true,sourceAggregation:'none',targetAggregation:'composite',sourceEndId:'child-end',targetEndId:'owner-end'};
  normalizeStandardRelationship(r);
  assert.equal(r.sourceId,'whole');assert.equal(r.targetId,'part');
  assert.equal(r.sourceRole,'owner');assert.equal(r.targetRole,'child');
  assert.equal(r.sourceEndId,'owner-end');assert.equal(r.targetEndId,'child-end');
  assert.equal(r.sourceAggregation,'composite');assert.equal(r.targetAggregation,'none');
  assert.equal(relationshipStandardStyle(r).sourceMarker,'diamondFilled');
});

test('legacy target-shared Aggregation is reversed to aggregate source',()=>{
  const r={kind:'Aggregation',sourceId:'part',targetId:'whole',sourceAggregation:'none',targetAggregation:'shared'};
  normalizeStandardRelationship(r);
  assert.equal(r.sourceId,'whole');assert.equal(r.targetId,'part');
  assert.equal(r.sourceAggregation,'shared');assert.equal(r.targetAggregation,'none');
  assert.equal(relationshipStandardStyle(r).sourceMarker,'diamond');
});

test('setAggregateEnd target reverses endpoints but leaves canonical owner at source',()=>{
  const r=defaultRelationship('Composition','whole','part','owner');setAggregateEnd(r,'target');
  assert.equal(r.sourceId,'part');assert.equal(r.targetId,'whole');
  assert.equal(r.sourceAggregation,'composite');assert.equal(r.targetAggregation,'none');assert.equal(r.ownerEnd,'source');
});

test('Composition and Aggregation reject a diamond on the child target end',()=>{
  const c=relationshipStandardIssues({id:'c',kind:'Composition',sourceAggregation:'none',targetAggregation:'composite'});
  const a=relationshipStandardIssues({id:'a',kind:'Aggregation',sourceAggregation:'none',targetAggregation:'shared'});
  assert.ok(c.some(i=>i.code==='UML_COMPOSITION_OWNER_SOURCE'));
  assert.ok(c.some(i=>i.code==='UML_PART_TARGET_AGGREGATION'));
  assert.ok(a.some(i=>i.code==='UML_AGGREGATION_OWNER_SOURCE'));
});

test('Generalization and Realization use UML target-end hollow triangles',()=>{
  assert.deepEqual(relationshipStandardStyle({kind:'Generalization'}),{...RELATIONSHIP_STANDARD_CONTRACT.Generalization,dashed:false});
  assert.equal(relationshipStandardStyle({kind:'Generalization'}).targetMarker,'triangle');
  assert.equal(relationshipStandardStyle({kind:'Realization'}).targetMarker,'triangle');
  assert.equal(relationshipStandardStyle({kind:'Realization'}).dashed,true);
});

test('Use Case include and extend normalize required UML stereotypes',()=>{
  const include={kind:'Include',stereotype:''},extend={kind:'Extend',stereotype:''};
  normalizeStandardRelationship(include);normalizeStandardRelationship(extend);
  assert.equal(include.stereotype,'include');assert.equal(extend.stereotype,'extend');
  assert.equal(relationshipStandardStyle(include).targetMarker,'open');assert.equal(relationshipStandardStyle(include).dashed,true);
});

test('binary Composition cannot be composite at both ends',()=>{
  const issues=relationshipStandardIssues({id:'c',kind:'Composition',sourceAggregation:'composite',targetAggregation:'composite'});
  assert.ok(issues.some(i=>i.code==='UML_DOUBLE_COMPOSITE'));
});

test('BDD Composition creation semantics are whole owner first and part child second',()=>{
  const p=createProject('Standards'),whole=defaultElement('Block',p.root.id),part=defaultElement('Block',p.root.id);whole.id='whole';part.id='part';p.elements.push(whole,part);
  const r=normalizeBddRelationship(defaultRelationship('Composition',whole.id,part.id,p.root.id));
  assert.equal(r.sourceId,'whole');assert.equal(r.targetId,'part');
  assert.equal(r.sourceAggregation,'composite');assert.equal(r.targetAggregation,'none');
  assert.deepEqual(bddRelationshipIssues(p,r),[]);
});

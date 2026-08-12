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

test('Composition preserves the composite whole on the second/target endpoint',()=>{
  const r=defaultRelationship('Composition','part','whole','owner');
  normalizeStandardRelationship(r);
  assert.equal(r.sourceAggregation,'none');
  assert.equal(r.targetAggregation,'composite');
  assert.equal(r.aggregateEnd,'target');
  const style=relationshipStandardStyle(r);
  assert.equal(style.sourceMarker,'none');
  assert.equal(style.targetMarker,'diamondFilled');
});

test('bad owner-source migration from the previous release is corrected for UI-created Composition',()=>{
  const r={kind:'Composition',sourceId:'part',targetId:'whole',sourceAggregation:'composite',targetAggregation:'none'};
  normalizeStandardRelationship(r);
  assert.equal(r.sourceAggregation,'none');
  assert.equal(r.targetAggregation,'composite');
  assert.equal(r.correctedOwnerEndMigration,true);
});

test('explicit imported source composite end is preserved',()=>{
  const r={kind:'Composition',sourceId:'whole',targetId:'part',sourceAggregation:'composite',targetAggregation:'none',importSource:{file:'model.xlsx'}};
  normalizeStandardRelationship(r);
  assert.equal(r.sourceAggregation,'composite');
  assert.equal(r.targetAggregation,'none');
  assert.equal(relationshipStandardStyle(r).sourceMarker,'diamondFilled');
});

test('shared Aggregation defaults to the second/whole endpoint',()=>{
  const r=defaultRelationship('Aggregation','part','whole','owner');
  normalizeStandardRelationship(r);
  assert.equal(r.sourceAggregation,'none');
  assert.equal(r.targetAggregation,'shared');
  assert.equal(relationshipStandardStyle(r).targetMarker,'diamond');
});

test('aggregate end can be explicitly switched without changing endpoints',()=>{
  const r=defaultRelationship('Composition','part','whole','owner');normalizeStandardRelationship(r);setAggregateEnd(r,'source');
  assert.equal(r.sourceId,'part');assert.equal(r.targetId,'whole');assert.equal(r.sourceAggregation,'composite');assert.equal(r.targetAggregation,'none');assert.equal(r.aggregateEndExplicit,true);
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
  assert.equal(include.stereotype,'include');
  assert.equal(extend.stereotype,'extend');
  assert.equal(relationshipStandardStyle(include).targetMarker,'open');
  assert.equal(relationshipStandardStyle(include).dashed,true);
});

test('binary Composition cannot be composite at both ends',()=>{
  const issues=relationshipStandardIssues({id:'c',kind:'Composition',sourceAggregation:'composite',targetAggregation:'composite'});
  assert.ok(issues.some(i=>i.code==='UML_DOUBLE_COMPOSITE'));
});

test('BDD Composition creation semantics are part/child first and whole/owner second',()=>{
  const p=createProject('Standards'),part=defaultElement('Block',p.root.id),whole=defaultElement('Block',p.root.id);part.id='part';whole.id='whole';p.elements.push(part,whole);
  const r=normalizeBddRelationship(defaultRelationship('Composition',part.id,whole.id,p.root.id));
  assert.equal(r.sourceAggregation,'none');
  assert.equal(r.targetAggregation,'composite');
  assert.deepEqual(bddRelationshipIssues(p,r),[]);
});

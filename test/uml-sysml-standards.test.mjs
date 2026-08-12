import test from 'node:test';
import assert from 'node:assert/strict';
import {createProject,defaultElement,defaultRelationship} from '../public/src/model.js';
import {normalizeBddRelationship,bddRelationshipIssues} from '../public/src/bdd-relationships.js';
import {RELATIONSHIP_STANDARD_CONTRACT,ELEMENT_STANDARD_FAMILY,normalizeStandardRelationship,relationshipStandardStyle,relationshipStandardIssues,standardsCoverageIssues} from '../public/src/uml-sysml-standards.js';
import {ELEMENTS,RELATIONSHIPS} from '../public/src/sysml-profile.js';

test('every declared UML/SysML element and relationship has a standards contract',()=>{
  assert.deepEqual(standardsCoverageIssues(),[]);
  assert.deepEqual(Object.keys(ELEMENT_STANDARD_FAMILY).sort(),Object.keys(ELEMENTS).sort());
  assert.deepEqual(Object.keys(RELATIONSHIP_STANDARD_CONTRACT).sort(),Object.keys(RELATIONSHIPS).sort());
});

test('Composition places the filled diamond on the composite owner/source end',()=>{
  const r=defaultRelationship('Composition','whole','part','owner');
  r.sourceAggregation='none';r.targetAggregation='composite';
  normalizeStandardRelationship(r);
  assert.equal(r.sourceAggregation,'composite');
  assert.equal(r.targetAggregation,'none');
  const style=relationshipStandardStyle(r);
  assert.equal(style.sourceMarker,'diamondFilled');
  assert.equal(style.targetMarker,'none');
});

test('shared Aggregation places the hollow diamond on the aggregate/source end',()=>{
  const r=defaultRelationship('Aggregation','whole','part','owner');
  r.sourceAggregation='none';r.targetAggregation='shared';
  normalizeStandardRelationship(r);
  assert.equal(r.sourceAggregation,'shared');
  assert.equal(r.targetAggregation,'none');
  assert.equal(relationshipStandardStyle(r).sourceMarker,'diamond');
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

test('BDD Composition creation semantics are whole/source to part/target',()=>{
  const p=createProject('Standards'),whole=defaultElement('Block',p.root.id),part=defaultElement('Block',p.root.id);whole.id='whole';part.id='part';p.elements.push(whole,part);
  const r=normalizeBddRelationship(defaultRelationship('Composition',whole.id,part.id,p.root.id));
  assert.equal(r.sourceAggregation,'composite');
  assert.equal(r.targetAggregation,'none');
  assert.deepEqual(bddRelationshipIssues(p,r),[]);
});

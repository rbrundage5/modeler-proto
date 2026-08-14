import test from 'node:test';
import assert from 'node:assert/strict';
import {createProject,defaultElement,graphSafetyIssues,normalizeProject,refreshQualifiedNames} from '../public/src/model.js';
import {ancestorClassifiers} from '../public/src/semantic-core.js';

test('deep valid ownership and generalization graphs terminate without recursive stack overflow',()=>{
  const project=createProject('Deep');let owner=project.root.id;
  for(let i=0;i<12000;i++){const e=defaultElement('Package',owner);e.id=`P${i}`;e.externalId=e.id;e.name=`P${i}`;project.elements.push(e);owner=e.id}
  assert.doesNotThrow(()=>refreshQualifiedNames(project));
  assert.equal(project.elements.at(-1).qualifiedNameString.endsWith('P11999'),true);
  const classifiers=[];for(let i=0;i<12000;i++){const e=defaultElement('Block',project.root.id);e.id=`B${i}`;project.elements.push(e);classifiers.push(e);if(i)project.relationships.push({id:`G${i}`,kind:'Generalization',sourceId:e.id,targetId:classifiers[i-1].id})}
  assert.equal(ancestorClassifiers(project,'B11999').length,11999);
});

test('ownership cycle reports stable ID path instead of recursing',()=>{
  const project=createProject('Cycle'),a=defaultElement('Package',project.root.id),b=defaultElement('Package',project.root.id);a.id='A';b.id='B';a.ownerId='B';b.ownerId='A';project.elements.push(a,b);
  const issue=graphSafetyIssues(project).find(item=>item.code==='OWNERSHIP_CYCLE');assert.ok(issue);assert.deepEqual(issue.path,['A','B','A']);
  assert.throws(()=>normalizeProject(project),error=>error.code==='OWNERSHIP_CYCLE'&&error.path.join('>')==='A>B>A');
});

test('diagram parent and presentation parent cycles are rejected explicitly',()=>{
  const project=createProject('Diagram cycles');project.diagrams=[{id:'D1',parentDiagramId:'D2',nodes:[],edges:[]},{id:'D2',parentDiagramId:'D1',nodes:[],edges:[]},{id:'D3',nodes:[{id:'N1',parentPresentationId:'N2'},{id:'N2',parentPresentationId:'N1'}],edges:[]}];
  const codes=graphSafetyIssues(project).map(issue=>issue.code);assert.ok(codes.includes('DIAGRAM_PARENT_CYCLE'));assert.ok(codes.includes('PRESENTATION_PARENT_CYCLE'));
});

test('repeated imported property path segment reports PROPERTY_PATH_CYCLE',()=>{
  const project=createProject('Paths');project.diagrams=[{id:'D1',nodes:[{id:'N1',propertyPath:[{propertyId:'P1'},{propertyId:'P2'},{propertyId:'P1'}]}],edges:[]}];
  const issue=graphSafetyIssues(project).find(item=>item.code==='PROPERTY_PATH_CYCLE');assert.ok(issue);assert.deepEqual(issue.path,['P1','P2','P1']);
});

test('normalization reentry is guarded',()=>{
  const project=createProject('Guard');assert.doesNotThrow(()=>normalizeProject(project));assert.doesNotThrow(()=>normalizeProject(project));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {createProject,defaultElement,defaultRelationship,uid} from '../public/src/model.js';
import {applyOperation,canRebaseOperation} from '../public/src/operations.js';
import {validate} from '../public/src/validator.js';

function addPackage(project,name='Structure'){
  const p=defaultElement('Package',project.root.id);p.name=name;project.elements.push(p);return p;
}
function addDiagram(project,ownerId){
  const d={id:uid('diagram'),externalId:uid('DGM').toUpperCase(),name:'Test BDD',diagramType:'Block Definition Diagram',ownerId,contextId:ownerId,nodes:[],edges:[],documentation:''};
  project.diagrams.push(d);project.activeDiagramId=d.id;return d;
}

test('new projects are blank',()=>{const p=createProject('T');assert.equal(p.elements.length,0);assert.equal(p.diagrams.length,0);assert.equal(p.metadata.seededPackages,false)});
test('field operations merge independently',()=>{const p=createProject('T'),pkg=addPackage(p),a=defaultElement('Block',pkg.id);p.elements.push(a);assert.equal(canRebaseOperation(p,{type:'set-property',targetId:a.id,property:'name',expectedValue:'Block'}),true);applyOperation(p,{type:'set-property',targetId:a.id,property:'name',value:'System',expectedValue:'Block'});assert.equal(a.name,'System')});
test('requirements are validated',()=>{const p=createProject('T'),pkg=addPackage(p,'Requirements'),r=defaultElement('Requirement',pkg.id);p.elements.push(r);const codes=validate(p).map(x=>x.code);assert(codes.includes('REQUIRED_FIELD'))});
test('relationship operation persists semantic and presentation records',()=>{const p=createProject('T'),pkg=addPackage(p),d=addDiagram(p,pkg.id),a=defaultElement('Block',pkg.id),b=defaultElement('Block',pkg.id);p.elements.push(a,b);const rel=defaultRelationship('Association',a.id,b.id,pkg.id),edge={id:uid('edge'),relationshipId:rel.id,sourceId:a.id,targetId:b.id};applyOperation(p,{type:'create-relationship',relationship:rel,diagramId:d.id,edge});assert.equal(p.relationships.length,1);assert.equal(d.edges.length,1)});

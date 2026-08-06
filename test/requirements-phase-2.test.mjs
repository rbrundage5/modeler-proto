import test from 'node:test';
import assert from 'node:assert/strict';
import {applyOperation,canRebaseOperation} from '../public/src/operations.js';
import {createProject,defaultElement} from '../public/src/model.js';
import {canMoveRequirement,moveRequirement,requirementAncestors,requirementBreadcrumb,requirementChildren} from '../public/src/requirements.js';
import {validate} from '../public/src/validator.js';

function add(project,kind,name,ownerId=project.root.id){const element=defaultElement(kind,ownerId);element.name=name;if(kind==='Requirement'){element.requirementId=name;element.requirementText=`${name} text`}project.elements.push(element);return element}

test('requirement containment preserves IDs and is distinct from derivation',()=>{
  const project=createProject('Hierarchy'),pkg=add(project,'Package','Requirements'),parent=add(project,'Requirement','PARENT',pkg.id),child=add(project,'Requirement','CHILD',pkg.id),id=child.id,externalId=child.externalId;
  assert(canMoveRequirement(project,child.id,parent.id));moveRequirement(project,child.id,parent.id);
  assert.equal(child.ownerId,parent.id);assert.equal(child.id,id);assert.equal(child.externalId,externalId);assert.equal(project.relationships.length,0);assert.deepEqual(requirementAncestors(project,child.id).map(item=>item.id),[project.root.id,pkg.id,parent.id]);assert.match(requirementBreadcrumb(project,child.id),/Requirements.*PARENT.*CHILD/);
});

test('requirement containment rejects cycles and invalid owners',()=>{
  const project=createProject('Hierarchy'),parent=add(project,'Requirement','PARENT'),child=add(project,'Requirement','CHILD',parent.id),block=add(project,'Block','Block');
  assert.equal(canMoveRequirement(project,parent.id,child.id),false);assert.throws(()=>moveRequirement(project,parent.id,child.id),/cyclic/);assert.equal(canMoveRequirement(project,parent.id,block.id),false);
  parent.ownerId=child.id;assert(validate(project).some(issue=>issue.code==='REQUIREMENT_CONTAINMENT_CYCLE'));
});

test('siblings reorder deterministically and collaboration move operations replay',()=>{
  const project=createProject('Hierarchy'),parent=add(project,'Requirement','PARENT'),a=add(project,'Requirement','A',parent.id),b=add(project,'Requirement','B',parent.id),c=add(project,'Requirement','C',parent.id);
  moveRequirement(project,c.id,parent.id,0);assert.deepEqual(requirementChildren(project,parent.id).map(item=>item.id),[c.id,a.id,b.id]);
  const operation={type:'move-element',elementId:b.id,targetOwnerId:project.root.id,expectedOwnerId:parent.id};assert(canRebaseOperation(project,operation));applyOperation(project,operation);assert.equal(b.ownerId,project.root.id);
});

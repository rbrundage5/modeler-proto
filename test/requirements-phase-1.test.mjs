import test from 'node:test';
import assert from 'node:assert/strict';
import {createProject,defaultElement,normalizeProject} from '../public/src/model.js';
import {DEFAULT_REQUIREMENT_POLICY,REQUIREMENT_TYPES,requirementPolicy} from '../public/src/requirements.js';
import {validate} from '../public/src/validator.js';

test('requirements keep semantic, external, and requirement IDs separate',()=>{
  const project=createProject('Requirements'),requirement=defaultElement('Requirement',project.root.id);
  requirement.requirementId='SYS-001';project.elements.push(requirement);
  assert.notEqual(requirement.id,requirement.externalId);assert.notEqual(requirement.id,requirement.requirementId);assert.equal(requirement.metaclass,'Class');assert.equal(requirement.stereotype,'requirement');
  for(const field of ['requirementType','requirementText','sourceUri','sourceSection','sourceRevision','rationale','risk','priority','lifecycleStatus','maturity','verificationMethod','verificationStatus','responsibleRole','approver','approvalDate','createdDate','modifiedDate','baselineIds','suspect','tags','customStereotypeProperties'])assert(Object.hasOwn(requirement,field),field);
  assert(REQUIREMENT_TYPES.includes('Business Requirement'));
});

test('normalization adds compatible requirement policies and fields to legacy projects',()=>{
  const project=createProject('Legacy'),legacy={id:'legacy',externalId:'EXT-1',name:'Legacy',kind:'Requirement',ownerId:project.root.id,requirementId:'L-1',requirementText:'Text'};project.elements.push(legacy);normalizeProject(project);
  assert.deepEqual(requirementPolicy(project).statuses,DEFAULT_REQUIREMENT_POLICY.statuses);assert.equal(legacy.lifecycleStatus,'Draft');assert.equal(legacy.externalId,'EXT-1');
});

test('requirement policies validate required and unique IDs, text, and controlled values',()=>{
  const project=createProject('Policy'),a=defaultElement('Requirement',project.root.id),b=defaultElement('Requirement',project.root.id);a.requirementId=b.requirementId='DUP';a.requirementText='';b.requirementText='Valid';a.lifecycleStatus='Unknown';a.priority='Urgent';a.verificationMethod='Guess';project.elements.push(a,b);
  const codes=new Set(validate(project).map(issue=>issue.code));
  for(const code of ['REQUIREMENT_ID_DUPLICATE','REQUIREMENT_TEXT_REQUIRED','REQUIREMENT_STATUS_INVALID','REQUIREMENT_PRIORITY_INVALID','REQUIREMENT_VERIFICATION_METHOD_INVALID'])assert(codes.has(code),code);
  project.settings.requirements={...DEFAULT_REQUIREMENT_POLICY,requireText:false,uniqueId:false,statuses:[...DEFAULT_REQUIREMENT_POLICY.statuses,'Unknown'],priorities:[...DEFAULT_REQUIREMENT_POLICY.priorities,'Urgent'],verificationMethods:[...DEFAULT_REQUIREMENT_POLICY.verificationMethods,'Guess']};
  const configured=new Set(validate(project).map(issue=>issue.code));assert(!configured.has('REQUIREMENT_ID_DUPLICATE'));assert(!configured.has('REQUIREMENT_TEXT_REQUIRED'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {createProject,defaultElement,defaultRelationship} from '../public/src/model.js';
import {applyValidationQuickFix,validate,validationQuickFix} from '../public/src/validator.js';

test('validation quick fixes repair safe element defaults',()=>{
  const project=createProject('Quick fixes'),element=defaultElement('FlowProperty',project.root.id);
  element.name='';element.direction='sideways';element.multiplicity='5..2';element.multiplicityLower='5';element.multiplicityUpper='2';project.elements.push(element);
  for(const code of ['NAME_REQUIRED','FEATURE_DIRECTION','MULTIPLICITY']){
    const issue=validate(project).find(item=>item.code===code&&item.id===element.id);
    assert(validationQuickFix(project,issue));assert.equal(applyValidationQuickFix(project,issue),true);
  }
  assert.equal(element.name,'FlowProperty');assert.equal(element.direction,'inout');assert.equal(element.multiplicity,'1');
});

test('validation quick fixes repair safe relationship defaults',()=>{
  const project=createProject('Quick fixes'),source=defaultElement('Block',project.root.id),target=defaultElement('Block',project.root.id);
  project.elements.push(source,target);const relationship=defaultRelationship('Association',source.id,target.id,project.root.id);relationship.sourceMultiplicity='bad';relationship.targetAggregation='invalid';project.relationships.push(relationship);
  for(const code of ['ASSOCIATION_MULTIPLICITY','ASSOCIATION_AGGREGATION']){
    const issue=validate(project).find(item=>item.code===code&&item.id===relationship.id);
    assert.equal(applyValidationQuickFix(project,issue),true);
  }
  assert.equal(relationship.sourceMultiplicity,'1');assert.equal(relationship.targetAggregation,'none');
});

test('unsafe validation issues do not advertise automatic fixes',()=>{
  const project=createProject('No guesswork'),property=defaultElement('PartProperty',project.root.id);project.elements.push(property);
  const issue=validate(project).find(item=>item.code==='TYPE_REQUIRED'&&item.id===property.id);
  assert.equal(validationQuickFix(project,issue),null);assert.equal(applyValidationQuickFix(project,issue),false);
});

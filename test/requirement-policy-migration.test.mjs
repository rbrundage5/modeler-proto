import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_REQUIREMENT_POLICY,requirementIssues,requirementPolicy} from '../public/src/requirements.js';

test('legacy custom Requirement policy retains mandatory lifecycle vocabulary',()=>{
  const project={
    root:{id:'root',kind:'Model'},
    elements:[{id:'req',kind:'Requirement',ownerId:'root',name:'Baseline requirement',requirementId:'REQ-1',requirementText:'Text',lifecycleStatus:'Baseline',priority:'Medium',verificationMethod:'Analysis'}],
    settings:{requirements:{statuses:['Draft','Approved'],priorities:['Urgent'],verificationMethods:['Review']}}
  };
  const policy=requirementPolicy(project);
  for(const status of DEFAULT_REQUIREMENT_POLICY.statuses)assert.ok(policy.statuses.includes(status),status);
  for(const priority of DEFAULT_REQUIREMENT_POLICY.priorities)assert.ok(policy.priorities.includes(priority),priority);
  for(const method of DEFAULT_REQUIREMENT_POLICY.verificationMethods)assert.ok(policy.verificationMethods.includes(method),method);
  assert.ok(policy.priorities.includes('Urgent'));
  assert.ok(policy.verificationMethods.includes('Review'));
  assert.equal(requirementIssues(project).some(issue=>issue.code==='REQUIREMENT_STATUS_INVALID'),false);
});

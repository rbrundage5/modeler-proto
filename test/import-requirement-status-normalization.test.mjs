import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeImportedRequirementFields} from '../public/src/importer.js';

test('imported Requirement lifecycle statuses normalize without discarding source values',()=>{
  for(const [source,expected] of [[' draft ','Draft'],['BASELINE','Baseline'],['Pending Review','In Review'],['Active','Approved'],['Archived','Retired']]){
    const requirement={kind:'Requirement',lifecycleStatus:source,priority:'Medium',verificationMethod:'Analysis'};
    normalizeImportedRequirementFields(requirement);
    assert.equal(requirement.lifecycleStatus,expected,source);
    assert.equal(requirement.importedLifecycleStatus,undefined,source);
  }
  const requirement={kind:'Requirement',lifecycleStatus:'Vendor Gate 4',priority:'',verificationMethod:'Vendor Review'};
  normalizeImportedRequirementFields(requirement);
  assert.equal(requirement.lifecycleStatus,'Draft');
  assert.equal(requirement.importedLifecycleStatus,'Vendor Gate 4');
  assert.equal(requirement.priority,'Medium');
  assert.equal(requirement.verificationMethod,'Analysis');
  assert.equal(requirement.verificationObjective,'Vendor Review');
});

test('normalization repairs requirements already present before the next workbook import',()=>{
  const requirement={kind:'Requirement',lifecycleStatus:'ACTIVE',priority:'Medium',verificationMethod:'Test'};
  normalizeImportedRequirementFields(requirement);
  assert.equal(requirement.lifecycleStatus,'Approved');
});

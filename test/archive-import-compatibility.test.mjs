import test from 'node:test';
import assert from 'node:assert/strict';
import {coalesceImportedRelationships,normalizeImportedTestCaseFields} from '../public/src/importer.js';

test('archive importer coalesces equivalent relationship rows and preserves stable aliases',()=>{
  const first={id:'rel-a',externalId:'REL-A',kind:'DeriveReqt',sourceId:'req-a',targetId:'req-b'};
  const duplicate={id:'rel-b',externalId:'REL-B',kind:'DeriveReqt',sourceId:'req-a',targetId:'req-b'};
  const project={relationships:[first,duplicate],diagrams:[{edges:[{relationshipId:'rel-b'}]}]};
  const relationshipAlias=new Map(),ctx={project,relationshipAlias,report:{relationships:{skipped:0}}};
  coalesceImportedRelationships(ctx);
  assert.equal(project.relationships.length,1);
  assert.deepEqual(first.alternateExternalIds,['REL-B']);
  assert.equal(project.diagrams[0].edges[0].relationshipId,'rel-a');
  assert.equal(relationshipAlias.get('REL-B'),'rel-a');
  assert.equal(ctx.report.relationships.skipped,1);
});

test('archive importer supplies valid planning defaults while preserving vendor values',()=>{
  const testCase={kind:'TestCase',id:'case',externalId:'CASE-1',name:'Verification Case',documentation:'Confirm behavior',verificationMethod:'Review',verificationLevel:'Enterprise',plannedStatus:'Active'};
  normalizeImportedTestCaseFields(testCase);
  assert.equal(testCase.verificationCaseId,'CASE-1');
  assert.equal(testCase.verificationObjective,'Confirm behavior');
  assert.equal(testCase.verificationMethod,'Test');
  assert.equal(testCase.verificationLevel,'System');
  assert.equal(testCase.plannedStatus,'Draft');
  assert.equal(testCase.importedVerificationMethod,'Review');
  assert.equal(testCase.importedVerificationLevel,'Enterprise');
  assert.equal(testCase.importedPlannedStatus,'Active');
});

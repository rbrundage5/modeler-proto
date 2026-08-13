import test from 'node:test';
import assert from 'node:assert/strict';
import {DIAGRAMS,ELEMENTS,RELATIONSHIPS,SYSML_VERSION} from '../public/src/sysml-profile.js';
import {SYSML_DISTILLED_PROFILE,SYSML_DISTILLED_DIAGRAM_INVENTORY,CONTEXTUAL_NOTATION,PRESENTATION_VARIANTS,LEGACY_COMPATIBILITY,distilledInventoryIssues} from '../public/src/sysml-distilled-inventory.js';

test('book diagram inventory is mapped into the current SysML profile',()=>{
  assert.equal(SYSML_VERSION,'1.6');
  assert.equal(SYSML_DISTILLED_PROFILE.targetVersion,'1.6');
  assert.deepEqual(distilledInventoryIssues(DIAGRAMS,ELEMENTS,RELATIONSHIPS),[]);
  assert.equal(Object.keys(SYSML_DISTILLED_DIAGRAM_INVENTORY).length,9);
});

test('notation variants remain presentation modes instead of duplicate semantic kinds',()=>{
  assert.ok(PRESENTATION_VARIANTS.Requirement.includes('callout'));
  assert.ok(PRESENTATION_VARIANTS.Allocate.includes('activity-partition'));
  assert.ok(PRESENTATION_VARIANTS.Rationale.includes('comment-stereotype'));
  assert.ok(CONTEXTUAL_NOTATION['Sequence Diagram'].includes('DestructionOccurrence'));
  assert.equal(ELEMENTS.SystemBoundary,undefined);
});

test('deprecated flow and standard port notation has explicit 1.6 compatibility mapping',()=>{
  assert.equal(LEGACY_COMPATIBILITY.StandardPort.target,'FullPort');
  assert.equal(LEGACY_COMPATIBILITY.AtomicFlowPort.target,'ProxyPort');
  assert.equal(LEGACY_COMPATIBILITY.NonatomicFlowPort.status,'deprecated');
});

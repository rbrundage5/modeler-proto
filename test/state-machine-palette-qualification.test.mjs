import test from 'node:test';
import assert from 'node:assert/strict';
import {DIAGRAMS} from '../public/src/sysml-profile.js';
import {diagramCapability,elementCapabilityFor,relationshipCapabilityFor} from '../public/src/sysml/conformance-registry.js';
import {inventoryForDiagram} from '../public/src/supported-type-inventory.js';

test('every State Machine palette element is advertised as complete',()=>{
  const expected=new Set(DIAGRAMS['State Machine Diagram'].elements);
  const entries=inventoryForDiagram('State Machine Diagram','element');
  assert.deepEqual(new Set(entries.map(item=>item.canonicalType)),expected);
  for(const item of entries){
    assert.equal(item.supportStatus,'complete',`${item.canonicalType} must not be shown as partial`);
    assert.equal(elementCapabilityFor('State Machine Diagram',item.canonicalType)?.maturity,'working');
    assert.equal(item.knownLimitations.length,0,`${item.canonicalType} must not retain stale State Machine qualification limitations`);
  }
});

test('State Machine diagram and Transition capability use the completion fixture',()=>{
  const diagram=diagramCapability('State Machine Diagram');
  assert.equal(diagram.maturity,'working');
  assert.equal(diagram.testFixtureId,'state-machine-complete-workflow');
  const transition=relationshipCapabilityFor('State Machine Diagram','Transition');
  assert.equal(transition.maturity,'working');
  assert.equal(transition.testFixtureId,'state-machine-complete-workflow');
});

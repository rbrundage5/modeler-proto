import test from 'node:test';
import assert from 'node:assert/strict';
import {CLAIMED_DIAGRAM_TYPES,CONFORMANCE_REGISTRY,elementCapabilityFor,rejectionReason} from '../public/src/sysml/conformance-registry.js';
import {resolvePresentation} from '../public/src/presentation-compatibility.js';

test('authoritative registry covers the nine claimed diagrams with contexts and endpoint rules',()=>{
  assert.deepEqual(Object.keys(CONFORMANCE_REGISTRY.diagramTypes),[...CLAIMED_DIAGRAM_TYPES]);
  for(const diagram of Object.values(CONFORMANCE_REGISTRY.diagramTypes)){
    assert.ok(diagram.requiredSemanticContext.length);
    assert.ok(Object.values(diagram.elementCapabilities).every(item=>item.renderer&&item.selectionStrategy));
    assert.ok(Object.values(diagram.relationshipCapabilities).every(item=>item.sourceKinds&&item.targetKinds));
  }
});
test('working registry claims are backed by fixture identifiers',()=>{for(const diagram of Object.values(CONFORMANCE_REGISTRY.diagramTypes))for(const capability of Object.values(diagram.elementCapabilities))if(capability.maturity==='working')assert.ok(CONFORMANCE_REGISTRY.fixtures[capability.testFixtureId])});
test('compatibility consumes registry and rejects unsupported direct notation actionably',()=>{
  assert.equal(resolvePresentation({diagramType:'Use Case Diagram',semanticType:'Actor'}).presentationType,elementCapabilityFor('Use Case Diagram','Actor').presentationType);
  const rejected=resolvePresentation({diagramType:'Sequence Diagram',semanticType:'Actor'});assert.equal(rejected.placementMode,'CONTEXTUAL');assert.match(rejected.reason,/Lifeline/);
  assert.match(rejectionReason('Activity Diagram','Block'),/not directly placeable/);
});

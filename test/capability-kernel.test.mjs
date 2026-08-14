import test from 'node:test';
import assert from 'node:assert/strict';
import {DIAGRAMS,ELEMENTS,RELATIONSHIPS} from '../public/src/sysml-profile.js';
import {CAPABILITY_KERNEL,capabilityKernelEntry,capabilityKernelSummary} from '../public/src/sysml/capability-kernel.js';

test('capability kernel covers every declared SysML/UML profile record exactly once',()=>{
  assert.deepEqual(new Set(Object.keys(CAPABILITY_KERNEL.diagrams)),new Set(Object.keys(DIAGRAMS)));
  assert.deepEqual(new Set(Object.keys(CAPABILITY_KERNEL.elements)),new Set(Object.keys(ELEMENTS)));
  assert.deepEqual(new Set(Object.keys(CAPABILITY_KERNEL.relationships)),new Set(Object.keys(RELATIONSHIPS)));
});

test('diagram membership is generated from the semantic profile rather than a second hand-maintained list',()=>{
  for(const [diagramType,profile] of Object.entries(DIAGRAMS)){
    const diagram=capabilityKernelEntry(diagramType,'diagram');
    assert.deepEqual(diagram.elements,[...(profile.elements||[])]);
    assert.deepEqual(diagram.relationships,[...(profile.relationships||[])]);
    for(const kind of profile.elements||[])assert.ok(capabilityKernelEntry(kind)?.diagramTypes.includes(diagramType),`${kind} must report ${diagramType}`);
    for(const kind of profile.relationships||[])assert.ok(capabilityKernelEntry(kind,'relationship')?.diagramTypes.includes(diagramType),`${kind} must report ${diagramType}`);
  }
});

test('complete support can only be generated from working conformance capabilities',()=>{
  for(const entry of Object.values(CAPABILITY_KERNEL.elements))if(entry.supportStatus==='complete'){
    assert.ok(entry.capabilities.length>0,`${entry.canonicalType} cannot be complete without a qualified presentation capability`);
    assert.ok(entry.capabilities.every(capability=>capability.maturity==='working'),`${entry.canonicalType} cannot override a non-working capability`);
  }
  for(const entry of Object.values(CAPABILITY_KERNEL.relationships))if(entry.supportStatus==='complete'){
    assert.ok(entry.capabilities.length>0,`${entry.canonicalType} cannot be complete without a qualified relationship capability`);
    assert.ok(entry.capabilities.every(capability=>capability.maturity==='working'),`${entry.canonicalType} cannot override a non-working capability`);
  }
});

test('kernel records ownership and compartment semantics from the profile',()=>{
  assert.ok(capabilityKernelEntry('PartProperty').ownerKinds.includes('Block'));
  assert.ok(capabilityKernelEntry('Block').compartments.includes('parts'));
  assert.ok(capabilityKernelEntry('Block').compartments.includes('ports'));
  assert.deepEqual(capabilityKernelEntry('Connector','relationship').source,RELATIONSHIPS.Connector.source);
});

test('kernel summary is deterministic and accounts for every record',()=>{
  const summary=capabilityKernelSummary();
  assert.equal(Object.values(summary.diagrams).reduce((a,b)=>a+b,0),Object.keys(DIAGRAMS).length);
  assert.equal(Object.values(summary.elements).reduce((a,b)=>a+b,0),Object.keys(ELEMENTS).length);
  assert.equal(Object.values(summary.relationships).reduce((a,b)=>a+b,0),Object.keys(RELATIONSHIPS).length);
});

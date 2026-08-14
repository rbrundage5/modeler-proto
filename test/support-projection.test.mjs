import test from 'node:test';
import assert from 'node:assert/strict';
import {CAPABILITY_KERNEL} from '../public/src/sysml/capability-kernel.js';
import {SUPPORT_PROJECTION,SUPPORT_STATES,supportProjectionEntry,supportProjectionForDiagram} from '../public/src/sysml/support-projection.js';

test('support projection covers the capability kernel exactly',()=>{
 assert.deepEqual(Object.keys(SUPPORT_PROJECTION.diagrams).sort(),Object.keys(CAPABILITY_KERNEL.diagrams).sort());
 assert.deepEqual(Object.keys(SUPPORT_PROJECTION.elements).sort(),Object.keys(CAPABILITY_KERNEL.elements).sort());
 assert.deepEqual(Object.keys(SUPPORT_PROJECTION.relationships).sort(),Object.keys(CAPABILITY_KERNEL.relationships).sort());
});

test('support projection never promotes beyond kernel maturity',()=>{
 for(const [kind,kernel] of Object.entries(CAPABILITY_KERNEL.elements)){
  const item=supportProjectionEntry(kind,'element');
  assert.ok(SUPPORT_STATES.includes(item.supportStatus),kind);
  if(item.supportStatus==='complete')assert.equal(kernel.maturity,'working',kind);
 }
 for(const [kind,kernel] of Object.entries(CAPABILITY_KERNEL.relationships)){
  const item=supportProjectionEntry(kind,'relationship');
  if(item.supportStatus==='complete')assert.equal(kernel.maturity,'working',kind);
 }
 for(const [kind,kernel] of Object.entries(CAPABILITY_KERNEL.diagrams)){
  const item=supportProjectionEntry(kind,'diagram');
  if(item.supportStatus==='complete')assert.equal(kernel.maturity,'working',kind);
 }
});

test('owned semantic content is not mislabeled import-only',()=>{
 for(const kind of ['Operation','Reception','AssociationEnd','EnumerationLiteral','Slot']){
  const item=supportProjectionEntry(kind,'element');
  assert.equal(item.presentationMode,'owned',kind);
  assert.notEqual(item.supportStatus,'import-only',kind);
 }
});

test('diagram-specific projections come from kernel diagram membership',()=>{
 const ibd=supportProjectionForDiagram('Internal Block Diagram','element').map(item=>item.canonicalType);
 assert.ok(ibd.includes('PartProperty'));
 assert.ok(ibd.includes('ProxyPort'));
 const relationships=supportProjectionForDiagram('Internal Block Diagram','relationship').map(item=>item.canonicalType);
 assert.ok(relationships.includes('Connector'));
 assert.ok(relationships.includes('ItemFlow'));
});

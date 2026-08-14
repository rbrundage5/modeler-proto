import test from 'node:test';
import assert from 'node:assert/strict';
import {saveWorkingCopy,WORKING_COPY_KEY} from '../public/src/working-copy-storage.js';
import {repairImportedRelationshipOwners} from '../public/src/import-relationship-owner-integrity.js';

test('quota exhaustion falls back without throwing or retaining the oversized legacy copy',()=>{
  let removed='',fallback=null;const quota=Object.assign(new Error('Setting the value exceeded the quota.'),{name:'QuotaExceededError'}),storage={setItem(){throw quota},removeItem(key){removed=key}};
  const project={id:'large',elements:Array.from({length:5000},(_,i)=>({id:`e-${i}`}))},result=saveWorkingCopy(project,{storage,onQuota:value=>{fallback=value}});
  assert.equal(result.stored,false);assert.equal(result.mode,'indexedDB');assert.equal(removed,WORKING_COPY_KEY);assert.equal(fallback,project);
});

test('Governance traces are owned by their explicit responsible target package',()=>{
  const project={root:{id:'root',name:'Model',kind:'Model'},elements:[
    {id:'FSBS.PKG.100',name:'Governance',kind:'Package',ownerId:'root'},
    {id:'FSBS.PKG.123',name:'CATIA_Magic_Guidelines',kind:'Package',ownerId:'FSBS.PKG.100'},
    {id:'other',name:'Imported Requirements',kind:'Package',ownerId:'root'},
    {id:'req',name:'Import Owners Before Children',kind:'Requirement',ownerId:'other'}
  ],relationships:[{id:'FSBS.REL.GOV.0004',externalId:'FSBS.REL.GOV.0004',name:'trace_GOV-0004_to_owner',kind:'Trace',ownerId:'FSBS.PKG.100',sourceId:'req',targetId:'FSBS.PKG.123'}],diagrams:[]};
  const result=repairImportedRelationshipOwners(project);
  assert.equal(result.errors.length,0);assert.equal(result.repairs.length,1);assert.equal(project.relationships[0].ownerId,'FSBS.PKG.123');
});

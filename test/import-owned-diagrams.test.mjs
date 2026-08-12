import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import {createProject} from '../public/src/model.js';
import {safeImportWorkbook,diagramOwnershipIssues,finalizeImportedProject} from '../public/src/import-semantic-integrity.js';

globalThis.XLSX=XLSX;

function workbookFile(){
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([
    ['External ID','Name','Owner External ID','SysML Kind'],
    ['PKG-BDD','BDD','', 'Package']
  ]),'Packages_Import');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([
    ['External ID','Name','Owner External ID','SysML Kind'],
    ['BLK-1','System','PKG-BDD','Block'],
    ['BLK-2','Subsystem','PKG-BDD','Block']
  ]),'Blocks_Import');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([
    ['Relationship External ID','Relationship Type','Source External ID','Target External ID','Owner External ID'],
    ['REL-1','Dependency','BLK-1','BLK-2','PKG-BDD']
  ]),'Relationships_Import');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([
    ['Diagram External ID','Diagram Name','Diagram Type','Owner External ID','Context External ID','Displayed Element IDs','Relationship IDs'],
    ['DGM-1','System BDD','Block Definition Diagram','PKG-BDD','BLK-1','BLK-1; BLK-2','REL-1']
  ]),'Diagrams_Import');
  const bytes=XLSX.write(wb,{type:'array',bookType:'xlsx'});
  return{name:'owned-diagram.xlsx',arrayBuffer:async()=>bytes};
}

test('workbook import builds diagram nodes and edges from Diagrams_Import semantic lists',async()=>{
  const project=createProject('Import Diagram Test');
  const {project:imported,report}=await safeImportWorkbook(workbookFile(),project,()=>{});
  assert.equal(report.diagrams.created,1);
  const diagram=imported.diagrams.find(d=>d.id==='DGM-1');
  assert.ok(diagram);
  assert.equal(diagram.diagramType,'Block Definition Diagram');
  assert.equal(diagram.ownerId,'PKG-BDD');
  assert.equal(diagram.contextId,'BLK-1');
  assert.equal(diagram.nodes.filter(n=>['BLK-1','BLK-2'].includes(n.elementId)).length,2,'Displayed Element IDs should build node presentations without separate DiagramShapes rows.');
  assert.ok(diagram.edges.some(e=>e.relationshipId==='REL-1'),'Relationship IDs should build an edge presentation without a separate DiagramEdges row.');
  assert.deepEqual(diagramOwnershipIssues(imported,{fileName:'owned-diagram.xlsx'}),[]);
});

test('import integrity rejects a diagram owned by a semantic Block instead of a Package',()=>{
  const original=createProject('Original'),staged=structuredClone(original);
  staged.elements.push({id:'blk',externalId:'blk',kind:'Block',metaclass:'Class',stereotype:'block',name:'Block',ownerId:staged.root.id,documentation:'',compartments:{},compartmentVisibility:{}});
  staged.diagrams.push({id:'d',externalId:'d',name:'Bad Owner',diagramType:'Block Definition Diagram',ownerId:'blk',contextId:'blk',nodes:[],edges:[],importSource:{file:'bad.xlsx'}});
  const result=finalizeImportedProject(original,staged,{fileName:'bad.xlsx'});
  assert.ok(result.errors.some(message=>message.includes('must be owned by a Package')));
});

test('diagram stable ID cannot silently change diagram type on reimport',()=>{
  const original=createProject('Original');
  original.elements.push({id:'pkg',externalId:'pkg',kind:'Package',metaclass:'Package',stereotype:'',name:'Diagrams',ownerId:original.root.id,documentation:'',compartments:{},compartmentVisibility:{}});
  original.diagrams.push({id:'d',externalId:'d',name:'Original BDD',diagramType:'Block Definition Diagram',ownerId:'pkg',contextId:'pkg',nodes:[],edges:[]});
  const staged=structuredClone(original);staged.diagrams[0].diagramType='Activity Diagram';staged.diagrams[0].importSource={file:'mutate.xlsx'};
  const result=finalizeImportedProject(original,staged,{fileName:'mutate.xlsx'});
  assert.ok(result.errors.some(message=>message.includes('Stable diagram ID d changed type')));
});

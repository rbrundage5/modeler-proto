import test from 'node:test';
import assert from 'node:assert/strict';
import {createProject,defaultElement,defaultRelationship} from '../public/src/model.js';
import {finalizeImportedProject} from '../public/src/import-semantic-integrity.js';

const clone=value=>structuredClone(value);

function add(project,kind,id,name,ownerId=project.root.id){const e=defaultElement(kind,ownerId);e.id=id;e.externalId=id;e.name=name;project.elements.push(e);return e}

test('qualified owner path repairs a bogus auto-created owner package',()=>{
  const original=createProject('Import Integrity');
  const staged=clone(original);
  const architecture=add(staged,'Package','PKG-ARCH','Architecture');
  const bogus=add(staged,'Package','pkg-missing','MISSING_OWNER');bogus.isAutoCreatedByImport=true;
  const block=add(staged,'Block','BLK-1','System',bogus.id);block.ownerQualifiedNameString=`${staged.root.name}::Architecture`;block.importSource={file:'test.xlsx'};
  const result=finalizeImportedProject(original,staged,{fileName:'test.xlsx'});
  assert.equal(block.ownerId,architecture.id);
  assert.equal(staged.elements.some(e=>e.id===bogus.id),false);
  assert.equal(result.errors.some(e=>e.includes('Unresolved owner')),false);
});

test('explicit parent deletion cascades through descendants instead of leaving orphans',()=>{
  const original=createProject('Delete Cascade');
  const parent=add(original,'Package','PKG-A','A');
  add(original,'Package','PKG-B','B',parent.id);
  add(original,'Block','BLK-C','C','PKG-B');
  const staged=clone(original);staged.elements=staged.elements.filter(e=>e.id!=='PKG-A');
  const result=finalizeImportedProject(original,staged,{fileName:'delete.xlsx'});
  assert.equal(staged.elements.some(e=>['PKG-B','BLK-C'].includes(e.id)),false);
  assert.ok(result.warnings.some(w=>w.includes('Cascaded explicit import deletion')));
});

test('connector endpoint paths are rebuilt after connector-end import semantics',()=>{
  const original=createProject('Connector Paths');
  const staged=clone(original);
  add(staged,'Block','SRC','Source');add(staged,'Block','DST','Target');
  const rel=defaultRelationship('Connector','SRC','DST',staged.root.id);rel.id='CON-1';rel.externalId='CON-1';rel.sourcePartWithPortPath=['SRC'];rel.targetPartWithPortPath=['DST'];staged.relationships.push(rel);
  finalizeImportedProject(original,staged,{fileName:'connector.xlsx'});
  assert.deepEqual(rel.sourceEndpointPath,['SRC','SRC']);
  assert.deepEqual(rel.targetEndpointPath,['DST','DST']);
});

test('reimport cannot mutate the semantic kind behind a stable element ID',()=>{
  const original=createProject('Stable Identity');add(original,'Block','SAME-ID','Original Block');
  const staged=clone(original);staged.elements.find(e=>e.id==='SAME-ID').kind='InterfaceBlock';
  const result=finalizeImportedProject(original,staged,{fileName:'reimport.xlsx'});
  assert.ok(result.errors.some(e=>e.includes('changed kind from Block to InterfaceBlock')));
});

test('imported requirements require actual requirement text',()=>{
  const original=createProject('Requirements');
  const staged=clone(original);const req=add(staged,'Requirement','REQ-1','Requirement');req.requirementId='REQ-1';req.requirementText='';req.importSource={file:'requirements.xlsx'};
  const result=finalizeImportedProject(original,staged,{fileName:'requirements.xlsx'});
  assert.ok(result.errors.some(e=>e.includes('has no requirement text')));
});

test('imported diagrams require dedicated package ownership',()=>{
  const original=createProject('Diagram Ownership');
  const staged=clone(original);const block=add(staged,'Block','BLK-OWNER','Owner Block');
  staged.diagrams.push({id:'D-1',externalId:'D-1',name:'Imported BDD',diagramType:'Block Definition Diagram',ownerId:block.id,contextId:block.id,nodes:[],edges:[],importSource:{file:'diagrams.xlsx'}});
  const result=finalizeImportedProject(original,staged,{fileName:'diagrams.xlsx'});
  assert.ok(result.errors.some(e=>e.includes('must be owned by a dedicated Package')));
});

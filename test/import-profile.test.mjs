import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {catiaCameoProfile,valueFor,normalizeKind,normalizeRelationshipKind} from '../public/src/import/profiles/catia-cameo.js';
import {detectHeaderRow,rowsFromMatrix} from '../public/src/import/core/workbook-reader.js';

const layouts=JSON.parse(fs.readFileSync(new URL('./fixtures/catia-workbook-layouts.json',import.meta.url),'utf8'));
const ignored=/^(readme|summary|import_?instructions|model_?statistics|validation|.*validation|source_?documents|source_?crosswalk|id_?crosswalk|id_?name_?crosswalk|domain_?package_?map|unit_?statistics|model_?completeness|diagram_?compartment_?manifest|text_?and_?compartment_?validation|import_?readiness_?validation|complete_?import_?validation|minimal_?import_?validation|diagram_?build_?validation|navigation_?context_?validation|relationship_?schema_?validation)$/i;

test('all supplied workbook modeling sheets are recognized',()=>{
  const failures=[];
  for(const [book,sheets] of Object.entries(layouts))for(const sheet of sheets){
    const def=catiaCameoProfile.matchSheet(sheet.name);
    if(def.role==='unknown'&&!ignored.test(sheet.name))failures.push(`${book}: ${sheet.name}`);
  }
  assert.deepEqual(failures,[]);
});

test('header detection finds supplied header rows',()=>{
  const failures=[];
  for(const [book,sheets] of Object.entries(layouts))for(const sheet of sheets){
    const def=catiaCameoProfile.matchSheet(sheet.name);if(def.role==='unknown')continue;
    const before=Array.from({length:Math.max(0,sheet.headerRow-1)},(_,i)=>[`Guidance ${i+1}`,'Workbook note']);
    const matrix=[...before,sheet.headers,['sample','Sample Name','Package']];
    const found=detectHeaderRow(matrix,def.headerGroups,40)+1;
    if(found!==sheet.headerRow)failures.push(`${book}: ${sheet.name} expected ${sheet.headerRow}, got ${found}`);
  }
  assert.deepEqual(failures,[]);
});

test('CATIA aliases and kinds normalize correctly',()=>{
  const row={'Part Property ID':'PP-1','Role Name':'transmitter','Owning Block ID':'BLK-1','Type Block ID':'BLK-TYPE','Lower':'0','Upper':'*'};
  assert.equal(valueFor(row,'externalId'),'PP-1');
  assert.equal(valueFor(row,'name'),'transmitter');
  assert.equal(valueFor(row,'owner'),'BLK-1');
  assert.equal(valueFor(row,'typeRef'),'BLK-TYPE');
  assert.equal(normalizeKind('SysML::PartProperty'),'PartProperty');
  assert.equal(normalizeKind('Property','PartProperty'),'PartProperty');
  assert.equal(normalizeKind('Class','Requirement'),'Requirement');
  assert.equal(normalizeKind('OpaqueAction','Action'),'Action');
  assert.equal(normalizeKind('initial','State'),'InitialPseudostate');
  assert.equal(normalizeKind('final','State'),'FinalState');
  assert.equal(normalizeRelationshipKind('deriveReqt'),'DeriveReqt');
});

test('rows preserve real worksheet row numbers',()=>{
  const matrix=[['title'],['External ID','Name','Owner External ID'],['A','Alpha','ROOT']];
  const rows=rowsFromMatrix(matrix,1);
  assert.equal(rows[0].__rowNumber,3);
  assert.equal(rows[0]['External ID'],'A');
});

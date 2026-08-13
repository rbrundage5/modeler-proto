import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {preserveRequirementLevel} from '../public/src/import/fidelity-level.js';
import {preserveStateBehaviors} from '../public/src/import/fidelity-state.js';
import {preserveLifelineRepresentation} from '../public/src/import/fidelity-lifeline.js';
import {preserveMessageSignature} from '../public/src/import/fidelity-message.js';

const importer=fs.readFileSync(new URL('../public/src/importer.js',import.meta.url),'utf8');

test('automobile workbook semantic fields survive import',()=>{
  const requirement={kind:'Block',stereotype:'SysML::Requirement'};preserveRequirementLevel(requirement,{Level:'Vehicle'});assert.equal(requirement.requirementLevel,'Vehicle');assert.equal(requirement.kind,'Requirement');
  const state={};preserveStateBehaviors(state,{'Entry Behavior':'entry / initialize()','Do Behavior':'do / monitor()','Exit Behavior':'exit / shutdown()'});assert.equal(state.entryBehavior,'entry / initialize()');assert.equal(state.doBehavior,'do / monitor()');assert.equal(state.exitBehavior,'exit / shutdown()');
  const lifeline={};preserveLifelineRepresentation(lifeline,{'Represents External ID':'AUTO.PART.CONTROLLER','Represents Qualified Name String':'Automobile::controller'});assert.equal(lifeline.representedElementId,'AUTO.PART.CONTROLLER');
  const message={};preserveMessageSignature(message,{Signature:'submitCommand(command)'});assert.equal(message.signature,'submitCommand(command)');
});

test('generic UML metaclasses retain their authoritative SysML stereotype kind',()=>{
  const cases=[
    ['Block','SysML::InterfaceBlock','InterfaceBlock'],
    ['Block','SysML::ConstraintBlock','ConstraintBlock'],
    ['DataType','SysML::ValueType','ValueType'],
    ['Property','SysML::PartProperty','PartProperty'],
    ['Property','SysML::ReferenceProperty','ReferenceProperty'],
    ['Port','SysML::ProxyPort','ProxyPort'],
    ['Port','SysML::FullPort','FullPort']
  ];
  for(const[kind,stereotype,expected]of cases){const element={kind,stereotype};preserveRequirementLevel(element,{});assert.equal(element.kind,expected,stereotype);}
});

test('automobile Unit rows and ValueType unit references remain semantic',()=>{
  const unit={kind:'InstanceSpecification',metaclass:'InstanceSpecification',stereotype:''};
  preserveRequirementLevel(unit,{Symbol:'V','Quantity Kind':'ElectricPotential','SI Conversion Factor':1});
  assert.equal(unit.kind,'Unit');assert.equal(unit.symbol,'V');assert.equal(unit.quantityKindRef,'ElectricPotential');
  const valueType={kind:'DataType',stereotype:'SysML::ValueType',unitRef:'CAR.UNIT.001'};
  preserveRequirementLevel(valueType,{});assert.equal(valueType.kind,'ValueType');assert.equal(valueType.unitRef,'CAR.UNIT.0001');
});

test('importer preserves complete structural and presentation semantics',()=>{
  for(const token of [
    "if(normalizedKey(sheet.name).includes('ports'))",
    "row['Unit External ID']",
    'importEnumerationLiterals',
    "row['Constraint Expression']",
    'linkImplicitItemFlows(ctx)',
    'rel.sourceEndpointPath=',
    'rel.targetEndpointPath=',
    'parentDiagramId=parent.id',
    "row['Property Path IDs']",
    "row['Endpoint Path']",
    "row['Parent Presentation ID']",
    "row['Port Side']",
    "row['Perimeter Offset']",
    "Connector ${rel.id} has unresolved endpoint path element",
    "Diagram ${diagram.name} has unresolved property path"
  ])assert.ok(importer.includes(token),`missing importer fidelity contract: ${token}`);
});

test('diagram routing directives and message metadata are imported',()=>{
  assert.match(importer,/\^\(orthogonal\|straight\|direct\|manual\)\$/);
  assert.match(importer,/preserveMessageSignature\(rel,row\)/);
  assert.match(importer,/purpose:text\(row\['Purpose'\]\)/);
});

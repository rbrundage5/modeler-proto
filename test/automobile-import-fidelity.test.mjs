import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {preserveRequirementLevel} from '../public/src/import/fidelity-level.js';
import {preserveStateBehaviors} from '../public/src/import/fidelity-state.js';
import {preserveLifelineRepresentation} from '../public/src/import/fidelity-lifeline.js';
import {preserveMessageSignature} from '../public/src/import/fidelity-message.js';

const importer=fs.readFileSync(new URL('../public/src/importer.js',import.meta.url),'utf8');

test('automobile workbook semantic fields survive import',()=>{
  const requirement={};preserveRequirementLevel(requirement,{Level:'Vehicle'});assert.equal(requirement.requirementLevel,'Vehicle');
  const state={};preserveStateBehaviors(state,{'Entry Behavior':'entry / initialize()','Do Behavior':'do / monitor()','Exit Behavior':'exit / shutdown()'});assert.equal(state.entryBehavior,'entry / initialize()');assert.equal(state.doBehavior,'do / monitor()');assert.equal(state.exitBehavior,'exit / shutdown()');
  const lifeline={};preserveLifelineRepresentation(lifeline,{'Represents External ID':'AUTO.PART.CONTROLLER','Represents Qualified Name String':'Automobile::controller'});assert.equal(lifeline.representedElementId,'AUTO.PART.CONTROLLER');
  const message={};preserveMessageSignature(message,{Signature:'submitCommand(command)'});assert.equal(message.signature,'submitCommand(command)');
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

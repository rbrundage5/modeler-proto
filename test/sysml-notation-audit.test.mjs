import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {auditSysmlNotation} from '../public/src/sysml-notation-audit.js';
import {DIAGRAMS} from '../public/src/sysml-profile.js';
import {hasSysmlIcon,sysmlPaletteIcon} from '../public/src/sysml-icons.js';

test('every diagram palette entry has a dedicated reusable SVG notation icon',()=>{const audit=auditSysmlNotation();assert.equal(audit.passed,true,JSON.stringify(audit.issues));assert.equal(audit.supportedElements,68);assert.equal(audit.supportedRelationships,32);for(const diagram of Object.values(DIAGRAMS))for(const kind of [...diagram.elements,...diagram.relationships]){assert.equal(hasSysmlIcon(kind),true,kind);assert.match(sysmlPaletteIcon(kind),/^<svg/);assert.doesNotMatch(sysmlPaletteIcon(kind),/>\?</)}});

test('canvas renderer includes SysML frame, package, comment, activity, and state pseudostate geometry',async()=>{const source=await readFile(new URL('../public/src/app.js',import.meta.url),'utf8');for(const token of ['drawDiagramFrame','diagram-frame-tab','drawPackage','drawComment','FlowFinalNode','ChoicePseudostate','JunctionPseudostate','ShallowHistory','DeepHistory'])assert.match(source,new RegExp(token));assert.match(source,/sysmlPaletteIcon\(x\)/)});

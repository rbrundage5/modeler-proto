import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const app=await readFile(new URL('../public/src/app.js',import.meta.url),'utf8');
const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');

test('new diagram uses an accessible type selector before its name field',()=>{const typeAt=html.indexOf('id="newDiagramType"'),nameAt=html.indexOf('id="newDiagramName"');assert.ok(typeAt>0);assert.ok(nameAt>typeAt);assert.match(app,/DIAGRAM_TYPES\.map\(type=>/);assert.doesNotMatch(app,/prompt\(`Diagram type:/)});
test('diagram selectors display type before name',()=>assert.match(app,/o\.textContent=`\$\{d\.diagramType\} — \$\{d\.name\}`/));
test('every diagram frame header is selectable and editable through diagram operations',()=>{assert.match(app,/function drawDiagramFrame\(svg,d\).*selected=\{type:'diagram'/);assert.match(app,/Diagram Header.*Header text/);assert.match(app,/edit\(obj,'headerText',v,'diagram'\)/);assert.match(app,/headerText:\s*''/)});

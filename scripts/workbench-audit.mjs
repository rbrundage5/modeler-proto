import fs from 'node:fs';
const html=fs.readFileSync('public/index.html','utf8'),source=fs.readFileSync('public/src/workbench.js','utf8'),state=fs.readFileSync('public/src/workbench-state.js','utf8');
const requiredIds=['workspace','leftSplitter','rightSplitter','bottomSplitter','documentTabs','workbenchBreadcrumb','explorerSearch','propertyTabs','validationCenter','workbenchStatus','commandPalette'];
const missing=requiredIds.filter(id=>!html.includes(`id="${id}"`));
if(missing.length)throw Error(`Workbench controls missing: ${missing.join(', ')}`);
for(const token of ['commandPalette','systems-modeler-project-change','data-bottom-tab','openDocument','renderValidation'])if(!source.includes(token))throw Error(`Workbench interaction contract missing: ${token}`);
for(const workspace of ['Modeling','Structure','Requirements','Behavior','Validation','Custom'])if(!state.includes(`${workspace}:`))throw Error(`Workspace preset missing: ${workspace}`);
console.log('Professional workbench interaction audit passed.');

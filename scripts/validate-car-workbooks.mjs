import fs from 'node:fs/promises';
import path from 'node:path';
import XLSX from 'xlsx';
import {importWorkbook,inspectWorkbook} from '../public/src/importer.js';
import {createProject} from '../public/src/model.js';
import {rendererDescriptor} from '../public/src/renderer-registry.js';

globalThis.XLSX=XLSX;
const dir=process.argv[2];
if(!dir)throw new Error('Usage: node scripts/validate-car-workbooks.mjs <workbook-directory>');
const names=(await fs.readdir(dir)).filter(name=>/^Automobile_Demo_\d\d_.*\.xlsx$/.test(name)).sort();
const project=createProject();
const runs=[];
let cleanIdentities;
async function load(name){const bytes=await fs.readFile(path.join(dir,name));return new File([bytes],name,{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});}
for(const phase of ['clean','reimport'])for(const name of names){
  const file=await load(name),sheets=await inspectWorkbook(file),unknown=sheets.filter(sheet=>sheet.role==='unknown'&&sheet.name!=='README'&&sheet.name!=='Validation');
  const logs=[];let report;
  try{report=await importWorkbook(file,project,(message,level)=>logs.push({message,level}),{strict:true});}
  catch(error){report=error.importReport||{errors:[error.message],warnings:[]};}
  runs.push({phase,name,errors:report.errors||[],warnings:report.warnings||[],unknownSheets:unknown.map(sheet=>sheet.name),counts:{elements:project.elements.length,relationships:project.relationships.length,diagrams:project.diagrams.length}});
  if(phase==='clean'&&name===names.at(-1))cleanIdentities=identitySnapshot(project);
}
const fatal=runs.filter(run=>run.errors.length||run.warnings.length||run.unknownSheets.length);
const reimportIdentities=identitySnapshot(project),identityDrift=JSON.stringify(cleanIdentities)!==JSON.stringify(reimportIdentities);
if(identityDrift)fatal.push({phase:'final',name:'stable-identities',errors:['Semantic or presentation identities changed during re-import.'],warnings:[],unknownSheets:[]});
const blankDiagrams=project.diagrams.filter(diagram=>!(diagram.nodes||[]).length).map(diagram=>({id:diagram.id,name:diagram.name,type:diagram.diagramType}));
if(blankDiagrams.length)fatal.push({phase:'final',name:'diagram-population',errors:[`${blankDiagrams.length} blank diagram(s)`],warnings:[],unknownSheets:[],blankDiagrams});
const rendererFailures=[];
for(const diagram of project.diagrams){
  for(const node of diagram.nodes||[]){const element=project.elements.find(item=>item.id===node.elementId),descriptor=rendererDescriptor(element?.kind,diagram.diagramType);if(!element||!descriptor.supported)rendererFailures.push({diagramId:diagram.id,diagramType:diagram.diagramType,presentationId:node.id,semanticId:node.elementId,kind:element?.kind||'MISSING',diagnostic:descriptor.diagnostic});}
  for(const edge of diagram.edges||[]){const relationship=project.relationships.find(item=>item.id===edge.relationshipId),descriptor=rendererDescriptor(relationship?.kind,diagram.diagramType);if(!relationship||!descriptor.supported||!edge.sourceNodeId||!edge.targetNodeId)rendererFailures.push({diagramId:diagram.id,diagramType:diagram.diagramType,presentationId:edge.id,semanticId:edge.relationshipId,kind:relationship?.kind||'MISSING',diagnostic:descriptor.diagnostic||'Unresolved graphical endpoints'});}
}
if(rendererFailures.length)fatal.push({phase:'final',name:'renderer-compatibility',errors:[`${rendererFailures.length} unsupported presentation(s)`],warnings:[],unknownSheets:[],rendererFailures});
const result={passed:fatal.length===0,files:names.length,runs,fatal,blankDiagrams,rendererFailures,identityDrift};
await fs.writeFile(path.join(dir,'importer-validation.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({passed:result.passed,files:names.length,fatal:fatal.map(item=>({phase:item.phase,name:item.name,errors:item.errors,warnings:item.warnings,unknownSheets:item.unknownSheets}))},null,2));
if(!result.passed)process.exitCode=1;

function identitySnapshot(model){return{
  elements:model.elements.map(item=>[item.externalId||item.id,item.id,item.kind]).sort(compare),
  relationships:model.relationships.map(item=>[item.externalId||item.id,item.id,item.kind,item.sourceId,item.targetId]).sort(compare),
  diagrams:model.diagrams.map(item=>[item.externalId||item.id,item.id,item.diagramType]).sort(compare),
  nodes:model.diagrams.flatMap(diagram=>(diagram.nodes||[]).map(node=>[diagram.id,node.id,node.elementId])).sort(compare),
  edges:model.diagrams.flatMap(diagram=>(diagram.edges||[]).map(edge=>[diagram.id,edge.id,edge.relationshipId,edge.sourceNodeId,edge.targetNodeId])).sort(compare)
};}
function compare(left,right){return JSON.stringify(left).localeCompare(JSON.stringify(right));}

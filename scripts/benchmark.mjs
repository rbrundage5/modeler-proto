import fs from 'node:fs';
import os from 'node:os';
import {performance} from 'node:perf_hooks';
import {createProject,normalizeProject} from '../public/src/model.js';
import {validate} from '../public/src/validator.js';
import {applyOperation} from '../public/src/operations.js';

const requested=process.argv.includes('--quick')?[{name:'quick',elements:1000,presentations:100,relationships:1000}]:[
  {name:'semantic-1k',elements:1000,presentations:100,relationships:1000},
  {name:'semantic-10k',elements:10000,presentations:1000,relationships:5000}
];
const round=value=>Math.round(value*100)/100;
const measure=(fn)=>{const start=performance.now(),value=fn();return{ms:round(performance.now()-start),value}};
function element(i,ownerId){return{id:`block-${i}`,externalId:`SYN-${i}`,name:`Synthetic Block ${i}`,kind:'Block',metaclass:'Class',stereotype:'block',ownerId,documentation:'Synthetic benchmark data',multiplicity:'1',multiplicityLower:'1',multiplicityUpper:'1',tags:{},compartments:{},compartmentVisibility:{}}}
function build(config){const project=createProject(`Benchmark ${config.name}`),packageId='synthetic-package',blockCount=config.elements-1;project.elements=[{...element(0,project.root.id),id:packageId,externalId:'SYN-PACKAGE',name:'Synthetic Package',kind:'Package',metaclass:'Package'},...Array.from({length:blockCount},(_,i)=>element(i+1,packageId))];project.relationships=Array.from({length:config.relationships},(_,i)=>({id:`rel-${i}`,externalId:`REL-${i}`,name:'',kind:'Dependency',metaclass:'Dependency',stereotype:'',sourceId:`block-${1+(i%blockCount)}`,targetId:`block-${1+((i+1)%blockCount)}`,ownerId:packageId,documentation:'',tags:{}}));project.diagrams=[{id:'diagram-1',name:'Synthetic BDD',diagramType:'Block Definition Diagram',ownerId:packageId,diagramPackageId:packageId,contextId:packageId,nodes:Array.from({length:config.presentations},(_,i)=>({id:`node-${i}`,elementId:`block-${1+(i%blockCount)}`,x:(i%20)*210,y:Math.floor(i/20)*130,width:190,height:110})),edges:[]}];return project}
const results=[];
for(const config of requested){
  const created=measure(()=>build(config)),project=created.value;
  const normalized=measure(()=>normalizeProject(project));
  const validation=measure(()=>validate(project));
  const indexed=measure(()=>new Map(project.elements.map(item=>[`${item.name.toLowerCase()}|${item.externalId}`,item.id])));
  const serialized=measure(()=>JSON.stringify(project));
  const deserialized=measure(()=>JSON.parse(serialized.value));
  results.push({scenario:config,...config,creationMs:created.ms,normalizationMs:normalized.ms,validationMs:validation.ms,validationIssueCount:validation.value.length,searchIndexMs:indexed.ms,serializationMs:serialized.ms,deserializationMs:deserialized.ms,jsonBytes:Buffer.byteLength(serialized.value),heapUsedMiB:round(process.memoryUsage().heapUsed/1024/1024)});
}
const workbook=measure(()=>Array.from({length:10000},(_,i)=>({externalId:`WB-${i}`,name:`Workbook row ${i}`,kind:i%8===0?'Requirement':'Block',ownerExternalId:'ROOT'})).map((row,i)=>({id:`import-${i}`,...row,qualifiedName:`Benchmark::${row.name}`})));
const replayProject=build({name:'replay',elements:1000,presentations:100,relationships:0});
const replay=measure(()=>{for(let i=0;i<10000;i++)applyOperation(replayProject,{type:'set-property',targetType:'element',targetId:`block-${1+(i%999)}`,property:'documentation',value:`revision-${i}`})});
const queue=measure(()=>Array.from({length:5000},(_,i)=>({operationId:`queued-${i}`,roomId:'benchmark',branch:'main',baseRevision:i,type:'move-node',diagramId:'diagram-1',nodeId:`node-${i%100}`,x:i%500,y:i%300})));
const output={generatedAt:new Date().toISOString(),environment:{node:process.version,platform:`${os.platform()} ${os.release()} ${os.arch()}`,cpus:os.cpus().length,cpuModel:os.cpus()[0]?.model||'unknown',totalMemoryMiB:round(os.totalmem()/1024/1024)},results,workbookLikeRows:10000,workbookLikeProcessingMs:workbook.ms,journalOperations:10000,operationReplayMs:replay.ms,queuedCollaborationOperations:5000,queueConstructionMs:queue.ms,finalHeapUsedMiB:round(process.memoryUsage().heapUsed/1024/1024)};
fs.mkdirSync('benchmark-results',{recursive:true});fs.writeFileSync('benchmark-results/latest.json',JSON.stringify(output,null,2));
console.log(JSON.stringify(output,null,2));

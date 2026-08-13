import {importWorkbook} from './importer.js';
import {assertGraphSafe} from './model.js';
import {validate} from './validator.js';

const clone=value=>typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
let bound=false,running=false;

function beginTrace(file){const trace={file:file.name,startedAt:new Date().toISOString(),current:'parsing',phases:[],error:null};globalThis.__systemsModelerImportTrace=trace;return trace}
function mark(trace,name,detail=''){const time=performance.now(),last=trace.phases.at(-1);if(last&&!last.endedAt){last.endedAt=time;last.durationMs=time-last.startedAt}trace.current=name;trace.phases.push({name,detail,startedAt:time,endedAt:null,durationMs:null});globalThis.__systemsModelerImportPhase?.(name,detail);return trace}
function finish(trace){const time=performance.now(),last=trace.phases.at(-1);if(last&&!last.endedAt){last.endedAt=time;last.durationMs=time-last.startedAt}trace.completedAt=new Date().toISOString();trace.complete=true}
function byId(list=[]){return new Map(list.map(item=>[item.id,item]))}
function changedFields(before,after){const skip=new Set(['modifiedAt','qualifiedNameString','importSource']);return Object.keys(after).filter(key=>!skip.has(key)&&!equal(before?.[key],after[key]))}
function compactOperations(before,after){const operations=[],oldElements=byId(before.elements),oldRelationships=byId(before.relationships),oldDiagrams=byId(before.diagrams);
  for(const element of after.elements||[]){const old=oldElements.get(element.id);if(!old)operations.push({type:'create-element',element:clone(element)});else for(const key of changedFields(old,element))operations.push({type:'set-property',targetType:'element',targetId:element.id,property:key,value:clone(element[key]),expectedValue:clone(old[key])})}
  for(const relationship of after.relationships||[]){const old=oldRelationships.get(relationship.id);if(!old)operations.push({type:'create-relationship',relationship:clone(relationship)});else for(const key of changedFields(old,relationship))operations.push({type:'set-property',targetType:'relationship',targetId:relationship.id,property:key,value:clone(relationship[key]),expectedValue:clone(old[key])})}
  for(const diagram of after.diagrams||[]){const old=oldDiagrams.get(diagram.id);if(!old)operations.push({type:'create-diagram',diagram:clone(diagram)})}
  return operations;
}
function formatError(error,trace){const path=error?.path?.length?` [${error.path.join(' -> ')}]`:'';return `Import failed during ${trace.current}: ${error?.code?`${error.code}: `:''}${error.message}${path}`}

async function runImport(file,input){if(running)return;const api=globalThis.SystemsModelerAPI;if(!api)throw new Error('Modeler API is unavailable.');running=true;globalThis.__systemsModelerImportInProgress=true;const trace=beginTrace(file),before=clone(api.getProject()),staged=clone(before);try{
  mark(trace,'parsing');let firstProgress=true;
  await importWorkbook(file,staged,(message,kind)=>api.log?.(message,kind),{strict:true,onProgress:progress=>{if(firstProgress){firstProgress=false;mark(trace,'reference-resolution',progress.phase)}else if(progress.phase==='validation')mark(trace,'validation',progress.phase)}});
  mark(trace,'validation','graph-safety');assertGraphSafe(staged);const errors=validate(staged).filter(issue=>issue.severity==='error');if(errors.length){const error=new Error(`${errors.length} validation error(s) block import.`);error.code=errors[0].code;throw error}
  mark(trace,'commit');const operations=compactOperations(before,staged);
  mark(trace,'semantic-normalization');globalThis.__systemsModelerImportCommit=true;api.setProject(staged);globalThis.__systemsModelerImportCommit=false;
  mark(trace,'collaboration-publication');if(api.collaboration?.connected&&operations.length)api.collaboration.publish({type:'batch-operation',source:'import',operations});
  finish(trace);api.log?.(`Import transaction complete: ${trace.phases.map(row=>`${row.name} ${Math.round(row.durationMs||0)}ms`).join(' · ')}`,'ok');
 }catch(error){globalThis.__systemsModelerImportCommit=false;trace.error={phase:trace.current,code:error.code||'',name:error.name,message:error.message,stack:error.stack||'',path:error.path||[]};try{api.setProject(before)}catch(rollback){console.error('Import rollback failed',rollback)}finish(trace);api.log?.(formatError(error,trace),'error');throw error}finally{running=false;globalThis.__systemsModelerImportInProgress=false;input.value=''}}

function bind(){const input=document.getElementById('workbookInput');if(!input||bound)return;input.addEventListener('change',event=>{const file=event.target.files?.[0];if(!file)return;event.preventDefault();event.stopImmediatePropagation();void runImport(file,input).catch(()=>{})},true);bound=true}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();window.addEventListener('systems-modeler-ready',bind);
export{runImport,compactOperations};

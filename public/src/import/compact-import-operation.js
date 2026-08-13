const clone=v=>typeof structuredClone==='function'?structuredClone(v):JSON.parse(JSON.stringify(v));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const mapById=items=>new Map((items||[]).map(x=>[x.id,x]));
export function serializedProjectBytes(value){const s=JSON.stringify(value);return typeof TextEncoder!=='undefined'?new TextEncoder().encode(s).byteLength:s.length}
function changes(beforeItems,afterItems,fileName){const b=mapById(beforeItems),a=mapById(afterItems),created=[],updated=[],reused=[];for(const item of afterItems||[]){const old=b.get(item.id);if(!old)created.push(clone(item));else if(!same(old,item))updated.push({before:clone(old),after:clone(item)});else if(item.importSource?.file===fileName||old.importSource?.file===fileName)reused.push(item.id)}return{created,updated,reused}}
function propertyOps(targetType,change){const out=[];for(const key of new Set([...Object.keys(change.before||{}),...Object.keys(change.after||{})]))if(key!=='id'&&!same(change.before?.[key],change.after?.[key]))out.push({type:'set-property',targetType,targetId:change.after.id,property:key,value:clone(change.after?.[key]),expectedValue:clone(change.before?.[key])});return out}
export function buildCompactImportOperation(before,after,{fileName='',report=null}={}){
 const elements=changes(before.elements,after.elements,fileName),relationships=changes(before.relationships,after.relationships,fileName),diagrams=changes(before.diagrams,after.diagrams,fileName),ops=[];
 for(const x of elements.created)ops.push({type:'create-element',element:x});
 for(const x of elements.updated)ops.push(...propertyOps('element',x));
 for(const x of relationships.created)ops.push({type:'create-relationship',relationship:x});
 for(const x of relationships.updated)ops.push(...propertyOps('relationship',x));
 for(const x of diagrams.created)ops.push({type:'create-diagram',diagram:x});
 for(const x of diagrams.updated)ops.push(...propertyOps('diagram',x));
 return{type:'batch-operation',operations:ops,import:{version:1,fileName,reused:{elementIds:elements.reused,relationshipIds:relationships.reused,diagramIds:diagrams.reused},reportSummary:report?{elements:report.elements,relationships:report.relationships,diagrams:report.diagrams,presentations:report.presentations}:null}};
}
export function importPreflight(before,after,operation,{fileName='',conflicts=[]}={}){
 const beforeNodes=(before.diagrams||[]).reduce((n,d)=>n+(d.nodes?.length||0),0),afterNodes=(after.diagrams||[]).reduce((n,d)=>n+(d.nodes?.length||0),0),beforeEdges=(before.diagrams||[]).reduce((n,d)=>n+(d.edges?.length||0),0),afterEdges=(after.diagrams||[]).reduce((n,d)=>n+(d.edges?.length||0),0),updated=new Set(operation.operations.filter(x=>x.type==='set-property').map(x=>`${x.targetType}:${x.targetId}`));
 return{fileName,creates:operation.operations.filter(x=>x.type==='create-element').length,updates:updated.size,relationships:operation.operations.filter(x=>x.type==='create-relationship').length,diagrams:operation.operations.filter(x=>x.type==='create-diagram').length,shapes:Math.max(0,afterNodes-beforeNodes),edges:Math.max(0,afterEdges-beforeEdges),reused:Object.values(operation.import?.reused||{}).reduce((n,a)=>n+(a?.length||0),0),estimatedProjectBytes:serializedProjectBytes(after),operationBytes:serializedProjectBytes(operation),conflicts:[...conflicts]};
}
export function operationContainsProjectSnapshot(operation){if(!operation||typeof operation!=='object')return false;if(Object.prototype.hasOwnProperty.call(operation,'project'))return true;return Array.isArray(operation.operations)&&operation.operations.some(operationContainsProjectSnapshot)}

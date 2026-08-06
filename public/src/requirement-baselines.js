const BASELINE_FIELDS=['externalId','requirementId','name','requirementText','ownerId','lifecycleStatus','verificationMethod','sourceRevision'];
const clone=value=>globalThis.structuredClone?structuredClone(value):JSON.parse(JSON.stringify(value));
const uid=prefix=>`${prefix}-${globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2)}`;

function scopedRequirementIds(project,scope={}){
  const requirements=(project.elements||[]).filter(element=>element.kind==='Requirement');
  if(scope.requirementIds?.length)return new Set(scope.requirementIds.filter(id=>requirements.some(requirement=>requirement.id===id)));
  if(!scope.ownerId)return new Set(requirements.map(requirement=>requirement.id));
  const owners=new Set([scope.ownerId]);if(scope.includeDescendants!==false){let changed=true;while(changed){changed=false;for(const element of project.elements||[])if(owners.has(element.ownerId)&&!owners.has(element.id)){owners.add(element.id);changed=true}}}
  return new Set(requirements.filter(requirement=>owners.has(requirement.ownerId)).map(requirement=>requirement.id));
}

function relationshipRecord(relationship){return{id:relationship.id,externalId:relationship.externalId||'',kind:relationship.kind,sourceId:relationship.sourceId,targetId:relationship.targetId}}
export function createRequirementBaseline(project,{name='Requirements baseline',scope={},relationshipKinds=['Satisfy','Verify','DeriveReqt','Refine','Trace','Allocate'],id=uid('baseline'),createdAt=new Date().toISOString()}={}){
  const ids=scopedRequirementIds(project,scope),requirements=(project.elements||[]).filter(element=>ids.has(element.id)).map(element=>Object.fromEntries(['id',...BASELINE_FIELDS].map(field=>[field,clone(element[field]??'')]))),relationships=(project.relationships||[]).filter(relationship=>relationshipKinds.includes(relationship.kind)&&(ids.has(relationship.sourceId)||ids.has(relationship.targetId))).map(relationshipRecord);
  return{id,name,createdAt,scope:clone(scope),relationshipKinds:[...relationshipKinds],requirements,relationships};
}
export function saveRequirementBaseline(project,baseline){project.requirementBaselines=project.requirementBaselines||[];if(project.requirementBaselines.some(item=>item.id===baseline.id))throw Error(`Duplicate baseline ID: ${baseline.id}`);project.requirementBaselines.push(clone(baseline));return baseline}

function baselineSnapshot(project,baseline){return baseline||createRequirementBaseline(project,{name:'Current model',id:'current',createdAt:new Date().toISOString()})}
function relationshipKeys(records){return new Set((records||[]).map(record=>`${record.kind}\0${record.sourceId}\0${record.targetId}`))}
export function compareRequirementBaselines(left,right){
  const a=new Map((left.requirements||[]).map(item=>[item.id,item])),b=new Map((right.requirements||[]).map(item=>[item.id,item])),changes=[];
  for(const [id,before] of a){const after=b.get(id);if(!after){changes.push({type:'removed',requirementId:id,before,after:null,fields:[]});continue}const fields=BASELINE_FIELDS.filter(field=>JSON.stringify(before[field]??'')!==JSON.stringify(after[field]??''));if(fields.length)changes.push({type:'changed',requirementId:id,before,after,fields})}
  for(const [id,after] of b)if(!a.has(id))changes.push({type:'added',requirementId:id,before:null,after,fields:[]});
  const leftRelationships=relationshipKeys(left.relationships),rightRelationships=relationshipKeys(right.relationships),relationshipChanges=[...[...leftRelationships].filter(key=>!rightRelationships.has(key)).map(key=>({type:'removed',key})),...[...rightRelationships].filter(key=>!leftRelationships.has(key)).map(key=>({type:'added',key}))];
  return{left:{id:left.id,name:left.name},right:{id:right.id,name:right.name},changes,relationshipChanges,summary:{added:changes.filter(change=>change.type==='added').length,removed:changes.filter(change=>change.type==='removed').length,changed:changes.filter(change=>change.type==='changed').length,relationships:relationshipChanges.length}};
}
export function compareBaselineToCurrent(project,baseline){return compareRequirementBaselines(baseline,baselineSnapshot(project,null))}
export function exportBaseline(value,format='json'){if(format==='json')return JSON.stringify(value,null,2);if(format==='csv'){const rows=value.requirements?value.requirements:value.changes;const columns=[...new Set(rows.flatMap(row=>Object.keys(row)))];return[columns.join(','),...rows.map(row=>columns.map(column=>`"${String(typeof row[column]==='object'?JSON.stringify(row[column]):row[column]??'').replaceAll('"','""')}"`).join(','))].join('\n')}throw Error(`Unsupported baseline export format: ${format}`)}

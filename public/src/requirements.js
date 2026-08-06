export const REQUIREMENT_TYPES=['Requirement','Abstract Requirement','Functional Requirement','Interface Requirement','Performance Requirement','Physical Requirement','Design Constraint','Business Requirement'];
export const DEFAULT_REQUIREMENT_POLICY={requireId:true,requireText:true,uniqueId:true,statuses:['Draft','In Review','Approved','Rejected','Retired'],priorities:['Low','Medium','High','Critical'],verificationMethods:['Analysis','Demonstration','Inspection','Test']};

export function requirementPolicy(project){
  project.settings=project.settings||{};
  return project.settings.requirements={...DEFAULT_REQUIREMENT_POLICY,...project.settings.requirements};
}

export function initializeRequirement(element,now=new Date().toISOString()){
  const defaults={requirementType:'Requirement',requirementId:'',requirementText:'',sourceUri:'',sourceDocument:'',sourceSection:'',sourceRevision:'',rationale:'',risk:'Medium',priority:'Medium',lifecycleStatus:'Draft',maturity:'Proposed',verificationMethod:'Analysis',verificationStatus:'Not Planned',responsibleRole:'',approver:'',approvalDate:'',createdDate:now,modifiedDate:now,baselineIds:[],suspect:false,customStereotypeProperties:{},tags:{}};
  for(const [key,value] of Object.entries(defaults))if(element[key]==null)element[key]=structuredClone(value);
  element.metaclass='Class';element.stereotype='requirement';
  return element;
}

export function requirementIssues(project){
  const policy=requirementPolicy(project),requirements=(project.elements||[]).filter(element=>element.kind==='Requirement'),counts=new Map();
  for(const requirement of requirements){const id=String(requirement.requirementId||'').trim();if(id)counts.set(id,(counts.get(id)||0)+1)}
  const issues=[];
  for(const requirement of requirements){
    const id=String(requirement.requirementId||'').trim(),add=(severity,code,message,field)=>issues.push({severity,code,message,id:requirement.id,field});
    const owner=requirement.ownerId===project.root?.id?project.root:(project.elements||[]).find(element=>element.id===requirement.ownerId);
    if(!owner||!['Model','Package','ModelLibrary','Requirement'].includes(owner.kind))add('error','REQUIREMENT_OWNER_INVALID',`${id||requirement.name} has an invalid owner.`,'ownerId');
    const ancestry=new Set([requirement.id]);let current=owner;while(current){if(ancestry.has(current.id)){add('error','REQUIREMENT_CONTAINMENT_CYCLE',`${id||requirement.name} participates in a containment cycle.`,'ownerId');break}ancestry.add(current.id);current=current.ownerId===project.root?.id?project.root:(project.elements||[]).find(element=>element.id===current.ownerId)}
    if(policy.requireId&&!id)add('error','REQUIREMENT_ID_REQUIRED',`${requirement.name} requires a Requirement ID.`,'requirementId');
    if(policy.uniqueId&&id&&counts.get(id)>1)add('error','REQUIREMENT_ID_DUPLICATE',`Requirement ID ${id} is not unique.`,'requirementId');
    if(policy.requireText&&!String(requirement.requirementText||'').trim())add('error','REQUIREMENT_TEXT_REQUIRED',`${id||requirement.name} requires text.`,'requirementText');
    if(!policy.statuses.includes(requirement.lifecycleStatus))add('error','REQUIREMENT_STATUS_INVALID',`${id||requirement.name} has unsupported status ${requirement.lifecycleStatus}.`,'lifecycleStatus');
    if(!policy.priorities.includes(requirement.priority))add('error','REQUIREMENT_PRIORITY_INVALID',`${id||requirement.name} has unsupported priority ${requirement.priority}.`,'priority');
    if(!policy.verificationMethods.includes(requirement.verificationMethod))add('error','REQUIREMENT_VERIFICATION_METHOD_INVALID',`${id||requirement.name} has unsupported verification method ${requirement.verificationMethod}.`,'verificationMethod');
  }
  return issues;
}

export function requirementChildren(project,parentId){return(project.elements||[]).filter(element=>element.kind==='Requirement'&&element.ownerId===parentId).sort((a,b)=>(a.requirementOrder??0)-(b.requirementOrder??0)||a.name.localeCompare(b.name))}
export function requirementAncestors(project,requirementId){const result=[],seen=new Set([requirementId]);let current=(project.elements||[]).find(element=>element.id===requirementId);while(current?.ownerId){const owner=current.ownerId===project.root?.id?project.root:(project.elements||[]).find(element=>element.id===current.ownerId);if(!owner||seen.has(owner.id))break;seen.add(owner.id);result.unshift(owner);current=owner}return result}
export function requirementBreadcrumb(project,requirementId){return[...requirementAncestors(project,requirementId),(project.elements||[]).find(element=>element.id===requirementId)].filter(Boolean).map(element=>element.name||element.requirementId||element.id).join(' › ')}
export function canMoveRequirement(project,requirementId,newOwnerId){const requirement=(project.elements||[]).find(element=>element.id===requirementId&&element.kind==='Requirement'),owner=newOwnerId===project.root?.id?project.root:(project.elements||[]).find(element=>element.id===newOwnerId);if(!requirement||!owner||requirement.id===owner.id||!['Model','Package','ModelLibrary','Requirement'].includes(owner.kind))return false;const seen=new Set([requirement.id]);let current=owner;while(current){if(seen.has(current.id))return false;seen.add(current.id);current=current.ownerId===project.root?.id?project.root:(project.elements||[]).find(element=>element.id===current.ownerId)}return true}
export function moveRequirement(project,requirementId,newOwnerId,index=null){if(!canMoveRequirement(project,requirementId,newOwnerId))throw Error('Requirement containment move would be invalid or cyclic.');const requirement=project.elements.find(element=>element.id===requirementId),siblings=requirementChildren(project,newOwnerId).filter(element=>element.id!==requirementId);requirement.ownerId=newOwnerId;siblings.splice(index==null?siblings.length:Math.max(0,Math.min(index,siblings.length)),0,requirement);siblings.forEach((element,order)=>element.requirementOrder=order);return requirement}

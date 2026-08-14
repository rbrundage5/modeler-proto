export const REQUIREMENT_TYPES=['Requirement','Abstract Requirement','Business Requirement','Functional Requirement','Interface Requirement','Performance Requirement','Physical Requirement','Design Constraint','Stakeholder','Business','Mission','Capability','System','Subsystem','Interface','Functional','Performance','Physical','Environmental','Safety','Security','Reliability','Maintainability','Regulatory','Design constraint','Verification','Derived'];
export const DEFAULT_REQUIREMENT_POLICY={requireId:true,requireText:true,uniqueId:true,statuses:['Draft','In Review','Approved','Baseline','Rejected','Retired'],priorities:['Low','Medium','High','Critical'],verificationMethods:['Analysis','Demonstration','Inspection','Test']};

export function requirementPolicy(project){
  project.settings=project.settings||{};
  const stored=project.settings.requirements||{},mergeVocabulary=(required,custom)=>[...new Set([...required,...(Array.isArray(custom)?custom:[])])];
  return project.settings.requirements={
    ...DEFAULT_REQUIREMENT_POLICY,...stored,
    statuses:mergeVocabulary(DEFAULT_REQUIREMENT_POLICY.statuses,stored.statuses),
    priorities:mergeVocabulary(DEFAULT_REQUIREMENT_POLICY.priorities,stored.priorities),
    verificationMethods:mergeVocabulary(DEFAULT_REQUIREMENT_POLICY.verificationMethods,stored.verificationMethods)
  };
}

export function initializeRequirement(element,now=new Date().toISOString()){
  const defaults={requirementType:'Requirement',requirementCategory:'System',requirementId:'',requirementText:'',shortTitle:'',sourceUri:'',sourceDocument:'',sourceSection:'',sourceLocator:'',sourceRevision:'',rationale:'',risk:'Medium',criticality:'Medium',priority:'Medium',status:'Draft',lifecycleStatus:'Draft',maturity:'Proposed',verificationMethod:'Analysis',verificationStatus:'Not Planned',version:'',currentRevisionId:'',requirementRevisionIds:[],responsibleRole:'',approver:'',approvalDate:'',createdDate:now,modifiedDate:now,baselineIds:[],applicabilityRules:[],impactMetadata:{},suspect:false,customStereotypeProperties:{},tags:{}};
  for(const [key,value] of Object.entries(defaults))if(element[key]==null)element[key]=structuredClone(value);
  element.metaclass='Class';element.stereotype='requirement';
  return element;
}
export function normalizeRequirementArchitecture(project){project.requirementArchitectureMigration=project.requirementArchitectureMigration||{version:'1.0',unresolved:[],appliedAt:project.metadata?.updatedAt||new Date().toISOString()};const unresolved=[];for(const requirement of(project.elements||[]).filter(item=>item.kind==='Requirement')){initializeRequirement(requirement,project.metadata?.createdAt);if(!requirement.externalId)unresolved.push({code:'LEGACY_REQUIREMENT_EXTERNAL_ID_MISSING',id:requirement.id});if(!requirement.requirementId)unresolved.push({code:'LEGACY_REQUIREMENT_ID_MISSING',id:requirement.id});if(!String(requirement.requirementText||'').trim())unresolved.push({code:'LEGACY_REQUIREMENT_TEXT_MISSING',id:requirement.id})}for(const relationship of project.relationships||[]){relationship.createdAt=relationship.createdAt||project.metadata?.createdAt||'';relationship.modifiedAt=relationship.modifiedAt||project.metadata?.updatedAt||relationship.createdAt;relationship.provenance=relationship.provenance??null;relationship.suspect=Boolean(relationship.suspect)}project.requirementArchitectureMigration.unresolved=unresolved;if(['3.0','3.1'].includes(String(project.schemaVersion)))project.schemaVersion='3.2';return project}

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

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
    if(policy.requireId&&!id)add('error','REQUIREMENT_ID_REQUIRED',`${requirement.name} requires a Requirement ID.`,'requirementId');
    if(policy.uniqueId&&id&&counts.get(id)>1)add('error','REQUIREMENT_ID_DUPLICATE',`Requirement ID ${id} is not unique.`,'requirementId');
    if(policy.requireText&&!String(requirement.requirementText||'').trim())add('error','REQUIREMENT_TEXT_REQUIRED',`${id||requirement.name} requires text.`,'requirementText');
    if(!policy.statuses.includes(requirement.lifecycleStatus))add('error','REQUIREMENT_STATUS_INVALID',`${id||requirement.name} has unsupported status ${requirement.lifecycleStatus}.`,'lifecycleStatus');
    if(!policy.priorities.includes(requirement.priority))add('error','REQUIREMENT_PRIORITY_INVALID',`${id||requirement.name} has unsupported priority ${requirement.priority}.`,'priority');
    if(!policy.verificationMethods.includes(requirement.verificationMethod))add('error','REQUIREMENT_VERIFICATION_METHOD_INVALID',`${id||requirement.name} has unsupported verification method ${requirement.verificationMethod}.`,'verificationMethod');
  }
  return issues;
}

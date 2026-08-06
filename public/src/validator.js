import {allElements,findElement,findRelationship,qualifiedName} from "./model.js";
import {isTypedFeature,validTypeKinds,normalizeBound,supportsDirection} from './semantic-editor.js';
import {ELEMENTS,RELATIONSHIPS,DIAGRAMS,endpointAllowed} from "./sysml-profile.js";
export function validate(project){
  const issues=[],seen=new Set();
  const add=(severity,code,message,id=null)=>issues.push({severity,code,message,id});
  for(const e of allElements(project)){
    if(seen.has(e.id))add("error","DUPLICATE_ID",`Duplicate ID ${e.id}.`,e.id);seen.add(e.id);
    if(!e.name)add("error","NAME_REQUIRED",`${e.kind} ${e.id} has no name.`,e.id);
    const owner=e.ownerId?findElement(project,e.ownerId):null;
    if(e.ownerId&&!owner)add("error","OWNER_UNRESOLVED",`${e.name} has unresolved owner ${e.ownerId}.`,e.id);
    const def=ELEMENTS[e.kind];
    if(!def)add("warning","UNKNOWN_KIND",`${qualifiedName(project,e.id)} uses unsupported kind ${e.kind}.`,e.id);
    for(const f of def?.required||[])if(!String(e[f]||"").trim())add("error","REQUIRED_FIELD",`${qualifiedName(project,e.id)} requires ${f}.`,e.id);
    if(def?.ownerKinds&&owner&&!def.ownerKinds.includes(owner.kind))add("error","OWNER_KIND",`${e.kind} ${e.name} must be owned by ${def.ownerKinds.join(" or ")}, not ${owner.kind}.`,e.id);
    if(isTypedFeature(e)&&!e.typeRef)add("warning","TYPE_REQUIRED",`${qualifiedName(project,e.id)} should be typed.`,e.id);
    if(e.typeRef){const t=findElement(project,e.typeRef);if(!t)add("error","TYPE_UNRESOLVED",`${qualifiedName(project,e.id)} has unresolved type ${e.typeRef}.`,e.id);else if(!validTypeKinds(e.kind).includes(t.kind))add("error","TYPE_KIND",`${e.kind} ${e.name} cannot be typed by ${t.kind} ${t.name}.`,e.id)}
    const lo=normalizeBound(e.multiplicityLower??String(e.multiplicity||"1").split("..")[0]),hi=normalizeBound(e.multiplicityUpper??(String(e.multiplicity||"1").split("..")[1]||String(e.multiplicity||"1").split("..")[0]),true);
    if(isTypedFeature(e)&&(lo==null||hi==null||(hi!=="*"&&Number(lo)>Number(hi))))add("error","MULTIPLICITY",`${e.name} has invalid multiplicity ${e.multiplicity}.`,e.id);
    if(supportsDirection(e)&&!["in","out","inout"].includes(e.direction))add("error","FEATURE_DIRECTION",`${e.name} has invalid direction ${e.direction}.`,e.id);
  }
  for(const r of project.relationships||[]){
    if(seen.has(r.id))add("error","DUPLICATE_ID",`Duplicate ID ${r.id}.`,r.id);seen.add(r.id);
    const s=findElement(project,r.sourceId),t=findElement(project,r.targetId),def=RELATIONSHIPS[r.kind];
    if(!s||!t){add("error","ENDPOINT_UNRESOLVED",`${r.kind} ${r.id} has unresolved endpoints.`,r.id);continue}
    if(!def){add("warning","UNKNOWN_RELATIONSHIP",`${r.kind} is not supported.`,r.id);continue}
    if(!endpointAllowed(def.source,s.kind))add("error","INVALID_SOURCE",`${r.kind} cannot start at ${s.kind} ${s.name}.`,r.id);
    if(!endpointAllowed(def.target,t.kind))add("error","INVALID_TARGET",`${r.kind} cannot end at ${t.kind} ${t.name}.`,r.id);
    if(r.kind==="ItemFlow"&&!r.conveyedIds?.length)add("warning","ITEMFLOW_CONVEYED",`ItemFlow ${r.id} has no conveyed classifier.`,r.id);
  }
  for(const d of project.diagrams||[]){
    const def=DIAGRAMS[d.diagramType],owner=findElement(project,d.ownerId),context=findElement(project,d.contextId);
    if(!def){add("error","DIAGRAM_TYPE",`${d.name} has unsupported type ${d.diagramType}.`,d.id);continue}
    if(!owner)add("error","DIAGRAM_OWNER",`${d.name} has unresolved owner.`,d.id);
    if(!context)add("error","DIAGRAM_CONTEXT",`${d.name} has unresolved context.`,d.id);
    if(def.contextKinds&&context&&!def.contextKinds.includes(context.kind))add("error","CONTEXT_KIND",`${d.diagramType} requires ${def.contextKinds.join(" or ")} context, not ${context.kind}.`,d.id);
    for(const n of d.nodes||[]){
      const e=findElement(project,n.elementId);
      if(!e)add("error","MISSING_ELEMENT",`${d.name} presents missing element ${n.elementId}.`,d.id);
      else if(!def.elements.includes(e.kind))add("warning","INVALID_PRESENTATION",`${e.kind} ${e.name} is not valid on ${d.diagramType}.`,e.id);
    }
    for(const edge of d.edges||[]){
      const r=findRelationship(project,edge.relationshipId);
      if(!r)add("error","MISSING_RELATIONSHIP",`${d.name} references missing relationship ${edge.relationshipId}.`,d.id);
      else if(!def.relationships.includes(r.kind))add("warning","INVALID_REL_PRESENTATION",`${r.kind} is not valid on ${d.diagramType}.`,r.id);
    }
  }
  // Structural and project-environment validation.
  for(const e of project.elements||[]){
    if(["ProxyPort","FullPort"].includes(e.kind)){
      if(e.isConjugated && !(e.typeRef)) add("warning","CONJUGATED_UNTYPED",`${e.name} is conjugated but has no interface type.`,e.id);
      for(const iid of [...(e.providedInterfaceIds||[]),...(e.requiredInterfaceIds||[])]) if(!findElement(project,iid)) add("error","INTERFACE_UNRESOLVED",`${e.name} references missing interface ${iid}.`,e.id);
    }
    for(const id of e.redefinedPropertyIds||[])if(!findElement(project,id))add("error","REDEFINITION_UNRESOLVED",`${e.name} redefines missing property ${id}.`,e.id);
    for(const id of e.subsettedPropertyIds||[])if(!findElement(project,id))add("error","SUBSETTING_UNRESOLVED",`${e.name} subsets missing property ${id}.`,e.id);
    if(e.kind==='Requirement'&&e.approvalStatus==='Approved'&&!e.approvedBy)add("warning","APPROVAL_ACTOR",`${e.name} is approved without an approver.`,e.id);
    if(e.kind==='ConstraintBlock'&&e.constraintExpression&&!/^[a-zA-Z_][\w]*\s*=/.test(e.constraintExpression))add("error","CONSTRAINT_SYNTAX",`${e.name} has an invalid constraint expression.`,e.id);
  }
  for(const r of project.relationships||[]){
    if(["Connector","DelegationConnector"].includes(r.kind)){
      if(!['assembly','delegation'].includes(r.connectorKind||'assembly'))add("error","CONNECTOR_KIND",`${r.id} has invalid connector kind.`,r.id);
      for(const id of [...(r.sourcePartWithPortPath||[]),...(r.targetPartWithPortPath||[])])if(!findElement(project,id))add("error","PART_WITH_PORT_PATH",`${r.id} has unresolved partWithPort path ${id}.`,r.id);
    }
    if(r.kind==='Transition'&&!r.guard&&!r.triggerId&&!r.effect)add("warning","EMPTY_TRANSITION",`${r.id} has no trigger, guard, or effect.`,r.id);
    if(r.kind==='Message'&&!['synchronous','asynchronous','reply','create','delete'].includes(r.messageSort||'synchronous'))add("error","MESSAGE_SORT",`${r.id} has invalid message sort.`,r.id);
  }
  return issues;
}

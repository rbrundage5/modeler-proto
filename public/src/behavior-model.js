export const INTERACTION_OPERATORS=Object.freeze(['alt','opt','loop','par','break','critical','neg','assert','strict','seq','ignore','consider']);
export const MESSAGE_KINDS=Object.freeze(['synchronous','asynchronous','reply','create','delete','signal','lost','found']);
export const BEHAVIOR_ELEMENT_KINDS=new Set(['Behavior','Activity','Action','CallBehaviorAction','CallOperationAction','SendSignalAction','AcceptEventAction','InputPin','OutputPin','InitialNode','ActivityFinalNode','FlowFinalNode','DecisionNode','MergeNode','ForkNode','JoinNode','ObjectNode','CentralBufferNode','DataStoreNode','ActivityParameterNode','ActivityPartition','StateMachine','Region','State','InitialPseudostate','FinalState','Trigger','Interaction','Lifeline','ExecutionSpecification','CombinedFragment','InteractionOperand','Actor','UseCase','ExtensionPoint']);
export const BEHAVIOR_RELATIONSHIP_KINDS=new Set(['ControlFlow','ObjectFlow','Transition','Message','Include','Extend']);

export function initializeBehaviorElement(element){
  if(!element||!BEHAVIOR_ELEMENT_KINDS.has(element.kind))return element;
  if(element.kind==='CallBehaviorAction')element.referencedBehaviorId??='';
  if(element.kind==='CallOperationAction')element.referencedOperationId??='';
  if(element.kind==='SendSignalAction')element.signalId??='';
  if(element.kind==='AcceptEventAction')element.eventId??='';
  if(['InputPin','OutputPin','ObjectNode','CentralBufferNode','DataStoreNode','ActivityParameterNode'].includes(element.kind)){element.typeRef??=element.carriedTypeId||'';element.carriedTypeId??=element.typeRef;}
  if(['InputPin','OutputPin'].includes(element.kind)){element.lower??=1;element.upper??=1;element.isOrdered??=false;element.isUnique??=true;}
  if(element.kind==='ActivityParameterNode')element.parameterId??='';
  if(element.kind==='ActivityPartition'){element.orientation=['horizontal','vertical'].includes(element.orientation)?element.orientation:'vertical';element.representedElementId??='';element.memberIds=Array.isArray(element.memberIds)?element.memberIds:[];}
  if(['ForkNode','JoinNode'].includes(element.kind))element.orientation=['horizontal','vertical'].includes(element.orientation)?element.orientation:'horizontal';
  if(element.kind==='Lifeline'){element.representedElementId??='';element.selector??='';}
  if(element.kind==='ExecutionSpecification'){element.coveredLifelineId??='';element.startMessageId??='';element.finishMessageId??='';}
  if(element.kind==='CombinedFragment')element.fragmentOperator=INTERACTION_OPERATORS.includes(element.fragmentOperator)?element.fragmentOperator:'alt';
  if(element.kind==='InteractionOperand')element.guard??='';
  if(element.kind==='State'){element.entry??='';element.doActivity??='';element.exit??='';}
  if(element.kind==='UseCase')element.extensionPoints=Array.isArray(element.extensionPoints)?element.extensionPoints:[];
  return element;
}

export function initializeBehaviorRelationship(relationship){
  if(!relationship||!BEHAVIOR_RELATIONSHIP_KINDS.has(relationship.kind))return relationship;
  relationship.direction=relationship.direction||'sourceToTarget';
  if(relationship.kind==='Message'){
    relationship.messageSort=MESSAGE_KINDS.includes(relationship.messageSort)?relationship.messageSort:'synchronous';
    relationship.sequenceOrder=Number.isFinite(Number(relationship.sequenceOrder))?Number(relationship.sequenceOrder):0;
    relationship.operationRef??='';relationship.signalRef??='';
  }
  if(relationship.kind==='ObjectFlow')relationship.carriedTypeId??='';
  if(relationship.kind==='Transition'){relationship.triggerIds=Array.isArray(relationship.triggerIds)?relationship.triggerIds:[];relationship.guard??='';relationship.effect??='';}
  if(relationship.kind==='Include')relationship.stereotype='include';
  if(relationship.kind==='Extend'){relationship.stereotype='extend';relationship.extensionPointId??='';}
  return relationship;
}

export function normalizeBehaviorModel(project){
  for(const element of project.elements||[])initializeBehaviorElement(element);
  for(const relationship of project.relationships||[])initializeBehaviorRelationship(relationship);
  return project;
}

export function validLifelineRepresentation(project,representedId){
  const represented=project.root?.id===representedId?project.root:(project.elements||[]).find(item=>item.id===representedId);
  return Boolean(represented&&['Actor','Block','PartProperty','ReferenceProperty','InstanceSpecification','Usage','Instance'].includes(represented.kind));
}

const CONTROL_NODES=new Set(['Action','CallBehaviorAction','CallOperationAction','SendSignalAction','AcceptEventAction','InitialNode','ActivityFinalNode','FlowFinalNode','DecisionNode','MergeNode','ForkNode','JoinNode']);
const OBJECT_NODES=new Set(['Action','CallBehaviorAction','CallOperationAction','SendSignalAction','AcceptEventAction','InputPin','OutputPin','ObjectNode','ActivityParameterNode','CentralBufferNode','DataStoreNode']);
const STATE_VERTICES=new Set(['State','CompositeState','SubmachineState','InitialPseudostate','ChoicePseudostate','JunctionPseudostate','ShallowHistory','DeepHistory','EntryPoint','ExitPoint','StateFork','StateJoin','FinalState']);
export function validateBehaviorConnection(project,kind,sourceId,targetId){
  const find=id=>(project.elements||[]).find(item=>item.id===id),source=find(sourceId),target=find(targetId);
  if(!source||!target)return{valid:false,message:'Both behavioral relationship endpoints must resolve to semantic elements.'};
  if(kind==='Generalization'&&['Actor','UseCase'].includes(source.kind)){if(source.kind!==target.kind)return{valid:false,message:'Use Case Diagram Generalization must connect two Actors or two Use Cases; mixed endpoints are invalid.'};const reaches=(from,wanted,seen=new Set())=>{if(from===wanted)return true;if(seen.has(from))return false;seen.add(from);return(project.relationships||[]).filter(item=>item.kind==='Generalization'&&item.sourceId===from).some(item=>reaches(item.targetId,wanted,seen))};if(reaches(target.id,source.id))return{valid:false,message:'Generalization would create an inheritance cycle.'};return{valid:true}}
  const rule=kind==='ControlFlow'?CONTROL_NODES:kind==='ObjectFlow'?OBJECT_NODES:kind==='Transition'?STATE_VERTICES:kind==='Message'?new Set(['Lifeline']):['Include','Extend'].includes(kind)?new Set(['UseCase']):null;
  if(!rule)return{valid:true};
  if(!rule.has(source.kind)||!rule.has(target.kind))return{valid:false,message:`${kind} cannot connect ${source.kind} to ${target.kind}. Valid endpoint kinds: ${[...rule].join(', ')}.`};
  if(kind==='ControlFlow'&&['ActivityFinalNode','FlowFinalNode'].includes(source.kind))return{valid:false,message:`${source.kind} cannot be the source of a ControlFlow.`};
  if(kind==='ControlFlow'&&target.kind==='InitialNode')return{valid:false,message:'InitialNode cannot be the target of a ControlFlow.'};
  if(kind==='ObjectFlow'){
    const sources=new Set(['Action','CallBehaviorAction','CallOperationAction','SendSignalAction','AcceptEventAction','OutputPin','ObjectNode','CentralBufferNode','DataStoreNode','ActivityParameterNode']);
    const targets=new Set(['InputPin','ObjectNode','CentralBufferNode','DataStoreNode','ActivityParameterNode']);
    if(!sources.has(source.kind))return{valid:false,message:`ObjectFlow source ${source.name||source.kind} resolves to ${source.kind}; select an OutputPin, ObjectNode, CentralBufferNode, DataStoreNode, or ActivityParameterNode.`};
    if(!targets.has(target.kind))return{valid:false,message:`ObjectFlow target ${target.name||target.kind} resolves to ${target.kind}; select an InputPin, ObjectNode, CentralBufferNode, DataStoreNode, or ActivityParameterNode.`};
    const sourceType=source.typeRef||source.carriedTypeId,targetType=target.typeRef||target.carriedTypeId;
    if(!sourceType&&(source.kind.endsWith('Action')||source.kind==='Action'))return{valid:true};
    if(!sourceType)return{valid:false,message:`Source ${source.kind} ${source.name||''} has no semantic type. Select a compatible classifier in its property panel.`};
    if(!targetType)return{valid:false,message:`Target ${target.kind} ${target.name||''} has no semantic type. Select a compatible classifier in its property panel.`};
    const findType=id=>(project.elements||[]).find(item=>item.id===id),a=findType(sourceType),b=findType(targetType);
    if(!a)return{valid:false,message:`Source ${source.kind} type reference cannot be resolved by stable ID.`};
    if(!b)return{valid:false,message:`Target ${target.kind} type reference cannot be resolved by stable ID.`};
    const ancestors=id=>{const result=new Set([id]),queue=[id];while(queue.length){const current=queue.shift();for(const rel of project.relationships||[])if(rel.kind==='Generalization'&&rel.sourceId===current&&!result.has(rel.targetId)){result.add(rel.targetId);queue.push(rel.targetId)}}return result};
    const aa=ancestors(a.id),bb=ancestors(b.id);if(![...aa].some(id=>bb.has(id)))return{valid:false,message:`Source type ${a.name} and target type ${b.name} have no common compatible classifier or generalization.`};
  }
  if(kind==='Transition'&&source.kind==='FinalState')return{valid:false,message:'FinalState cannot be the source of a Transition.'};
  return{valid:true};
}

/** Resolve an Activity canvas selection without ever treating presentation identity as semantic identity. */
export function resolveActivityEndpoint(project,diagram,selection,side='Endpoint'){
  const presentationId=typeof selection==='string'?selection:selection?.presentationId||selection?.nodeId||selection?.id;
  const presentation=diagram?.nodes?.find(node=>node.id===presentationId)||(selection?.elementId?selection:null);
  if(!presentation)throw new Error(`${side} presentation ${presentationId||'(missing)'} does not exist on the active Activity Diagram.`);
  if(!presentation.elementId)throw new Error(`${side} presentation ${presentation.id} does not reference a semantic Activity element.`);
  const element=(project.elements||[]).find(item=>item.id===presentation.elementId);
  if(!element)throw new Error(`${side} presentation ${presentation.id} references missing semantic element ${presentation.elementId}.`);
  return{presentationId:presentation.id,semanticId:element.id,element};
}

export function behaviorRelationshipLabel(project,relationship){
  if(relationship.kind==='Transition'){
    const triggers=(relationship.triggerIds||[]).map(id=>(project.elements||[]).find(item=>item.id===id)?.name||id).filter(Boolean).join(', ');
    return [triggers,relationship.guard?`[${relationship.guard}]`:'',relationship.effect?`/ ${relationship.effect}`:''].filter(Boolean).join(' ');
  }
  if(relationship.kind==='Include')return `«include»${relationship.name?` ${relationship.name}`:''}`;
  if(relationship.kind==='Extend')return `«extend»${relationship.name?` ${relationship.name}`:''}`;
  return '';
}

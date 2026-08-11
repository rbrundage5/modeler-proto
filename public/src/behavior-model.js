export const INTERACTION_OPERATORS=Object.freeze(['alt','opt','loop','par','break','critical','neg','assert','strict','seq','ignore','consider']);
export const MESSAGE_KINDS=Object.freeze(['synchronous','asynchronous','reply','create','delete','signal','lost','found']);
export const BEHAVIOR_ELEMENT_KINDS=new Set(['Behavior','Activity','Action','CallBehaviorAction','InitialNode','ActivityFinalNode','FlowFinalNode','DecisionNode','MergeNode','ForkNode','JoinNode','ObjectNode','ActivityParameterNode','StateMachine','Region','State','InitialPseudostate','FinalState','Trigger','Interaction','Lifeline','ExecutionSpecification','CombinedFragment','InteractionOperand','Actor','UseCase','ExtensionPoint']);
export const BEHAVIOR_RELATIONSHIP_KINDS=new Set(['ControlFlow','ObjectFlow','Transition','Message','Include','Extend']);

export function initializeBehaviorElement(element){
  if(!element||!BEHAVIOR_ELEMENT_KINDS.has(element.kind))return element;
  if(['Action','CallBehaviorAction'].includes(element.kind))element.referencedBehaviorId??='';
  if(['ObjectNode','ActivityParameterNode'].includes(element.kind))element.carriedTypeId??='';
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
  if(kind==='ControlFlow'&&source.kind==='ActivityFinalNode')return{valid:false,message:'ActivityFinalNode cannot be the source of a ControlFlow.'};
  if(kind==='Transition'&&source.kind==='FinalState')return{valid:false,message:'FinalState cannot be the source of a Transition.'};
  return{valid:true};
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

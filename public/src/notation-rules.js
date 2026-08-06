import {RELATIONSHIPS} from './sysml-profile.js';

const REQUIREMENT_STEREOTYPES={Satisfy:'satisfy',Verify:'verify',Refine:'refine',DeriveReqt:'deriveReqt',Trace:'trace',Copy:'copy'};
const DEPENDENCY_KEYWORDS={...REQUIREMENT_STEREOTYPES,Include:'include',Extend:'extend'};

export function stereotypeLabel(name){const clean=String(name||'').replace(/[«»<>]/g,'').trim();return clean?`«${clean}»`:''}

export function transitionLabel(relationship,triggerName=''){
  return [triggerName||relationship.trigger||'',relationship.guard?`[${relationship.guard}]`:'',relationship.effect?`/ ${relationship.effect}`:''].filter(Boolean).join(' ');
}

export function nodeNotation(kind){
  if(['InitialNode','InitialPseudostate'].includes(kind))return 'initial';
  if(['ActivityFinalNode','FinalState'].includes(kind))return 'final';
  if(kind==='FlowFinalNode')return 'flow-final';
  if(['DecisionNode','MergeNode','ChoicePseudostate'].includes(kind))return 'diamond';
  if(kind==='JunctionPseudostate')return 'junction';
  if(['ForkNode','JoinNode','StateFork','StateJoin'].includes(kind))return 'bar';
  if(kind==='ShallowHistory')return 'history';
  if(kind==='DeepHistory')return 'deep-history';
  if(kind==='Actor')return 'actor';
  if(kind==='UseCase')return 'use-case';
  if(kind==='ProxyPort')return 'proxy-port';
  if(kind==='FullPort')return 'full-port';
  if(['Action','CallBehaviorAction','CallOperationAction','SendSignalAction','AcceptEventAction'].includes(kind))return 'action';
  if(['State','CompositeState','SubmachineState'].includes(kind))return 'state';
  return 'classifier';
}

export function relationshipNotation(relationship){
  const kind=relationship.kind,base=RELATIONSHIPS[kind]?.notation||'solid';
  const result={dashed:base.startsWith('dashed'),sourceMarker:'none',targetMarker:base.includes('triangle')?'triangle':base.includes('filled-diamond')?'diamondFilled':base.includes('diamond')?'diamond':base.includes('open')?'open':'none',keyword:relationship.stereotype||DEPENDENCY_KEYWORDS[kind]||''};
  for(const end of ['source','target']){
    const aggregation=relationship[`${end}Aggregation`];
    if(aggregation==='composite')result[`${end}Marker`]='diamondFilled';
    else if(aggregation==='shared')result[`${end}Marker`]='diamond';
  }
  if(kind==='BindingConnector')Object.assign(result,{sourceMarker:'none',targetMarker:'none',dashed:false});
  if(kind==='Message'){
    result.targetMarker=relationship.messageSort==='synchronous'?'filled':'open';
    result.dashed=relationship.messageSort==='reply';
    if(relationship.messageSort==='delete')result.targetMarker='destruction';
  }
  return result;
}

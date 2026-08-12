export const ACTIVITY_CORE_TYPES=Object.freeze([
  'Action','CallBehaviorAction','CallOperationAction','SendSignalAction','AcceptEventAction',
  'InputPin','OutputPin','ActivityParameterNode','ObjectNode','CentralBufferNode','DataStoreNode',
  'InitialNode','ActivityFinalNode','FlowFinalNode','DecisionNode','MergeNode','ForkNode','JoinNode','ActivityPartition',
  'StructuredActivityNode','ExpansionRegion','InterruptibleActivityRegion','Comment'
]);
export const ACTIVITY_FLOW_TYPES=Object.freeze(['ControlFlow','ObjectFlow','InterruptingEdge','Allocate']);
const ownedFeature=new Set(['InputPin','OutputPin']);
const structured=new Set(['StructuredActivityNode','ExpansionRegion','InterruptibleActivityRegion']);
export const ACTIVITY_COMPATIBILITY_MANIFEST=Object.freeze(ACTIVITY_CORE_TYPES.map(kind=>Object.freeze({
  kind,classification:kind==='Comment'?'UML':'UML used by SysML',independentlyCreatable:!ownedFeature.has(kind),
  paletteRequired:!ownedFeature.has(kind),ownedFeatureEditor:ownedFeature.has(kind)?'Action boundary palette placement':null,
  owner:ownedFeature.has(kind)?'Action':structured.has(kind)?'Activity or structured Activity context':'Activity',dispatcher:'createAt',renderer:'drawNode',propertyEditor:'renderProperties',
  importerMapping:kind,completionState:'complete'
})));
export function validateActivityManifest(elements,relationships){
  const missingElements=ACTIVITY_CORE_TYPES.filter(kind=>!elements.includes(kind));
  const missingRelationships=ACTIVITY_FLOW_TYPES.filter(kind=>!relationships.includes(kind));
  return{valid:missingElements.length===0&&missingRelationships.length===0,missingElements,missingRelationships};
}

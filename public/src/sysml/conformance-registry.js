import {DIAGRAMS,ELEMENTS,RELATIONSHIPS} from '../sysml-profile.js';

/** Allowed assessment values. "working" is reserved for an end-to-end tested workflow. */
export const MATURITY_STATUSES=Object.freeze(['working','partial','broken','missing','not-applicable','not-tested']);
export const CLAIMED_DIAGRAM_TYPES=Object.freeze([
  'Block Definition Diagram','Internal Block Diagram','Requirement Diagram','Use Case Diagram',
  'Activity Diagram','State Machine Diagram','Sequence Diagram','Parametric Diagram','Package Diagram'
]);

const VERIFIED_COMBINATIONS=new Map([
  ['Block Definition Diagram:Block','containment-presentation-identity'],
  ['Block Definition Diagram:DataType','structural-typing-workflow'],
  ['Block Definition Diagram:ValueType','structural-typing-workflow'],
  ['Internal Block Diagram:ValueProperty','structural-typing-workflow'],
  ['Parametric Diagram:ValueProperty','structural-typing-workflow'],
  ['Internal Block Diagram:PartProperty','ibd-professional-workflow'],
  ['Internal Block Diagram:ReferenceProperty','ibd-professional-workflow'],
  ['Internal Block Diagram:ProxyPort','ibd-professional-workflow'],
  ['Internal Block Diagram:FullPort','ibd-professional-workflow'],
  ['Requirement Diagram:Requirement','requirements-persistence-workflow'],
  ['Requirement Diagram:TestCase','testcase-complete-workflow'],
  ['Use Case Diagram:Actor','presentation-compatibility-workflow'],
  ['Use Case Diagram:UseCase','presentation-compatibility-workflow'],
  ['Sequence Diagram:Lifeline','sequence-professional-workflow']
]);
const FIXTURES=Object.freeze({
  'containment-presentation-identity':'test/containment-diagram-drop.test.mjs',
  'ibd-professional-workflow':'test/ibd-engine.test.mjs',
  'requirements-persistence-workflow':'test/requirements-phase-1.test.mjs',
  'presentation-compatibility-workflow':'test/presentation-compatibility.test.mjs',
  'sequence-professional-workflow':'test/sequence-interactions.test.mjs',
  'testcase-complete-workflow':'test/selected-element-semantics.test.mjs',
  'structural-typing-workflow':'test/e01s2-structural-typing.test.mjs'
});
const SPECIAL_PRESENTATIONS={Actor:'ActorPresentation',UseCase:'UseCasePresentation',Lifeline:'LifelinePresentation',CombinedFragment:'CombinedFragmentPresentation',InteractionUse:'InteractionUsePresentation',ProxyPort:'PortPresentation',FullPort:'PortPresentation',InputPin:'InputPinPresentation',OutputPin:'OutputPinPresentation'};
const fixedSize=new Set(['ProxyPort','FullPort','InputPin','OutputPin','InitialNode','InitialPseudostate','ActivityFinalNode','FinalState','FlowFinalNode','DecisionNode','MergeNode','ChoicePseudostate','JunctionPseudostate','ShallowHistory','DeepHistory','EntryPoint','ExitPoint']);
const contextual=new Set(['ProxyPort','FullPort','InputPin','OutputPin']);
const sequenceDirect=new Set(['Lifeline','CombinedFragment','InteractionUse','Comment']);

function presentationType(kind){return SPECIAL_PRESENTATIONS[kind]||`${kind}Presentation`}
function editingOperations(kind){return ['select','move',...(fixedSize.has(kind)?[]:['resize']),'edit-label','edit-properties','delete-presentation','delete-semantic','undo','redo','save-reload']}
function elementCapability(diagramType,kind){
  const fixtureId=VERIFIED_COMBINATIONS.get(`${diagramType}:${kind}`)||null;
  const placementMode=contextual.has(kind)?'contextual':'direct';
  return Object.freeze({
    semanticType:kind,presentationType:presentationType(kind),placementMode,
    paletteCreation:placementMode==='direct',containmentPlacement:true,renderer:'svg-node-renderer',
    selectionStrategy:'svg-presentation-selection',resizable:!fixedSize.has(kind),labelEditable:true,
    propertyEditing:true,requiredEditingOperations:editingOperations(kind),persistence:'json-project',
    importSupport:'profile-dependent',collaborationOperations:['add-element','add-node','update-field','move-node','resize-node','delete-node'],
    testFixtureId:fixtureId,maturity:fixtureId?'working':'partial',
    knownLimitations:fixtureId?[]:['The complete user-visible workflow has not been qualified by a dedicated fixture.']
  });
}
function relationshipCapability(kind){const rule=RELATIONSHIPS[kind];return Object.freeze({semanticType:kind,presentationType:`${kind}Presentation`,renderer:'svg-edge-renderer',interactionController:'edge-interaction-controller',sourceKinds:rule.source,targetKinds:rule.target,requiredEditingOperations:['select','connect','reconnect','edit-label','delete-presentation','undo','redo','save-reload'],persistence:'json-project',importSupport:'profile-dependent',collaborationOperations:['add-relationship','add-edge','update-relationship','delete-relationship'],testFixtureId:null,maturity:'partial',knownLimitations:['Relationship-specific end-to-end coverage is incomplete.']})}
function makeDiagram(displayName){
  const profile=DIAGRAMS[displayName];
  const elements=displayName==='Sequence Diagram'?profile.elements.filter(kind=>sequenceDirect.has(kind)):profile.elements;
  return Object.freeze({
    id:profile.abbreviation,displayName,requiredSemanticContext:Object.freeze(profile.contextKinds||['Model','Package','ModelLibrary']),
    validSemanticElements:Object.freeze([...elements]),validPresentations:Object.freeze(elements.map(presentationType)),
    elementCapabilities:Object.freeze(Object.fromEntries(elements.map(kind=>[kind,elementCapability(displayName,kind)]))),
    validRelationships:Object.freeze([...profile.relationships]),relationshipCapabilities:Object.freeze(Object.fromEntries(profile.relationships.map(kind=>[kind,relationshipCapability(kind)]))),
    renderer:'svg-diagram-renderer',interactionController:displayName==='Sequence Diagram'?'sequence-interaction-controller':'diagram-interaction-controller',
    requiredEditingOperations:Object.freeze(['create','select','move','resize','rename','edit-properties','connect','delete-presentation','undo','redo','save-reload']),
    persistence:'json-project',importSupport:'profile-dependent',collaborationOperations:Object.freeze(['semantic','presentation','geometry','property','relationship']),
    testFixtureId:null,maturity:'partial',knownLimitations:Object.freeze(['No complete diagram-wide workflow qualification fixture exists.'])
  });
}

export const DIAGRAM_CAPABILITIES=Object.freeze(Object.fromEntries(CLAIMED_DIAGRAM_TYPES.map(name=>[name,makeDiagram(name)])));
export const CONFORMANCE_REGISTRY=Object.freeze({schemaVersion:1,sysmlVersion:'1.6',maturityStatuses:MATURITY_STATUSES,fixtures:FIXTURES,semanticTypes:Object.freeze(Object.keys(ELEMENTS)),diagramTypes:DIAGRAM_CAPABILITIES});
export function diagramCapability(type){return DIAGRAM_CAPABILITIES[type]||null}
export function elementCapabilityFor(diagramType,semanticType){return diagramCapability(diagramType)?.elementCapabilities?.[semanticType]||null}
export function rejectionReason(diagramType,semanticType){if(!diagramCapability(diagramType))return `Unknown diagram type: ${diagramType}.`;if(!ELEMENTS[semanticType])return `Unknown semantic element type: ${semanticType}.`;return `${semanticType} is not directly placeable on ${diagramType}; choose a compatible diagram or specialized presentation.`}

/* Original notation-derived SVG icons for the repository browser.
   They reference SysML/UML semantic shapes without copying vendor artwork. */
const A='currentColor';
const svg=(body,label)=>`<svg class="sysml-icon" viewBox="0 0 20 20" role="img" aria-label="${label||'model element'}" focusable="false">${body}</svg>`;
const rect=(extra='')=>`<rect x="2.5" y="3" width="15" height="14" rx="1.4" fill="none" stroke="${A}" stroke-width="1.35" ${extra}/>`;
const classifier=(mark='')=>svg(`${rect()}<path d="M2.8 7.2h14.4" stroke="${A}" stroke-width="1.1"/>${mark}`,'classifier');
const property=(fill='none')=>svg(`<path d="M4 5.5h12v9H4z" fill="${fill}" stroke="${A}" stroke-width="1.35"/><path d="M6 8h8M6 10.5h6" stroke="${A}" stroke-width="1"/>`,'property');
const circle=(inner='')=>svg(`<circle cx="10" cy="10" r="6" fill="none" stroke="${A}" stroke-width="1.35"/>${inner}`,'node');
const diamond=()=>svg(`<path d="M10 2.8 17.2 10 10 17.2 2.8 10Z" fill="none" stroke="${A}" stroke-width="1.35"/>`,'decision');
const ICONS={
 Model:()=>svg(`<path d="M3 5h5l1.5 2H17v9H3z" fill="none" stroke="${A}" stroke-width="1.35"/><path d="M6 11h8M10 8v6" stroke="${A}" stroke-width="1.1"/>`,'model'),
 Package:()=>svg(`<path d="M2.5 6h6l1.5-2h7.5v12H2.5z" fill="none" stroke="${A}" stroke-width="1.35"/><path d="M2.5 7.5h15" stroke="${A}" stroke-width="1"/>`,'package'),
 ModelLibrary:()=>svg(`<path d="M2.5 6h6l1.5-2h7.5v12H2.5z" fill="none" stroke="${A}" stroke-width="1.35"/><path d="M5 10h8M5 12.5h8" stroke="${A}" stroke-width="1"/>`,'model library'),
 Profile:()=>classifier(`<path d="M6 10h8M7 13h6" stroke="${A}" stroke-width="1"/><path d="m10 8 1 1-1 1-1-1z" fill="${A}"/>`),
 Stereotype:()=>classifier(`<path d="M5.5 11h9M7 13.5h6" stroke="${A}" stroke-width="1"/>`),
 Block:()=>classifier(`<path d="M6 11h8M6 13.5h5" stroke="${A}" stroke-width="1"/>`),
 AssociationBlock:()=>classifier(`<path d="M5 12h10M10 8v8" stroke="${A}" stroke-width="1"/>`),
 InterfaceBlock:()=>classifier(`<circle cx="10" cy="12" r="2.6" fill="none" stroke="${A}" stroke-width="1.1"/><path d="M12.6 12h2.2" stroke="${A}"/>`),
 ConstraintBlock:()=>classifier(`<text x="10" y="14.2" text-anchor="middle" font-size="7.5" font-family="serif" fill="${A}">{}</text>`),
 Requirement:()=>svg(`${rect()}<path d="M2.8 7.2h14.4" stroke="${A}" stroke-width="1.1"/><text x="10" y="14" text-anchor="middle" font-size="7" font-family="sans-serif" font-weight="700" fill="${A}">req</text>`,'requirement'),
 TestCase:()=>classifier(`<path d="M6 12h8M8 9.5v5" stroke="${A}" stroke-width="1.1"/>`),
 Actor:()=>svg(`<circle cx="10" cy="4.6" r="2" fill="none" stroke="${A}" stroke-width="1.25"/><path d="M10 6.7v5.1M5.8 9h8.4M10 11.8l-3.4 4.4M10 11.8l3.4 4.4" fill="none" stroke="${A}" stroke-width="1.25" stroke-linecap="round"/>`,'actor'),
 UseCase:()=>svg(`<ellipse cx="10" cy="10" rx="7.2" ry="4.8" fill="none" stroke="${A}" stroke-width="1.35"/>`,'use case'),
 PartProperty:()=>property(A), ReferenceProperty:()=>property('none'), ValueProperty:()=>property('none'), FlowProperty:()=>svg(`<rect x="3" y="5" width="14" height="10" rx="1" fill="none" stroke="${A}" stroke-width="1.2"/><path d="M5 10h9m-3-3 3 3-3 3" fill="none" stroke="${A}" stroke-width="1.2"/>`,'flow property'),
 ConstraintProperty:()=>svg(`<rect x="3" y="4" width="14" height="12" rx="1" fill="none" stroke="${A}" stroke-width="1.2"/><text x="10" y="13" text-anchor="middle" font-size="8" font-family="serif" fill="${A}">{}</text>`,'constraint property'),
 ProxyPort:()=>svg(`<rect x="5.5" y="5.5" width="9" height="9" fill="none" stroke="${A}" stroke-width="1.4"/><circle cx="10" cy="10" r="1.5" fill="none" stroke="${A}"/>`,'proxy port'),
 FullPort:()=>svg(`<rect x="5.5" y="5.5" width="9" height="9" fill="${A}" stroke="${A}" stroke-width="1.2"/><rect x="8" y="8" width="4" height="4" fill="white" opacity=".85"/>`,'full port'),
 Operation:()=>svg(`<circle cx="10" cy="10" r="5.5" fill="none" stroke="${A}" stroke-width="1.2"/><path d="M10 6.5v7M6.5 10h7" stroke="${A}" stroke-width="1.2"/>`,'operation'),
 Parameter:()=>svg(`<path d="M4 6h12v8H4z" fill="none" stroke="${A}" stroke-width="1.2"/><path d="M7 10h6" stroke="${A}"/>`,'parameter'),
 Reception:()=>svg(`<path d="M3 10h9m-3-3 3 3-3 3M14 6v8" fill="none" stroke="${A}" stroke-width="1.25"/>`,'reception'),
 PrimitiveType:()=>classifier(`<text x="10" y="14" text-anchor="middle" font-size="5" font-family="sans-serif" fill="${A}">primitive</text>`), ValueType:()=>classifier(`<path d="M6 11h8M6 13.5h8" stroke="${A}" stroke-width="1"/>`), DataType:()=>classifier(`<path d="M5.5 11.5h9" stroke="${A}"/>`), Enumeration:()=>classifier(`<text x="10" y="14" text-anchor="middle" font-size="6.4" font-family="sans-serif" fill="${A}">enum</text>`), EnumerationLiteral:()=>svg(`<circle cx="6" cy="10" r="1.4" fill="${A}"/><path d="M9 10h7" stroke="${A}" stroke-width="1.2"/>`,'enumeration literal'),
 Unit:()=>svg(`<path d="M4 14 14 4l2 2L6 16z" fill="none" stroke="${A}" stroke-width="1.2"/><path d="m8 10 2 2m0-4 2 2" stroke="${A}"/>`,'unit'), QuantityKind:()=>svg(`<path d="M4 15h12M5 15 10 4l5 11" fill="none" stroke="${A}" stroke-width="1.2"/>`,'quantity kind'), Signal:()=>svg(`<path d="M3 10h10m-3-3 3 3-3 3M15 5v10" fill="none" stroke="${A}" stroke-width="1.2"/>`,'signal'),
 Activity:()=>svg(`<rect x="3" y="5" width="14" height="10" rx="5" fill="none" stroke="${A}" stroke-width="1.35"/><path d="m8 8 5 2-5 2z" fill="${A}"/>`,'activity'), Action:()=>svg(`<rect x="3" y="5" width="14" height="10" rx="3" fill="none" stroke="${A}" stroke-width="1.35"/>`,'action'), CallBehaviorAction:()=>svg(`<rect x="3" y="5" width="14" height="10" rx="3" fill="none" stroke="${A}" stroke-width="1.25"/><path d="m7 8 5 2-5 2z" fill="${A}"/>`,'call behavior action'),
 InitialNode:()=>circle(`<circle cx="10" cy="10" r="4.2" fill="${A}"/>`), ActivityFinalNode:()=>circle(`<circle cx="10" cy="10" r="3.5" fill="${A}"/>`), FlowFinalNode:()=>circle(`<path d="m6.5 6.5 7 7m0-7-7 7" stroke="${A}" stroke-width="1.4"/>`), DecisionNode:diamond, MergeNode:diamond,
 ForkNode:()=>svg(`<path d="M3 10h14" stroke="${A}" stroke-width="3"/>`,'fork'), JoinNode:()=>svg(`<path d="M3 10h14" stroke="${A}" stroke-width="3"/>`,'join'), ObjectNode:()=>svg(`<rect x="3" y="6" width="14" height="8" fill="none" stroke="${A}" stroke-width="1.25"/>`,'object node'),
 StateMachine:()=>svg(`<rect x="3" y="4" width="14" height="12" rx="3" fill="none" stroke="${A}" stroke-width="1.3"/><circle cx="7" cy="10" r="2" fill="${A}"/><path d="M9 10h4m-2-2 2 2-2 2" fill="none" stroke="${A}"/>`,'state machine'), State:()=>svg(`<rect x="3" y="5" width="14" height="10" rx="4" fill="none" stroke="${A}" stroke-width="1.35"/>`,'state'), CompositeState:()=>svg(`<rect x="3" y="4" width="14" height="12" rx="4" fill="none" stroke="${A}" stroke-width="1.25"/><path d="M4 9h12" stroke="${A}"/>`,'composite state'), FinalState:()=>circle(`<circle cx="10" cy="10" r="3.6" fill="${A}"/>`), InitialPseudostate:()=>svg(`<circle cx="10" cy="10" r="5" fill="${A}"/>`,'initial pseudostate'),
 Interaction:()=>svg(`<rect x="3" y="3" width="14" height="14" fill="none" stroke="${A}" stroke-width="1.25"/><path d="M6 6v8M10 6v8M14 6v8" stroke="${A}" stroke-dasharray="1.5 1.5"/>`,'interaction'), Lifeline:()=>svg(`<rect x="5" y="3" width="10" height="4" fill="none" stroke="${A}"/><path d="M10 7v10" stroke="${A}" stroke-dasharray="2 1.5"/>`,'lifeline'), CombinedFragment:()=>svg(`<rect x="2.5" y="3" width="15" height="14" fill="none" stroke="${A}"/><path d="M2.5 7h6l2-4" fill="none" stroke="${A}"/>`,'combined fragment'),
 InstanceSpecification:()=>classifier(`<path d="M6 12h8" stroke="${A}" stroke-width="1"/><path d="M6 13.5h8" stroke="${A}" stroke-width="1"/>`), Slot:()=>property('none'), Configuration:()=>classifier(`<path d="M6 10h8M6 12.5h8M6 15h5" stroke="${A}"/>`), Variant:()=>classifier(`<path d="M6 12h8" stroke="${A}"/><circle cx="10" cy="12" r="2" fill="none" stroke="${A}"/>`), VariationPoint:()=>property('none'),
 Comment:()=>svg(`<path d="M3 3h10l4 4v10H3z" fill="none" stroke="${A}" stroke-width="1.2"/><path d="M13 3v4h4" fill="none" stroke="${A}"/>`,'comment'),
 Diagram:()=>svg(`<path d="M3 3h14v14H3z" fill="none" stroke="${A}" stroke-width="1.2"/><path d="M6 13 9 9l2 2 3-4" fill="none" stroke="${A}"/>`,'diagram')
};
const aliases={
 'Block Definition Diagram':'Diagram','Internal Block Diagram':'Diagram','Requirement Diagram':'Diagram','Use Case Diagram':'Diagram','Activity Diagram':'Diagram','State Machine Diagram':'Diagram','Sequence Diagram':'Diagram','Parametric Diagram':'Diagram','Package Diagram':'Diagram','Instance Diagram':'Diagram',
 CallOperationAction:'Action',SendSignalAction:'Signal',AcceptEventAction:'Action',InputPin:'Parameter',OutputPin:'Parameter',ActivityParameterNode:'Parameter',CentralBufferNode:'ObjectNode',DataStoreNode:'ObjectNode',StructuredActivityNode:'Activity',ExpansionRegion:'Activity',InterruptibleActivityRegion:'Activity',ActivityPartition:'Package',ChoicePseudostate:'DecisionNode',JunctionPseudostate:'DecisionNode',ShallowHistory:'State',DeepHistory:'State',EntryPoint:'InitialPseudostate',ExitPoint:'FinalState',StateFork:'ForkNode',StateJoin:'JoinNode',SubmachineState:'State',Region:'Package',ExecutionSpecification:'Lifeline',InteractionOperand:'CombinedFragment',Gate:'Parameter',InteractionUse:'Interaction',TimeConstraint:'ConstraintProperty',DurationConstraint:'ConstraintProperty',TagDefinition:'ValueProperty'
};
export function sysmlIcon(kind){const key=aliases[kind]||kind;const maker=ICONS[key]||(()=>classifier(`<text x="10" y="14" text-anchor="middle" font-size="7" font-family="sans-serif" fill="${A}">${String(kind||'Element').slice(0,2)}</text>`));return maker()}

const RELATIONSHIP_ICONS={
 Association:()=>svg(`<path d="M2 10h16" stroke="${A}" stroke-width="1.4"/>`,'association'),
 Connector:()=>svg(`<path d="M2 10h16" stroke="${A}" stroke-width="1.6"/><rect x="1.5" y="8" width="4" height="4" fill="white" stroke="${A}"/><rect x="14.5" y="8" width="4" height="4" fill="white" stroke="${A}"/>`,'connector'),
 BindingConnector:()=>svg(`<path d="M2 10h16" stroke="${A}" stroke-width="1.6"/><circle cx="3" cy="10" r="2" fill="white" stroke="${A}"/><circle cx="17" cy="10" r="2" fill="white" stroke="${A}"/>`,'binding connector'),
 Generalization:()=>svg(`<path d="M2 10h11" stroke="${A}"/><path d="m18 10-6-4v8z" fill="white" stroke="${A}"/>`,'generalization'),
 Composition:()=>svg(`<path d="M7 10h11" stroke="${A}"/><path d="m2 10 4-3 4 3-4 3z" fill="${A}" stroke="${A}"/>`,'composition'),
 Aggregation:()=>svg(`<path d="M7 10h11" stroke="${A}"/><path d="m2 10 4-3 4 3-4 3z" fill="white" stroke="${A}"/>`,'aggregation'),
 Dependency:()=>svg(`<path d="M2 10h13" stroke="${A}" stroke-dasharray="3 2"/><path d="m14 6 4 4-4 4" fill="none" stroke="${A}"/>`,'dependency'),
 ControlFlow:()=>svg(`<path d="M2 10h13" stroke="${A}"/><path d="m14 6 4 4-4 4" fill="none" stroke="${A}"/>`,'control flow'),
 ObjectFlow:()=>svg(`<path d="M2 10h13" stroke="${A}"/><path d="m14 6 4 4-4 4" fill="none" stroke="${A}"/>`,'object flow')
};
for(const kind of ['AssociationBlock','DelegationConnector','ItemFlow'])RELATIONSHIP_ICONS[kind]=RELATIONSHIP_ICONS.Connector;
for(const kind of ['Usage','Abstraction','Redefines','Subsets','Requires','Satisfy','Verify','Refine','DeriveReqt','Trace','Copy','Allocate','Include','Extend','VariantBinding'])RELATIONSHIP_ICONS[kind]=RELATIONSHIP_ICONS.Dependency;
for(const kind of ['Realization','InterfaceRealization','Provides'])RELATIONSHIP_ICONS[kind]=()=>svg(`<path d="M2 10h11" stroke="${A}" stroke-dasharray="3 2"/><path d="m18 10-6-4v8z" fill="white" stroke="${A}"/>`,'realization');
RELATIONSHIP_ICONS.InformationFlow=RELATIONSHIP_ICONS.ControlFlow;
for(const kind of ['InterruptingEdge','Transition','Message'])RELATIONSHIP_ICONS[kind]=RELATIONSHIP_ICONS.ControlFlow;
export function hasSysmlIcon(kind){return Boolean(ICONS[aliases[kind]||kind]||RELATIONSHIP_ICONS[kind])}
export function sysmlPaletteIcon(kind){return RELATIONSHIP_ICONS[kind]?.()||sysmlIcon(kind)}

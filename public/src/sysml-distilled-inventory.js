/* SysML Distilled Appendix A inventory, normalized to this SysML 1.6 profile.
   This is an interoperability contract, not copied book artwork. */
export const SYSML_DISTILLED_PROFILE=Object.freeze({referenceVersion:'1.2/1.3',targetVersion:'1.6',legacyPolicy:'import-display-alias'});

const direct=(elements,relationships=[])=>Object.freeze({elements:Object.freeze(elements),relationships:Object.freeze(relationships)});
export const SYSML_DISTILLED_DIAGRAM_INVENTORY=Object.freeze({
 'Block Definition Diagram':direct(['Block','Actor','ConstraintBlock','InterfaceBlock','Signal','ProxyPort','FullPort','Comment','ValueType','Enumeration'],['Association','Composition','Generalization','Dependency']),
 'Internal Block Diagram':direct(['PartProperty','ReferenceProperty'],['Connector','ItemFlow']),
 'Use Case Diagram':direct(['UseCase','Actor','Block'],['Association','Generalization','Include','Extend']),
 'Activity Diagram':direct(['Action','ObjectNode','InputPin','OutputPin','ActivityParameterNode','CallBehaviorAction','SendSignalAction','AcceptEventAction','AcceptTimeEventAction','InitialNode','ActivityFinalNode','FlowFinalNode','DecisionNode','MergeNode','ForkNode','JoinNode','ActivityPartition'],['ObjectFlow','ControlFlow']),
 'Sequence Diagram':direct(['Lifeline','CombinedFragment','InteractionUse'],['Message']),
 'State Machine Diagram':direct(['State','CompositeState','FinalState','InitialPseudostate','JunctionPseudostate'],['Transition']),
 'Parametric Diagram':direct(['ConstraintProperty','Parameter','ValueProperty'],['BindingConnector']),
 'Package Diagram':direct(['Package','Model','ModelLibrary','Profile','View','Viewpoint'],['NamespaceContainment','Dependency','PackageImport','Conform','ProfileApplication']),
 'Requirement Diagram':direct(['Requirement','Comment'],['NamespaceContainment','Trace','DeriveReqt','Refine','Satisfy','Verify'])
});

export const CONTEXTUAL_NOTATION=Object.freeze({
 'Block Definition Diagram':Object.freeze(['ProxyPort','FullPort']),
 'Sequence Diagram':Object.freeze(['ExecutionSpecification','DestructionOccurrence','TimeConstraint','DurationConstraint','StateInvariant']),
 'State Machine Diagram':Object.freeze(['InternalTransition']),
 'Parametric Diagram':Object.freeze(['Parameter'])
});

export const PRESENTATION_VARIANTS=Object.freeze({
 Requirement:['direct','callout','compartment','matrix','table'],
 Allocate:['direct','callout','compartment','matrix','table','activity-partition'],
 InternalTransition:['state-compartment'],
 SystemBoundary:['use-case-subject'],
 ProvidedRequiredInterface:['port-ball-socket'],
 ConstraintParameter:['constraint-property-boundary']
 ,Rationale:['comment-stereotype']
});

export const LEGACY_COMPATIBILITY=Object.freeze({
 FlowSpecification:{status:'legacy',target:'InterfaceBlock'},
 StandardPort:{status:'legacy',target:'FullPort'},
 AtomicFlowPort:{status:'deprecated',target:'ProxyPort'},
 NonatomicFlowPort:{status:'deprecated',target:'ProxyPort'}
});

export function distilledInventoryIssues(diagrams,elements,relationships){const issues=[];for(const[type,inventory]of Object.entries(SYSML_DISTILLED_DIAGRAM_INVENTORY)){const diagram=diagrams[type];if(!diagram){issues.push(`${type}: missing diagram kind`);continue}for(const kind of inventory.elements){if(!elements[kind])issues.push(`${type}: missing semantic element ${kind}`);if(!diagram.elements.includes(kind))issues.push(`${type}: missing palette element ${kind}`)}for(const kind of inventory.relationships){if(!relationships[kind])issues.push(`${type}: missing semantic relationship ${kind}`);if(!diagram.relationships.includes(kind))issues.push(`${type}: missing palette relationship ${kind}`)}}return issues}

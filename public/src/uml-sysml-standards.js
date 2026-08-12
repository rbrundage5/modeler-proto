import {ELEMENTS,RELATIONSHIPS,DIAGRAMS} from './sysml-profile.js';

export const UML_BASELINE='UML 2.5.1';
export const SYSML_BASELINE='SysML 1.6';

const C=Object.freeze({
 Association:{line:'solid',sourceMarker:'none',targetMarker:'none',direction:'undirected'},
 AssociationBlock:{line:'solid',sourceMarker:'none',targetMarker:'none',direction:'undirected'},
 Aggregation:{line:'solid',sourceMarker:'diamond',targetMarker:'none',direction:'aggregate-to-part'},
 Composition:{line:'solid',sourceMarker:'diamondFilled',targetMarker:'none',direction:'composite-to-part'},
 Generalization:{line:'solid',sourceMarker:'none',targetMarker:'triangle',direction:'specific-to-general'},
 Dependency:{line:'dashed',sourceMarker:'none',targetMarker:'open',direction:'client-to-supplier'},
 Usage:{line:'dashed',sourceMarker:'none',targetMarker:'open',direction:'client-to-supplier'},
 Abstraction:{line:'dashed',sourceMarker:'none',targetMarker:'open',direction:'client-to-supplier'},
 Realization:{line:'dashed',sourceMarker:'none',targetMarker:'triangle',direction:'client-to-supplier'},
 InterfaceRealization:{line:'dashed',sourceMarker:'none',targetMarker:'triangle',direction:'implementing-classifier-to-interface'},
 InformationFlow:{line:'dashed',sourceMarker:'none',targetMarker:'open',direction:'information-source-to-target'},
 Connector:{line:'solid',sourceMarker:'none',targetMarker:'none',direction:'undirected'},
 DelegationConnector:{line:'solid',sourceMarker:'none',targetMarker:'none',direction:'undirected'},
 ItemFlow:{line:'solid',sourceMarker:'none',targetMarker:'open',direction:'flow-source-to-target'},
 BindingConnector:{line:'solid',sourceMarker:'none',targetMarker:'none',direction:'undirected'},
 Redefines:{line:'dashed',sourceMarker:'none',targetMarker:'open',direction:'redefining-to-redefined'},
 Subsets:{line:'dashed',sourceMarker:'none',targetMarker:'open',direction:'subset-to-superset'},
 Provides:{line:'dashed',sourceMarker:'none',targetMarker:'triangle',direction:'provider-to-interface'},
 Requires:{line:'dashed',sourceMarker:'none',targetMarker:'open',direction:'requiring-to-interface'},
 Satisfy:{line:'dashed',sourceMarker:'none',targetMarker:'open',direction:'satisfying-element-to-requirement'},
 Verify:{line:'dashed',sourceMarker:'none',targetMarker:'open',direction:'testcase-to-requirement'},
 Refine:{line:'dashed',sourceMarker:'none',targetMarker:'open',direction:'refining-element-to-requirement'},
 DeriveReqt:{line:'dashed',sourceMarker:'none',targetMarker:'open',direction:'derived-to-source-requirement'},
 Trace:{line:'dashed',sourceMarker:'none',targetMarker:'open',direction:'client-to-supplier'},
 Copy:{line:'dashed',sourceMarker:'none',targetMarker:'open',direction:'copy-to-master'},
 Allocate:{line:'dashed',sourceMarker:'none',targetMarker:'open',direction:'allocated-from-to-allocated-to'},
 Include:{line:'dashed',sourceMarker:'none',targetMarker:'open',direction:'including-to-included',stereotype:'include'},
 Extend:{line:'dashed',sourceMarker:'none',targetMarker:'open',direction:'extension-to-extended',stereotype:'extend'},
 ControlFlow:{line:'solid',sourceMarker:'none',targetMarker:'open',direction:'source-to-target'},
 ObjectFlow:{line:'solid',sourceMarker:'none',targetMarker:'open',direction:'source-to-target'},
 InterruptingEdge:{line:'solid',sourceMarker:'none',targetMarker:'open',direction:'source-to-target'},
 Transition:{line:'solid',sourceMarker:'none',targetMarker:'open',direction:'source-to-target'},
 Message:{line:'solid',sourceMarker:'none',targetMarker:'open',direction:'sender-to-receiver'},
 VariantBinding:{line:'dashed',sourceMarker:'none',targetMarker:'open',direction:'variation-point-to-variant'}
});

export const RELATIONSHIP_STANDARD_CONTRACT=Object.freeze(C);

export const ELEMENT_STANDARD_FAMILY=Object.freeze({
 Model:'package',Package:'package',Profile:'package',ModelLibrary:'package',Stereotype:'classifier',TagDefinition:'property',
 Block:'classifier',AssociationBlock:'classifier',InterfaceBlock:'classifier',ConstraintBlock:'classifier',ValueType:'classifier',DataType:'classifier',PrimitiveType:'classifier',Enumeration:'classifier',EnumerationLiteral:'literal',Signal:'classifier',Unit:'instance',QuantityKind:'instance',
 PartProperty:'property',ReferenceProperty:'property',ValueProperty:'property',FlowProperty:'property',ConstraintProperty:'property',ProxyPort:'port',FullPort:'port',AssociationEnd:'property',Operation:'operation',Parameter:'parameter',Reception:'operation',
 Requirement:'requirement',TestCase:'behavior',Actor:'actor',UseCase:'usecase',ExtensionPoint:'usecase-detail',Activity:'behavior',Action:'action',CallBehaviorAction:'action',CallOperationAction:'action',SendSignalAction:'action',AcceptEventAction:'action',InputPin:'pin',OutputPin:'pin',ActivityParameterNode:'object-node',ObjectNode:'object-node',CentralBufferNode:'object-node',DataStoreNode:'object-node',InitialNode:'initial-node',ActivityFinalNode:'activity-final',FlowFinalNode:'flow-final',DecisionNode:'decision-merge',MergeNode:'decision-merge',ForkNode:'fork-join',JoinNode:'fork-join',ActivityPartition:'partition',StructuredActivityNode:'region',ExpansionRegion:'region',InterruptibleActivityRegion:'region',
 StateMachine:'behavior',Region:'region',State:'state',CompositeState:'state',SubmachineState:'state',InitialPseudostate:'initial-node',ChoicePseudostate:'choice',JunctionPseudostate:'junction',ShallowHistory:'history',DeepHistory:'history',EntryPoint:'entry-exit',ExitPoint:'entry-exit',StateFork:'fork-join',StateJoin:'fork-join',FinalState:'final-state',Trigger:'behavior-detail',Event:'behavior-detail',
 Interaction:'behavior',Lifeline:'lifeline',ExecutionSpecification:'execution',CombinedFragment:'interaction-fragment',InteractionOperand:'interaction-operand',Gate:'gate',InteractionUse:'interaction-use',TimeConstraint:'constraint',DurationConstraint:'constraint',
 InstanceSpecification:'instance',Slot:'slot',Configuration:'instance',Variant:'classifier',VariationPoint:'property',SiteContext:'package',DefinitionRevision:'artifact',RequirementRevision:'artifact',Comment:'comment'
});

export function standardContract(kind){return C[kind]||{line:'solid',sourceMarker:'none',targetMarker:'none',direction:'unspecified'}}
export function relationshipStandardStyle(relationship){
  const base=standardContract(relationship?.kind);
  let sourceMarker=base.sourceMarker,targetMarker=base.targetMarker;
  if(['Association','AssociationBlock','Aggregation','Composition'].includes(relationship?.kind)){
    sourceMarker=relationship.sourceAggregation==='composite'?'diamondFilled':relationship.sourceAggregation==='shared'?'diamond':'none';
    targetMarker=relationship.targetAggregation==='composite'?'diamondFilled':relationship.targetAggregation==='shared'?'diamond':'none';
  }
  return{...base,sourceMarker,targetMarker,dashed:base.line==='dashed'};
}

export function normalizeStandardRelationship(r){
  if(!r||!RELATIONSHIPS[r.kind])return r;
  const contract=standardContract(r.kind);
  if(contract.stereotype&&!r.stereotype)r.stereotype=contract.stereotype;
  if(['Association','AssociationBlock','Aggregation','Composition'].includes(r.kind)){
    r.sourceAggregation=r.sourceAggregation||'none';r.targetAggregation=r.targetAggregation||'none';
    // Legacy builds created Composition/Aggregation with the aggregate diamond on target.
    // The normal modeling gesture is owner/source -> part/target, so migrate only that legacy signature.
    if(r.kind==='Composition'&&r.sourceAggregation==='none'&&r.targetAggregation==='composite'){r.sourceAggregation='composite';r.targetAggregation='none'}
    if(r.kind==='Aggregation'&&r.sourceAggregation==='none'&&r.targetAggregation==='shared'){r.sourceAggregation='shared';r.targetAggregation='none'}
    if(r.kind==='Composition'&&r.sourceAggregation==='none'&&r.targetAggregation==='none')r.sourceAggregation='composite';
    if(r.kind==='Aggregation'&&r.sourceAggregation==='none'&&r.targetAggregation==='none')r.sourceAggregation='shared';
  }
  return r;
}

export function normalizeStandardRelationships(project){for(const r of project.relationships||[])normalizeStandardRelationship(r);return project}

export function relationshipStandardIssues(r){const issues=[];if(!r||!RELATIONSHIPS[r.kind])return issues;if(['Association','AssociationBlock','Aggregation','Composition'].includes(r.kind)){const s=r.sourceAggregation||'none',t=r.targetAggregation||'none';if(!['none','shared','composite'].includes(s)||!['none','shared','composite'].includes(t))issues.push({severity:'error',code:'UML_AGGREGATION_KIND',message:`${r.kind} has an invalid UML aggregation value.`,id:r.id});if(s==='composite'&&t==='composite')issues.push({severity:'error',code:'UML_DOUBLE_COMPOSITE',message:'A binary UML Association cannot be composite at both ends.',id:r.id});if(r.kind==='Composition'&&s!=='composite'&&t!=='composite')issues.push({severity:'error',code:'UML_COMPOSITION_END',message:'Composition must have exactly one composite member end.',id:r.id});if(r.kind==='Aggregation'&&s!=='shared'&&t!=='shared')issues.push({severity:'error',code:'UML_SHARED_AGGREGATION_END',message:'Shared Aggregation must have a shared aggregate member end.',id:r.id})}return issues}

export function standardsCoverageIssues(){const issues=[];for(const kind of Object.keys(RELATIONSHIPS))if(!C[kind])issues.push(`Missing relationship standards contract: ${kind}`);for(const kind of Object.keys(ELEMENTS))if(!ELEMENT_STANDARD_FAMILY[kind])issues.push(`Missing element standards family: ${kind}`);for(const [diagramType,def] of Object.entries(DIAGRAMS)){for(const kind of def.elements||[])if(!ELEMENTS[kind])issues.push(`${diagramType} allows undeclared element ${kind}`);for(const kind of def.relationships||[])if(!RELATIONSHIPS[kind])issues.push(`${diagramType} allows undeclared relationship ${kind}`)}return issues}

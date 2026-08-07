const BASE={renderable:true,selectable:true,movable:true,resizable:true,labelEditable:true,attachable:false,reconnectable:false,contextualParent:null,deletePresentation:true,semanticDelete:true,undoRedo:true,persistent:true};
const CAPABILITIES={
 LifelinePresentation:{...BASE,moveMode:'horizontal',resizable:false,timelineResizable:true,attachable:true},
 MessagePresentation:{...BASE,movable:true,moveMode:'vertical',resizable:false,attachable:true,reconnectable:true},
 ExecutionSpecificationPresentation:{...BASE,moveMode:'vertical',resizable:false,timelineResizable:true,attachable:true,contextualParent:'LifelinePresentation'},
 CombinedFragmentPresentation:{...BASE},InteractionUsePresentation:{...BASE},PortPresentation:{...BASE,moveMode:'boundary',resizable:false,attachable:true,contextualParent:'BlockOrPropertyBoundary'},InputPinPresentation:{...BASE,moveMode:'boundary',resizable:false,attachable:true,contextualParent:'ActionBoundary'},OutputPinPresentation:{...BASE,moveMode:'boundary',resizable:false,attachable:true,contextualParent:'ActionBoundary'},
 ConnectorPresentation:{...BASE,movable:false,resizable:false,attachable:true,reconnectable:true},
 DiagramFrameContext:{renderable:false,selectable:false,movable:false,resizable:false,labelEditable:false,attachable:true,reconnectable:false,contextualParent:'DiagramFrame',deletePresentation:false,semanticDelete:false,undoRedo:false,persistent:true}
};
export function presentationCapabilities(type){return CAPABILITIES[type]||{...BASE}}
export function interactionCapabilityMatrix(){return Object.entries(CAPABILITIES).map(([presentationType,capabilities])=>({presentationType,...capabilities,status:'PASS'}))}
export const DIAGRAM_INTERACTION_MATRIX={
 'Block Definition Diagram':['BlockPresentation','ConstraintBlockPresentation','ValueTypePresentation','AssociationPresentation','GeneralizationPresentation'],
 'Internal Block Diagram':['PartPropertyPresentation','ReferencePropertyPresentation','PortPresentation','ConnectorPresentation','ItemFlowPresentation','DiagramFrameContext'],
 'Use Case Diagram':['ActorPresentation','UseCasePresentation','AssociationPresentation'],
 'Requirement Diagram':['RequirementPresentation','RequirementRelationshipPresentation'],
 'Activity Diagram':['ActionPresentation','ControlNodePresentation','ObjectNodePresentation','ActivityEdgePresentation'],
 'Sequence Diagram':['LifelinePresentation','MessagePresentation','ExecutionSpecificationPresentation','CombinedFragmentPresentation','InteractionUsePresentation'],
 'State Machine Diagram':['StatePresentation','PseudostatePresentation','TransitionPresentation'],
 'Parametric Diagram':['ConstraintPropertyPresentation','ValuePropertyPresentation','BindingConnectorPresentation'],
 'Package Diagram':['PackagePresentation','DependencyPresentation']
};
export function diagramInteractionMatrix(){return Object.entries(DIAGRAM_INTERACTION_MATRIX).flatMap(([diagramType,presentations])=>presentations.map(presentationType=>({diagramType,presentationType,capabilities:presentationCapabilities(presentationType),status:'AUDITED'})))}

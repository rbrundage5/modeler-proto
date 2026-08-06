import {createProject,defaultElement,defaultRelationship,uid} from '../model.js';
import {DIAGRAMS,ELEMENTS,RELATIONSHIPS,endpointAllowed} from '../sysml-profile.js';
import {notationFor} from './registry.js';

const contextKind={"Internal Block Diagram":'Block',"Activity Diagram":'Activity',"State Machine Diagram":'StateMachine',"Sequence Diagram":'Interaction',"Parametric Diagram":'Block'};
export function createNotationGallery(){
 const project=createProject('SysML v1 Notation Gallery');project.metadata.readOnlyExample=true;project.metadata.projectTemplate='sysml-v1-notation-gallery';
 for(const [diagramType,definition] of Object.entries(DIAGRAMS)){
  const owner=defaultElement('Package',project.root.id);owner.name=diagramType.replace(' Diagram','');project.elements.push(owner);
  let context=owner;const required=contextKind[diagramType];if(required){context=defaultElement(required,owner.id);context.name=`${owner.name} Context`;project.elements.push(context)}
  const diagram={id:uid('diagram'),externalId:uid('DGM').toUpperCase(),name:`${definition.abbreviation} notation gallery`,diagramType,ownerId:owner.id,contextId:context.id,documentation:'Deterministic SysML v1 notation review fixture.',frame:{visible:true,x:12,y:12,width:3160,height:2160},nodes:[],edges:[]};
  const displayed=[];definition.elements.forEach((kind,index)=>{const e=defaultElement(kind,context.id);e.name=kind;if(kind==='Requirement'){e.requirementId='REQ-001';e.requirementText='The system shall demonstrate readable requirement notation.'}project.elements.push(e);const notation=notationFor(kind,diagramType),column=index%5,row=Math.floor(index/5);diagram.nodes.push({id:uid('node'),elementId:e.id,x:80+column*320,y:90+row*230,width:notation?.defaultSize?.[0]||190,height:notation?.defaultSize?.[1]||110,rotation:0,notationShape:notation?.shape});displayed.push(e)});
  definition.relationships.forEach((kind,index)=>{const rule=RELATIONSHIPS[kind],source=displayed.find(e=>endpointAllowed(rule.source,e.kind)),target=[...displayed].reverse().find(e=>endpointAllowed(rule.target,e.kind)&&e.id!==source?.id);if(!source||!target)return;const r=defaultRelationship(kind,source.id,target.id,context.id);project.relationships.push(r);const sourceNode=diagram.nodes.find(n=>n.elementId===source.id),targetNode=diagram.nodes.find(n=>n.elementId===target.id);diagram.edges.push({id:uid('edge'),relationshipId:r.id,sourceId:source.id,targetId:target.id,sourceNodeId:sourceNode.id,targetNodeId:targetNode.id,points:[],labelPosition:{x:220+index*12,y:190+index*10}})});
  project.diagrams.push(diagram)
 }
 project.activeDiagramId=project.diagrams[0]?.id||null;return project
}

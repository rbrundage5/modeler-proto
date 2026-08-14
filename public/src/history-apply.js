import {indexedDiagram,indexedElement,indexedRelationship} from './model-index.js';
import {addElement,addRelationship,moveElement,removeElement,removeRelationship,updateElement,updateRelationship} from './project-mutation.js';
import {indexDiagramAdded,indexDiagramRemoved,indexPresentationAdded,indexPresentationRemoved} from './model-index-mutations.js';
import {markOperationDirty} from './operation-dirty.js';

const clone=value=>globalThis.structuredClone?structuredClone(value):JSON.parse(JSON.stringify(value));
const required=(value,message)=>{if(!value)throw new Error(message);return value};
const nodeFor=(project,diagramId,nodeId)=>indexedDiagram(project,diagramId)?.nodes?.find(node=>node.id===nodeId)||null;
const edgeFor=(project,diagramId,edgeId)=>indexedDiagram(project,diagramId)?.edges?.find(edge=>edge.id===edgeId)||null;

export function applyHistoryOperation(project,operation){
  switch(operation.type){
    case'batch-operation':for(const child of operation.operations||[])applyHistoryOperation(project,child);break;
    case'set-property':{
      const targetType=operation.targetType||'element';
      if(targetType==='element'){const target=required(indexedElement(project,operation.targetId),'Element not found');updateElement(project,target,{[operation.property]:clone(operation.value)})}
      else if(targetType==='relationship'){const target=required(indexedRelationship(project,operation.targetId),'Relationship not found');updateRelationship(project,target,{[operation.property]:clone(operation.value)})}
      else{const diagram=required(indexedDiagram(project,operation.targetId),'Diagram not found');diagram[operation.property]=clone(operation.value);markOperationDirty(project,operation)}
      break;
    }
    case'move-element':{const element=required(indexedElement(project,operation.elementId),'Element not found');moveElement(project,element,operation.targetOwnerId);break}
    case'create-element':addElement(project,clone(operation.element));if(operation.node){const diagram=required(indexedDiagram(project,operation.diagramId),'Diagram not found'),node=clone(operation.node);diagram.nodes??=[];diagram.nodes.push(node);indexPresentationAdded(project,diagram,node)}break;
    case'delete-element':{const element=required(indexedElement(project,operation.elementId),'Element not found');for(const child of [...(project.elements||[])].filter(item=>item.ownerId===element.id))applyHistoryOperation(project,{type:'delete-element',elementId:child.id});for(const relationship of [...(project.relationships||[])].filter(item=>item.sourceId===element.id||item.targetId===element.id))removeRelationship(project,relationship);for(const diagram of project.diagrams||[])for(const node of [...(diagram.nodes||[])].filter(item=>item.elementId===element.id)){diagram.nodes.splice(diagram.nodes.indexOf(node),1);indexPresentationRemoved(project,diagram,node);diagram.edges=(diagram.edges||[]).filter(edge=>edge.sourceNodeId!==node.id&&edge.targetNodeId!==node.id)}removeElement(project,element);break}
    case'restore-element-subtree':{
      const snapshot=operation.snapshot||{};
      for(const element of snapshot.elements||[])if(!indexedElement(project,element.id))addElement(project,clone(element));
      for(const relationship of snapshot.relationships||[])if(!indexedRelationship(project,relationship.id))addRelationship(project,clone(relationship));
      for(const item of snapshot.diagrams||[]){const diagram=indexedDiagram(project,item.diagramId);if(!diagram)continue;diagram.nodes??=[];diagram.edges??=[];for(const raw of item.nodes||[]){if(diagram.nodes.some(node=>node.id===raw.id))continue;const node=clone(raw);diagram.nodes.push(node);indexPresentationAdded(project,diagram,node)}for(const raw of item.edges||[])if(!diagram.edges.some(edge=>edge.id===raw.id))diagram.edges.push(clone(raw));markOperationDirty(project,{diagramId:diagram.id})}
      break;
    }
    case'create-relationship':{const relationship=addRelationship(project,clone(operation.relationship));if(operation.edge){const diagram=required(indexedDiagram(project,operation.diagramId),'Diagram not found');diagram.edges??=[];diagram.edges.push(clone(operation.edge));markOperationDirty(project,{diagramId:diagram.id,relationshipId:relationship.id})}break}
    case'delete-relationship':{const relationship=required(indexedRelationship(project,operation.relationshipId),'Relationship not found');for(const diagram of project.diagrams||[])diagram.edges=(diagram.edges||[]).filter(edge=>edge.relationshipId!==relationship.id);removeRelationship(project,relationship);break}
    case'restore-relationship':{if(!indexedRelationship(project,operation.relationship.id))addRelationship(project,clone(operation.relationship));for(const item of operation.presentations||[]){const diagram=indexedDiagram(project,item.diagramId);if(diagram&&!diagram.edges?.some(edge=>edge.id===item.edge.id)){diagram.edges??=[];diagram.edges.push(clone(item.edge));markOperationDirty(project,{diagramId:diagram.id,relationshipId:operation.relationship.id})}}break}
    case'create-diagram':{const diagram=clone(operation.diagram);project.diagrams??=[];project.diagrams.push(diagram);indexDiagramAdded(project,diagram);markOperationDirty(project,{diagramId:diagram.id});break}
    case'delete-diagram':{const diagram=required(indexedDiagram(project,operation.diagramId),'Diagram not found');project.diagrams.splice(project.diagrams.indexOf(diagram),1);indexDiagramRemoved(project,diagram);if(project.activeDiagramId===diagram.id)project.activeDiagramId=project.diagrams[0]?.id||null;break}
    case'add-presentation':{const diagram=required(indexedDiagram(project,operation.diagramId),'Diagram not found'),node=clone(operation.node);diagram.nodes??=[];diagram.nodes.push(node);indexPresentationAdded(project,diagram,node);markOperationDirty(project,{diagramId:diagram.id,elementId:node.elementId});break}
    case'remove-presentation':{const diagram=required(indexedDiagram(project,operation.diagramId),'Diagram not found'),node=required(nodeFor(project,operation.diagramId,operation.nodeId),'Presentation not found');diagram.nodes.splice(diagram.nodes.indexOf(node),1);indexPresentationRemoved(project,diagram,node);diagram.edges=(diagram.edges||[]).filter(edge=>edge.sourceNodeId!==node.id&&edge.targetNodeId!==node.id);markOperationDirty(project,{diagramId:diagram.id,elementId:node.elementId});break}
    case'restore-presentation':{const diagram=required(indexedDiagram(project,operation.diagramId),'Diagram not found');if(!diagram.nodes?.some(node=>node.id===operation.node.id)){diagram.nodes??=[];const node=clone(operation.node);diagram.nodes.push(node);indexPresentationAdded(project,diagram,node)}for(const raw of operation.edges||[]){diagram.edges??=[];if(!diagram.edges.some(edge=>edge.id===raw.id))diagram.edges.push(clone(raw))}markOperationDirty(project,{diagramId:diagram.id,elementId:operation.node.elementId});break}
    case'create-relationship-presentation':{const diagram=required(indexedDiagram(project,operation.diagramId),'Diagram not found');diagram.edges??=[];diagram.edges.push(clone(operation.edge));markOperationDirty(project,{diagramId:diagram.id,relationshipId:operation.relationshipId});break}
    case'remove-edge-presentation':{const diagram=required(indexedDiagram(project,operation.diagramId),'Diagram not found');diagram.edges=(diagram.edges||[]).filter(edge=>edge.id!==operation.edgeId);markOperationDirty(project,{diagramId:diagram.id});break}
    case'move-node':{const node=required(nodeFor(project,operation.diagramId,operation.nodeId),'Presentation not found');node.x=operation.x;node.y=operation.y;markOperationDirty(project,operation);break}
    case'resize-node':{const node=required(nodeFor(project,operation.diagramId,operation.nodeId),'Presentation not found');node.width=operation.width;node.height=operation.height;markOperationDirty(project,operation);break}
    case'move-message-occurrence':{const edge=required(edgeFor(project,operation.diagramId,operation.edgeId),'Edge not found');edge.occurrenceY=operation.occurrenceY;markOperationDirty(project,operation);break}
    case'move-open-message-anchor':{const edge=required(edgeFor(project,operation.diagramId,operation.edgeId),'Edge not found');edge[operation.anchorKey]=clone(operation.anchor);markOperationDirty(project,operation);break}
    case'resize-execution-specification':{const node=required(nodeFor(project,operation.diagramId,operation.nodeId),'Presentation not found');node.height=operation.height;markOperationDirty(project,operation);break}
    case'resize-lifeline-timeline':{const node=required(nodeFor(project,operation.diagramId,operation.nodeId),'Presentation not found');node.timelineEndY=operation.timelineEndY;markOperationDirty(project,operation);break}
    case'set-edge-points':{const edge=required(edgeFor(project,operation.diagramId,operation.edgeId),'Edge not found');edge.points=clone(operation.points);markOperationDirty(project,operation);break}
    case'move-edge-label':{const edge=required(edgeFor(project,operation.diagramId,operation.edgeId),'Edge not found');edge.labelX=operation.labelX;edge.labelY=operation.labelY;markOperationDirty(project,operation);break}
    case'set-relationship-endpoint':{const relationship=required(indexedRelationship(project,operation.relationshipId),'Relationship not found');updateRelationship(project,relationship,{[`${operation.end}Id`]:operation.value});break}
    default:throw new Error(`Operation is not supported by compact history: ${operation.type}`);
  }
  return project;
}

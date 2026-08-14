import {deepClone,findDiagram,findNode,findTarget,currentValue} from './operations.js';

const clone=value=>deepClone(value);
const edgeFor=(project,diagramId,edgeId)=>findDiagram(project,diagramId)?.edges?.find(edge=>edge.id===edgeId)||null;

export function inverseOperation(project,operation){
  switch(operation.type){
    case'set-property':return{...operation,value:clone(currentValue(project,operation)),expectedValue:clone(operation.value)};
    case'move-node':{const before=currentValue(project,operation);return{...operation,x:before?.x,y:before?.y,expectedValue:{x:operation.x,y:operation.y}}}
    case'resize-node':{const before=currentValue(project,operation);return{...operation,width:before?.width,height:before?.height,expectedValue:{width:operation.width,height:operation.height}}}
    case'move-message-occurrence':return{...operation,occurrenceY:currentValue(project,operation),expectedValue:operation.occurrenceY};
    case'move-open-message-anchor':return{...operation,anchor:clone(currentValue(project,operation)),expectedValue:clone(operation.anchor)};
    case'resize-execution-specification':return{...operation,height:currentValue(project,operation),expectedValue:operation.height};
    case'resize-lifeline-timeline':return{...operation,timelineEndY:currentValue(project,operation),expectedValue:operation.timelineEndY};
    case'set-edge-points':return{...operation,points:clone(currentValue(project,operation)),expectedValue:clone(operation.points)};
    case'move-edge-label':{const before=currentValue(project,operation)||{};return{...operation,labelX:before.labelX,labelY:before.labelY,expectedValue:{labelX:operation.labelX??null,labelY:operation.labelY??null}}}
    case'set-relationship-endpoint':return{...operation,value:currentValue(project,operation),expectedValue:operation.value};
    case'set-compartment':return{...operation,value:clone(currentValue(project,operation)),expectedValue:clone(operation.value)};
    case'set-compartment-visibility':return{...operation,value:currentValue(project,operation),expectedValue:operation.value};
    case'set-presentation-compartment-visibility':return{...operation,value:currentValue(project,operation),expectedValue:operation.value};
    case'set-property-path':return{...operation,path:clone(currentValue(project,operation)),expectedValue:clone(operation.path)};
    case'set-port-placement':return{...operation,...clone(currentValue(project,operation)),expectedValue:{boundaryOwnerNodeId:operation.boundaryOwnerNodeId,portSide:operation.portSide,perimeterOffset:operation.perimeterOffset}};
    case'nest-presentation':return{...operation,...clone(currentValue(project,operation)),expectedValue:{parentPresentationId:operation.parentPresentationId,relativeX:operation.relativeX,relativeY:operation.relativeY,propertyPath:clone(operation.propertyPath)}};
    case'set-connector-kind':{const before=currentValue(project,operation)||{};return{...operation,kind:before.kind,connectorKind:before.connectorKind,expectedValue:{kind:operation.kind,connectorKind:operation.connectorKind}}}
    case'set-diagram-context':return{...operation,contextId:currentValue(project,operation),expectedValue:operation.contextId};
    case'move-element':return{...operation,targetOwnerId:currentValue(project,operation),expectedOwnerId:operation.targetOwnerId};
    case'create-element':return{type:'delete-element',elementId:operation.element.id};
    case'create-relationship':return{type:'delete-relationship',relationshipId:operation.relationship.id};
    case'create-diagram':return{type:'delete-diagram',diagramId:operation.diagram.id};
    case'add-presentation':return{type:'remove-presentation',diagramId:operation.diagramId,nodeId:operation.node.id};
    case'create-relationship-presentation':return{type:'remove-edge-presentation',diagramId:operation.diagramId,edgeId:operation.edge.id};
    case'remove-presentation':{const node=findNode(project,operation.diagramId,operation.nodeId);return node?{type:'add-presentation',diagramId:operation.diagramId,node:clone(node)}:null}
    case'remove-edge-presentation':{const edge=edgeFor(project,operation.diagramId,operation.edgeId);return edge?{type:'add-edge-presentation',diagramId:operation.diagramId,edge:clone(edge)}:null}
    case'batch-operation':{const inverses=[];for(const item of operation.operations||[]){const inverse=inverseOperation(project,item);if(!inverse)return null;inverses.unshift(inverse)}return{type:'batch-operation',operations:inverses}}
    default:return null;
  }
}

export function operationFootprint(operation){try{return JSON.stringify(operation).length}catch{return Number.POSITIVE_INFINITY}}
export function reversibleOperation(project,operation){const inverse=inverseOperation(project,operation);return inverse?{operation:clone(operation),inverse,bytes:operationFootprint(operation)+operationFootprint(inverse)}:null}

import {indexedChildren,indexedDiagram,indexedElement,indexedRelationship} from './model-index.js';

const clone=value=>globalThis.structuredClone?structuredClone(value):JSON.parse(JSON.stringify(value));
const edgeFor=(project,diagramId,edgeId)=>indexedDiagram(project,diagramId)?.edges?.find(edge=>edge.id===edgeId)||null;
const nodeFor=(project,diagramId,nodeId)=>indexedDiagram(project,diagramId)?.nodes?.find(node=>node.id===nodeId)||null;

function currentValue(project,operation){
  if(operation.type==='set-property'){
    const type=operation.targetType||'element',target=type==='relationship'?indexedRelationship(project,operation.targetId):type==='diagram'?indexedDiagram(project,operation.targetId):indexedElement(project,operation.targetId);return target?.[operation.property]
  }
  if(operation.type==='move-node'){const node=nodeFor(project,operation.diagramId,operation.nodeId);return node&&{x:node.x,y:node.y}}
  if(operation.type==='resize-node'){const node=nodeFor(project,operation.diagramId,operation.nodeId);return node&&{width:node.width,height:node.height}}
  if(operation.type==='resize-lifeline-timeline')return nodeFor(project,operation.diagramId,operation.nodeId)?.timelineEndY;
  if(operation.type==='move-open-message-anchor')return edgeFor(project,operation.diagramId,operation.edgeId)?.[operation.anchorKey];
  if(operation.type==='move-message-occurrence')return edgeFor(project,operation.diagramId,operation.edgeId)?.occurrenceY;
  if(operation.type==='resize-execution-specification')return nodeFor(project,operation.diagramId,operation.nodeId)?.height;
  if(operation.type==='set-edge-points')return edgeFor(project,operation.diagramId,operation.edgeId)?.points;
  if(operation.type==='move-edge-label'){const edge=edgeFor(project,operation.diagramId,operation.edgeId);return edge&&{labelX:edge.labelX??null,labelY:edge.labelY??null}}
  if(operation.type==='set-relationship-endpoint')return indexedRelationship(project,operation.relationshipId)?.[`${operation.end}Id`];
  if(operation.type==='set-compartment')return indexedElement(project,operation.elementId)?.compartments?.[operation.name];
  if(operation.type==='set-compartment-visibility')return indexedElement(project,operation.elementId)?.compartmentVisibility?.[operation.name];
  if(operation.type==='set-presentation-compartment-visibility')return nodeFor(project,operation.diagramId,operation.nodeId)?.presentationOptions?.compartmentVisibility?.[operation.name];
  if(operation.type==='set-property-path')return indexedRelationship(project,operation.relationshipId)?.[`${operation.end}PropertyPath`];
  if(operation.type==='set-port-placement'){const node=nodeFor(project,operation.diagramId,operation.nodeId);return node&&{boundaryOwnerNodeId:node.boundaryOwnerNodeId,portSide:node.portSide,perimeterOffset:node.perimeterOffset}}
  if(operation.type==='nest-presentation'){const node=nodeFor(project,operation.diagramId,operation.nodeId);return node&&{parentPresentationId:node.parentPresentationId,relativeX:node.relativeX,relativeY:node.relativeY,propertyPath:node.propertyPath}}
  if(operation.type==='set-connector-kind'){const relationship=indexedRelationship(project,operation.relationshipId);return relationship&&{kind:relationship.kind,connectorKind:relationship.connectorKind}}
  if(operation.type==='set-diagram-context')return indexedDiagram(project,operation.diagramId)?.contextId;
  if(operation.type==='move-element')return indexedElement(project,operation.elementId)?.ownerId;
  return undefined;
}

function subtreeSnapshot(project,elementId){
  const ids=new Set(),elements=[],stack=[elementId];while(stack.length){const id=stack.pop();if(ids.has(String(id)))continue;const element=indexedElement(project,id);if(!element)continue;ids.add(String(id));elements.push(clone(element));for(const child of indexedChildren(project,id))stack.push(child.id)}
  const relationships=(project.relationships||[]).filter(r=>ids.has(String(r.sourceId))||ids.has(String(r.targetId))).map(clone);
  const diagrams=[];for(const diagram of project.diagrams||[]){const nodes=(diagram.nodes||[]).filter(n=>ids.has(String(n.elementId))).map(clone),nodeIds=new Set(nodes.map(n=>n.id)),relationshipIds=new Set(relationships.map(r=>r.id)),edges=(diagram.edges||[]).filter(e=>relationshipIds.has(e.relationshipId)||nodeIds.has(e.sourceNodeId)||nodeIds.has(e.targetNodeId)).map(clone);if(nodes.length||edges.length)diagrams.push({diagramId:diagram.id,nodes,edges})}
  return{elements,relationships,diagrams};
}

export function inverseOperation(project,operation){
  switch(operation.type){
    case'set-property':return{...operation,value:clone(currentValue(project,operation)),expectedValue:clone(operation.value)};
    case'move-node':{const before=currentValue(project,operation);return before?{...operation,x:before.x,y:before.y,expectedValue:{x:operation.x,y:operation.y}}:null}
    case'resize-node':{const before=currentValue(project,operation);return before?{...operation,width:before.width,height:before.height,expectedValue:{width:operation.width,height:operation.height}}:null}
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
    case'delete-element':return indexedElement(project,operation.elementId)?{type:'restore-element-subtree',snapshot:subtreeSnapshot(project,operation.elementId)}:null;
    case'create-relationship':return{type:'delete-relationship',relationshipId:operation.relationship.id};
    case'delete-relationship':{const relationship=indexedRelationship(project,operation.relationshipId);if(!relationship)return null;const presentations=[];for(const diagram of project.diagrams||[])for(const edge of diagram.edges||[])if(edge.relationshipId===relationship.id)presentations.push({diagramId:diagram.id,edge:clone(edge)});return{type:'restore-relationship',relationship:clone(relationship),presentations}}
    case'create-diagram':return{type:'delete-diagram',diagramId:operation.diagram.id};
    case'delete-diagram':{const diagram=indexedDiagram(project,operation.diagramId);return diagram?{type:'create-diagram',diagram:clone(diagram)}:null}
    case'add-presentation':return{type:'remove-presentation',diagramId:operation.diagramId,nodeId:operation.node.id};
    case'remove-presentation':{const node=nodeFor(project,operation.diagramId,operation.nodeId);if(!node)return null;const diagram=indexedDiagram(project,operation.diagramId),edges=(diagram.edges||[]).filter(e=>e.sourceNodeId===node.id||e.targetNodeId===node.id).map(clone);return{type:'restore-presentation',diagramId:operation.diagramId,node:clone(node),edges}}
    case'create-relationship-presentation':return{type:'remove-edge-presentation',diagramId:operation.diagramId,edgeId:operation.edge.id};
    case'remove-edge-presentation':{const edge=edgeFor(project,operation.diagramId,operation.edgeId);return edge?{type:'create-relationship-presentation',diagramId:operation.diagramId,relationshipId:edge.relationshipId,edge:clone(edge)}:null}
    case'batch-operation':{const inverses=[];for(const item of operation.operations||[]){const inverse=inverseOperation(project,item);if(!inverse)return null;inverses.unshift(inverse)}return{type:'batch-operation',operations:inverses}}
    default:return null;
  }
}

export function operationFootprint(operation){try{return JSON.stringify(operation).length}catch{return Number.POSITIVE_INFINITY}}
export function reversibleOperation(project,operation){const inverse=inverseOperation(project,operation);return inverse?{operation:clone(operation),inverse,bytes:operationFootprint(operation)+operationFootprint(inverse)}:null}

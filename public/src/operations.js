import {synchronizeSemanticModel} from './semantic-core.js';
import {assertIBDContext,attachPortPresentation,createItemFlow,normalizeIBDProject,removeItemFlow,updateItemFlow} from './ibd-engine.js';

export function deepClone(value){return globalThis.structuredClone?structuredClone(value):JSON.parse(JSON.stringify(value))}

export function findTarget(project,type,id){
  if(type==='relationship')return project.relationships?.find(item=>item.id===id)||null;
  if(type==='diagram')return project.diagrams?.find(item=>item.id===id)||null;
  if(project.root?.id===id)return project.root;
  return project.elements?.find(item=>item.id===id)||null;
}

export function findDiagram(project,id){return project.diagrams?.find(diagram=>diagram.id===id)||null}
export function findNode(project,diagramId,nodeId){return findDiagram(project,diagramId)?.nodes?.find(node=>node.id===nodeId)||null}
export function containsId(project,id){return project.root?.id===id||project.elements?.some(item=>item.id===id)||project.relationships?.some(item=>item.id===id)||project.diagrams?.some(item=>item.id===id)||project.diagrams?.some(diagram=>diagram.nodes?.some(item=>item.id===id)||diagram.edges?.some(item=>item.id===id))}

function required(value,message){if(!value)throw Error(message);return value}
function assertNewId(project,item,label){required(item,`${label} is required`);required(item.id,`${label} ID is required`);if(containsId(project,item.id))throw Error(`Duplicate ID: ${item.id}`)}

export function currentValue(project,operation){
  if(operation.type==='set-property')return findTarget(project,operation.targetType||'element',operation.targetId)?.[operation.property];
  if(operation.type==='move-node'){const node=findNode(project,operation.diagramId,operation.nodeId);return node&&{x:node.x,y:node.y}}
  if(operation.type==='resize-node'){const node=findNode(project,operation.diagramId,operation.nodeId);return node&&{width:node.width,height:node.height}}
  if(operation.type==='set-edge-points')return findDiagram(project,operation.diagramId)?.edges?.find(edge=>edge.id===operation.edgeId)?.points;
  if(operation.type==='set-compartment')return findTarget(project,'element',operation.elementId)?.compartments?.[operation.name];
  if(operation.type==='set-compartment-visibility')return findTarget(project,'element',operation.elementId)?.compartmentVisibility?.[operation.name];
  if(operation.type==='set-property-path')return findTarget(project,'relationship',operation.relationshipId)?.[`${operation.end}PropertyPath`];
  if(operation.type==='set-port-placement'){const node=findNode(project,operation.diagramId,operation.nodeId);return node&&{boundaryOwnerNodeId:node.boundaryOwnerNodeId,portSide:node.portSide,perimeterOffset:node.perimeterOffset}}
  if(operation.type==='nest-presentation'){const node=findNode(project,operation.diagramId,operation.nodeId);return node&&{parentPresentationId:node.parentPresentationId,relativeX:node.relativeX,relativeY:node.relativeY,propertyPath:node.propertyPath}}
  if(operation.type==='set-connector-kind'){const relationship=findTarget(project,'relationship',operation.relationshipId);return relationship&&{kind:relationship.kind,connectorKind:relationship.connectorKind}}
  if(operation.type==='set-diagram-context')return findDiagram(project,operation.diagramId)?.contextId;
  return undefined;
}

export function canRebaseOperation(project,operation){
  if(['create-element','create-relationship','create-diagram','add-presentation','bulk-import'].includes(operation.type)){
    const id=operation.element?.id||operation.relationship?.id||operation.diagram?.id||operation.node?.id;
    return operation.type==='bulk-import'||Boolean(id&&!containsId(project,id));
  }
  if(['set-property','move-node','resize-node','set-edge-points','set-compartment','set-compartment-visibility','set-property-path','set-port-placement','nest-presentation','set-connector-kind','set-diagram-context'].includes(operation.type))return JSON.stringify(currentValue(project,operation))===JSON.stringify(operation.expectedValue);
  if(['add-item-flow','update-item-flow','remove-item-flow'].includes(operation.type))return true;
  return ['delete-element','delete-relationship','delete-diagram','remove-presentation'].includes(operation.type);
}

function synchronizeProject(project){synchronizeSemanticModel(project);normalizeIBDProject(project);return project}
function replaceProject(operation){return synchronizeProject(deepClone(operation.project))}

export function applyOperation(project,operation){
  switch(operation.type){
    case'set-property':{
      const target=required(findTarget(project,operation.targetType||'element',operation.targetId),'Target not found');
      target[operation.property]=deepClone(operation.value);break;
    }
    case'create-element':{
      assertNewId(project,operation.element,'Element');
      if(operation.node){required(findDiagram(project,operation.diagramId),'Diagram not found');assertNewId(project,operation.node,'Presentation node')}
      project.elements.push(deepClone(operation.element));
      if(operation.node)findDiagram(project,operation.diagramId).nodes.push(deepClone(operation.node));
      break;
    }
    case'delete-element':{
      const ids=new Set([operation.elementId]);let changed=true;
      while(changed){changed=false;for(const element of project.elements)if(ids.has(element.ownerId)&&!ids.has(element.id)){ids.add(element.id);changed=true}}
      project.elements=project.elements.filter(element=>!ids.has(element.id));
      const affectedRelationships=new Set(project.relationships.filter(relationship=>ids.has(relationship.sourceId)||ids.has(relationship.targetId)||[...(relationship.sourcePropertyPath||[]),...(relationship.targetPropertyPath||[])].some(step=>ids.has(step.propertyId))).map(relationship=>relationship.id));
      for(const relationship of project.relationships)if(relationship.kind==='ItemFlow'&&affectedRelationships.has(relationship.connectorId))affectedRelationships.add(relationship.id);
      project.relationships=project.relationships.filter(relationship=>!affectedRelationships.has(relationship.id));
      for(const diagram of project.diagrams){const removedNodes=new Set(diagram.nodes.filter(node=>ids.has(node.elementId)||(node.propertyPath||[]).some(step=>ids.has(step.propertyId))).map(node=>node.id));let changedNodes=true;while(changedNodes){changedNodes=false;for(const node of diagram.nodes)if(removedNodes.has(node.parentPresentationId)&&!removedNodes.has(node.id)){removedNodes.add(node.id);changedNodes=true}}diagram.nodes=diagram.nodes.filter(node=>!removedNodes.has(node.id));diagram.edges=diagram.edges.filter(edge=>!removedNodes.has(edge.sourceNodeId)&&!removedNodes.has(edge.targetNodeId)&&!affectedRelationships.has(edge.relationshipId))}
      break;
    }
    case'create-relationship':{
      assertNewId(project,operation.relationship,'Relationship');
      if(operation.edge){required(findDiagram(project,operation.diagramId),'Diagram not found');assertNewId(project,operation.edge,'Presentation edge')}
      project.relationships.push(deepClone(operation.relationship));
      if(operation.edge)findDiagram(project,operation.diagramId).edges.push(deepClone(operation.edge));
      break;
    }
    case'delete-relationship':
      project.relationships=project.relationships.filter(relationship=>relationship.id!==operation.relationshipId);
      for(const diagram of project.diagrams)diagram.edges=diagram.edges.filter(edge=>edge.relationshipId!==operation.relationshipId);
      break;
    case'create-diagram':assertNewId(project,operation.diagram,'Diagram');assertIBDContext(project,operation.diagram);project.diagrams.push(deepClone(operation.diagram));break;
    case'delete-diagram':
      project.diagrams=project.diagrams.filter(diagram=>diagram.id!==operation.diagramId);
      if(project.activeDiagramId===operation.diagramId)project.activeDiagramId=project.diagrams[0]?.id||null;
      break;
    case'add-presentation':{
      const diagram=required(findDiagram(project,operation.diagramId),'Diagram not found');assertNewId(project,operation.node,'Presentation node');diagram.nodes.push(deepClone(operation.node));break;
    }
    case'remove-presentation':{
      const diagram=required(findDiagram(project,operation.diagramId),'Diagram not found'),removed=new Set([operation.nodeId]);let changed=true;while(changed){changed=false;for(const node of diagram.nodes)if(removed.has(node.parentPresentationId)&&!removed.has(node.id)){removed.add(node.id);changed=true}}diagram.nodes=diagram.nodes.filter(node=>!removed.has(node.id));diagram.edges=diagram.edges.filter(edge=>!removed.has(edge.sourceNodeId)&&!removed.has(edge.targetNodeId));break;
    }
    case'move-node':{
      const node=required(findNode(project,operation.diagramId,operation.nodeId),'Node not found');node.x=operation.x;node.y=operation.y;break;
    }
    case'resize-node':{
      const node=required(findNode(project,operation.diagramId,operation.nodeId),'Node not found');node.width=operation.width;node.height=operation.height;break;
    }
    case'set-edge-points':{
      const edge=required(findDiagram(project,operation.diagramId)?.edges.find(item=>item.id===operation.edgeId),'Edge not found');edge.points=deepClone(operation.points);break;
    }
    case'set-compartment':{
      const element=required(findTarget(project,'element',operation.elementId),'Element not found');element.compartments=element.compartments||{};element.compartments[operation.name]=deepClone(operation.value);break;
    }
    case'set-compartment-visibility':{
      const element=required(findTarget(project,'element',operation.elementId),'Element not found');element.compartmentVisibility=element.compartmentVisibility||{};element.compartmentVisibility[operation.name]=Boolean(operation.value);break;
    }
    case'set-property-path':{const relationship=required(findTarget(project,'relationship',operation.relationshipId),'Relationship not found');if(!['source','target'].includes(operation.end))throw Error('Path end must be source or target');relationship[`${operation.end}PropertyPath`]=deepClone(operation.path);break}
    case'set-port-placement':{const diagram=required(findDiagram(project,operation.diagramId),'Diagram not found'),node=required(findNode(project,operation.diagramId,operation.nodeId),'Port presentation not found'),owner=required(diagram.nodes.find(item=>item.id===operation.boundaryOwnerNodeId),'Boundary owner presentation not found');attachPortPresentation(node,owner,{side:operation.side,offset:operation.offset,endpointPath:operation.endpointPath});break}
    case'nest-presentation':{const diagram=required(findDiagram(project,operation.diagramId),'Diagram not found'),node=required(findNode(project,operation.diagramId,operation.nodeId),'Presentation not found');if(operation.parentPresentationId===node.id)throw Error('A presentation cannot contain itself');node.parentPresentationId=operation.parentPresentationId||null;node.relativeX=operation.relativeX;node.relativeY=operation.relativeY;node.propertyPath=deepClone(operation.propertyPath||[]);break}
    case'set-connector-kind':{const relationship=required(findTarget(project,'relationship',operation.relationshipId),'Connector not found');if(!['assembly','delegation'].includes(operation.connectorKind))throw Error('Invalid connector kind');relationship.connectorKind=operation.connectorKind;relationship.kind=operation.connectorKind==='delegation'?'DelegationConnector':'Connector';break}
    case'add-item-flow':createItemFlow(project,required(findTarget(project,'relationship',operation.connectorId),'Connector not found'),operation.conveyedClassifierIds,operation.direction,operation.itemFlow||{});break;
    case'update-item-flow':updateItemFlow(project,operation.itemFlowId,deepClone(operation.changes));break;
    case'remove-item-flow':removeItemFlow(project,operation.itemFlowId);break;
    case'set-diagram-context':{const diagram=required(findDiagram(project,operation.diagramId),'Diagram not found');const next={...diagram,contextId:operation.contextId};assertIBDContext(project,next);diagram.contextId=operation.contextId;break}
    case'bulk-import':case'replace-project':return replaceProject(operation);
    default:throw Error(`Unsupported operation ${operation.type}`);
  }
  synchronizeProject(project);
  project.metadata=project.metadata||{};project.metadata.updatedAt=new Date().toISOString();
  return project;
}

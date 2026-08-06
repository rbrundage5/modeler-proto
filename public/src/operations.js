import {synchronizeSemanticModel} from './semantic-core.js';

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
  return undefined;
}

export function canRebaseOperation(project,operation){
  if(['create-element','create-relationship','create-diagram','add-presentation','bulk-import'].includes(operation.type)){
    const id=operation.element?.id||operation.relationship?.id||operation.diagram?.id||operation.node?.id;
    return operation.type==='bulk-import'||Boolean(id&&!containsId(project,id));
  }
  if(['set-property','move-node','resize-node','set-edge-points','set-compartment','set-compartment-visibility'].includes(operation.type))return JSON.stringify(currentValue(project,operation))===JSON.stringify(operation.expectedValue);
  return ['delete-element','delete-relationship','delete-diagram','remove-presentation'].includes(operation.type);
}

function replaceProject(operation){return synchronizeSemanticModel(deepClone(operation.project))}

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
      project.relationships=project.relationships.filter(relationship=>!ids.has(relationship.sourceId)&&!ids.has(relationship.targetId));
      for(const diagram of project.diagrams){diagram.nodes=diagram.nodes.filter(node=>!ids.has(node.elementId));const relationshipIds=new Set(project.relationships.map(relationship=>relationship.id));diagram.edges=diagram.edges.filter(edge=>relationshipIds.has(edge.relationshipId))}
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
    case'create-diagram':assertNewId(project,operation.diagram,'Diagram');project.diagrams.push(deepClone(operation.diagram));break;
    case'delete-diagram':
      project.diagrams=project.diagrams.filter(diagram=>diagram.id!==operation.diagramId);
      if(project.activeDiagramId===operation.diagramId)project.activeDiagramId=project.diagrams[0]?.id||null;
      break;
    case'add-presentation':{
      const diagram=required(findDiagram(project,operation.diagramId),'Diagram not found');assertNewId(project,operation.node,'Presentation node');diagram.nodes.push(deepClone(operation.node));break;
    }
    case'remove-presentation':{
      const diagram=required(findDiagram(project,operation.diagramId),'Diagram not found');diagram.nodes=diagram.nodes.filter(node=>node.id!==operation.nodeId);diagram.edges=diagram.edges.filter(edge=>edge.sourceNodeId!==operation.nodeId&&edge.targetNodeId!==operation.nodeId);break;
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
    case'bulk-import':case'replace-project':return replaceProject(operation);
    default:throw Error(`Unsupported operation ${operation.type}`);
  }
  synchronizeSemanticModel(project);
  project.metadata=project.metadata||{};project.metadata.updatedAt=new Date().toISOString();
  return project;
}

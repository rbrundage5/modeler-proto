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
export function deepClone(v){return globalThis.structuredClone?structuredClone(v):JSON.parse(JSON.stringify(v))}
export function findTarget(p,type,id){if(type==='relationship')return p.relationships?.find(x=>x.id===id)||null;if(type==='diagram')return p.diagrams?.find(x=>x.id===id)||null;if(p.root?.id===id)return p.root;return p.elements?.find(x=>x.id===id)||null}
export function findDiagram(p,id){return p.diagrams?.find(x=>x.id===id)||null}
export function findNode(p,did,nid){return findDiagram(p,did)?.nodes?.find(x=>x.id===nid)||null}
export function containsId(p,id){return p.root?.id===id||p.elements?.some(x=>x.id===id)||p.relationships?.some(x=>x.id===id)||p.diagrams?.some(x=>x.id===id)||p.diagrams?.some(d=>d.nodes?.some(x=>x.id===id)||d.edges?.some(x=>x.id===id))}
function required(value,message){if(!value)throw Error(message);return value}
function assertNewId(p,item,label){required(item,`${label} is required`);required(item.id,`${label} ID is required`);if(containsId(p,item.id))throw Error(`Duplicate ID: ${item.id}`)}
export function currentValue(p,op){if(op.type==='set-property')return findTarget(p,op.targetType||'element',op.targetId)?.[op.property];if(op.type==='move-node'){const n=findNode(p,op.diagramId,op.nodeId);return n&&{x:n.x,y:n.y}}if(op.type==='resize-node'){const n=findNode(p,op.diagramId,op.nodeId);return n&&{width:n.width,height:n.height}}if(op.type==='set-edge-points')return findDiagram(p,op.diagramId)?.edges?.find(x=>x.id===op.edgeId)?.points;if(op.type==='set-compartment')return findTarget(p,'element',op.elementId)?.compartments?.[op.name];if(op.type==='set-compartment-visibility')return findTarget(p,'element',op.elementId)?.compartmentVisibility?.[op.name];return undefined}
export function canRebaseOperation(p,op){if(['create-element','create-relationship','create-diagram','add-presentation','bulk-import'].includes(op.type)){const id=op.element?.id||op.relationship?.id||op.diagram?.id||op.node?.id;return op.type==='bulk-import'||(id&&!containsId(p,id))}if(['set-property','move-node','resize-node','set-edge-points','set-compartment','set-compartment-visibility'].includes(op.type))return JSON.stringify(currentValue(p,op))===JSON.stringify(op.expectedValue);if(['delete-element','delete-relationship','delete-diagram','remove-presentation'].includes(op.type))return true;return false}
export function applyOperation(p,op){switch(op.type){case'set-property':{const t=required(findTarget(p,op.targetType||'element',op.targetId),'Target not found');t[op.property]=deepClone(op.value);break}case'create-element':{assertNewId(p,op.element,'Element');if(op.node){required(findDiagram(p,op.diagramId),'Diagram not found');assertNewId(p,op.node,'Presentation node')}p.elements.push(deepClone(op.element));if(op.node)findDiagram(p,op.diagramId).nodes.push(deepClone(op.node));break}case'delete-element':{const ids=new Set([op.elementId]);let changed=true;while(changed){changed=false;for(const e of p.elements)if(ids.has(e.ownerId)&&!ids.has(e.id)){ids.add(e.id);changed=true}}p.elements=p.elements.filter(e=>!ids.has(e.id));p.relationships=p.relationships.filter(r=>!ids.has(r.sourceId)&&!ids.has(r.targetId));for(const d of p.diagrams){d.nodes=d.nodes.filter(n=>!ids.has(n.elementId));const rels=new Set(p.relationships.map(r=>r.id));d.edges=d.edges.filter(e=>rels.has(e.relationshipId))}break}case'create-relationship':{assertNewId(p,op.relationship,'Relationship');if(op.edge){required(findDiagram(p,op.diagramId),'Diagram not found');assertNewId(p,op.edge,'Presentation edge')}p.relationships.push(deepClone(op.relationship));if(op.edge)findDiagram(p,op.diagramId).edges.push(deepClone(op.edge));break}case'delete-relationship':p.relationships=p.relationships.filter(r=>r.id!==op.relationshipId);for(const d of p.diagrams)d.edges=d.edges.filter(e=>e.relationshipId!==op.relationshipId);break;case'create-diagram':assertNewId(p,op.diagram,'Diagram');p.diagrams.push(deepClone(op.diagram));break;case'delete-diagram':p.diagrams=p.diagrams.filter(d=>d.id!==op.diagramId);if(p.activeDiagramId===op.diagramId)p.activeDiagramId=p.diagrams[0]?.id||null;break;case'add-presentation':{const d=required(findDiagram(p,op.diagramId),'Diagram not found');assertNewId(p,op.node,'Presentation node');d.nodes.push(deepClone(op.node));break}case'remove-presentation':{const d=required(findDiagram(p,op.diagramId),'Diagram not found');d.nodes=d.nodes.filter(n=>n.id!==op.nodeId);d.edges=d.edges.filter(e=>e.sourceNodeId!==op.nodeId&&e.targetNodeId!==op.nodeId);break}case'move-node':{const n=required(findNode(p,op.diagramId,op.nodeId),'Node not found');n.x=op.x;n.y=op.y;break}case'resize-node':{const n=required(findNode(p,op.diagramId,op.nodeId),'Node not found');n.width=op.width;n.height=op.height;break}case'set-edge-points':{const e=required(findDiagram(p,op.diagramId)?.edges.find(x=>x.id===op.edgeId),'Edge not found');e.points=deepClone(op.points);break}case'set-compartment':{const e=required(findTarget(p,'element',op.elementId),'Element not found');e.compartments=e.compartments||{};e.compartments[op.name]=deepClone(op.value);break}case'set-compartment-visibility':{const e=required(findTarget(p,'element',op.elementId),'Element not found');e.compartmentVisibility=e.compartmentVisibility||{};e.compartmentVisibility[op.name]=!!op.value;break}case'bulk-import':return deepClone(op.project);case'replace-project':return deepClone(op.project);default:throw Error(`Unsupported operation ${op.type}`)}p.metadata=p.metadata||{};p.metadata.updatedAt=new Date().toISOString();return p}

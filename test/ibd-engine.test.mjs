import test from 'node:test';
import assert from 'node:assert/strict';
import {createProject,defaultElement,defaultRelationship,normalizeProject} from '../public/src/model.js';
import {applyOperation} from '../public/src/operations.js';
import {formatFeature} from '../public/src/notation.js';
import {validate} from '../public/src/validator.js';
import {availableIBDProperties,createIBDPropertyPresentation,createIBDPortPresentation,ensureIBDContextPresentation,configureIBDConnector,createItemFlow,normalizeIBDProject,perimeterPosition,validateIBD} from '../public/src/ibd-engine.js';

const add=(project,kind,name,ownerId=project.root.id)=>{const element=defaultElement(kind,ownerId);element.name=name;project.elements.push(element);return element};
function fixture(){
  const project=createProject('IBD'),context=add(project,'Block','Receiver'),partType=add(project,'Block','PowerSupply'),otherType=add(project,'Block','Antenna'),iface=add(project,'InterfaceBlock','PowerInterface'),signal=add(project,'Signal','Power');
  const part=add(project,'PartProperty','powerSupply',context.id);part.typeRef=partType.id;part.multiplicity='1..2';part.multiplicityLower='1';part.multiplicityUpper='2';
  const other=add(project,'ReferenceProperty','antenna',context.id);other.typeRef=otherType.id;
  const contextPort=add(project,'ProxyPort','power',context.id);contextPort.typeRef=iface.id;
  const partPort=add(project,'ProxyPort','power',partType.id);partPort.typeRef=iface.id;
  const flow=add(project,'FlowProperty','powerFlow',iface.id);flow.typeRef=signal.id;flow.direction='inout';
  const diagram={id:'ibd-1',externalId:'IBD-1',name:'Receiver IBD',diagramType:'Internal Block Diagram',ownerId:context.id,contextId:context.id,nodes:[],edges:[]};project.diagrams.push(diagram);project.activeDiagramId=diagram.id;normalizeIBDProject(project);
  return{project,context,partType,otherType,iface,signal,part,other,contextPort,partPort,diagram};
}

test('IBD requires a Block context',()=>{const project=createProject('Invalid'),pkg=add(project,'Package','Structure'),diagram={id:'bad',name:'Bad IBD',diagramType:'Internal Block Diagram',ownerId:pkg.id,contextId:pkg.id,nodes:[],edges:[]};project.diagrams.push(diagram);assert(validate(project).some(issue=>issue.code==='IBD_CONTEXT'));project.diagrams=[];assert.throws(()=>applyOperation(project,{type:'create-diagram',diagram}),/requires a Block context/)});

test('owned and inherited properties are presented without semantic duplication',()=>{
  const {project,context,part,diagram}=fixture(),parent=add(project,'Block','Vehicle'),inherited=add(project,'PartProperty','receiver',parent.id);inherited.typeRef=context.id;project.relationships.push(defaultRelationship('Generalization',context.id,parent.id,project.root.id));
  const before=project.elements.length,available=availableIBDProperties(project,diagram);assert(available.some(item=>item.element.id===part.id&&!item.inherited));assert(available.some(item=>item.element.id===inherited.id&&item.inherited));
  const ownedNode=createIBDPropertyPresentation(project,diagram,part.id),inheritedNode=createIBDPropertyPresentation(project,diagram,inherited.id);assert.equal(project.elements.length,before);assert.equal(inheritedNode.inheritedPresentation,true);assert.deepEqual(ownedNode.endpointPath,[part.id]);assert.equal(formatFeature(project,part),'powerSupply: PowerSupply [1..2]');
});

test('ports retain side and relative perimeter position when owners resize and projects reload',()=>{
  const {project,contextPort,partPort,part,diagram}=fixture(),contextNode=ensureIBDContextPresentation(project,diagram),partNode=createIBDPropertyPresentation(project,diagram,part.id,{x:200,y:180,width:300,height:160});
  const contextPortNode=createIBDPortPresentation(project,diagram,contextPort.id,contextNode,{side:'left',offset:.25}),partPortNode=createIBDPortPresentation(project,diagram,partPort.id,partNode,{side:'bottom',offset:.75});
  assert.deepEqual(contextPortNode.endpointPath,[contextPort.id]);assert.deepEqual(partPortNode.endpointPath,[part.id,partPort.id]);partNode.width=500;partNode.height=240;normalizeIBDProject(project);assert.deepEqual({x:partPortNode.x,y:partPortNode.y},perimeterPosition(partNode,'bottom',.75,partPortNode));
  const reloaded=normalizeProject(JSON.parse(JSON.stringify(project))),saved=reloaded.diagrams[0].nodes.find(node=>node.id===partPortNode.id);assert.equal(saved.portSide,'bottom');assert.equal(saved.perimeterOffset,.75);assert.deepEqual(saved.endpointPath,[part.id,partPort.id]);
});

test('assembly and delegation connectors store complete endpoint paths',()=>{
  const {project,contextPort,partPort,part,other,diagram}=fixture(),contextNode=ensureIBDContextPresentation(project,diagram),partNode=createIBDPropertyPresentation(project,diagram,part.id),otherNode=createIBDPropertyPresentation(project,diagram,other.id),contextPortNode=createIBDPortPresentation(project,diagram,contextPort.id,contextNode),partPortNode=createIBDPortPresentation(project,diagram,partPort.id,partNode);
  const assembly=defaultRelationship('Connector',part.id,other.id,diagram.contextId);configureIBDConnector(project,diagram,assembly,partNode,otherNode,'assembly');assert.deepEqual(assembly.sourceEndpointPath,[part.id]);assert.deepEqual(assembly.targetEndpointPath,[other.id]);
  const delegation=defaultRelationship('DelegationConnector',contextPort.id,partPort.id,diagram.contextId);configureIBDConnector(project,diagram,delegation,contextPortNode,partPortNode,'delegation');assert.deepEqual(delegation.sourceEndpointPath,[contextPort.id]);assert.deepEqual(delegation.targetEndpointPath,[part.id,partPort.id]);assert.deepEqual(delegation.targetPartWithPortPath,[part.id]);assert.equal(delegation.targetPortId,partPort.id);
  assert.throws(()=>configureIBDConnector(project,diagram,defaultRelationship('Connector',part.id,other.id,diagram.contextId),contextNode,partNode,'assembly'),/Invalid assembly/);
});

test('ItemFlow attaches to a connector with conveyed classifier and direction',()=>{
  const {project,contextPort,partPort,part,signal,diagram}=fixture(),contextNode=ensureIBDContextPresentation(project,diagram),partNode=createIBDPropertyPresentation(project,diagram,part.id),a=createIBDPortPresentation(project,diagram,contextPort.id,contextNode),b=createIBDPortPresentation(project,diagram,partPort.id,partNode),connector=defaultRelationship('DelegationConnector',a.elementId,b.elementId,diagram.contextId);configureIBDConnector(project,diagram,connector,a,b,'delegation');project.relationships.push(connector);diagram.edges.push({id:'edge-1',relationshipId:connector.id,sourceNodeId:a.id,targetNodeId:b.id});const itemFlow=createItemFlow(project,connector,signal.id,'sourceToTarget');assert.equal(itemFlow.connectorId,connector.id);assert.deepEqual(itemFlow.conveyedIds,[signal.id]);assert.equal(validateIBD(project,diagram).length,0);
});

test('replace-project collaboration operations preserve IBD presentation semantics',()=>{
  const {project,partPort,part,diagram}=fixture(),partNode=createIBDPropertyPresentation(project,diagram,part.id),portNode=createIBDPortPresentation(project,diagram,partPort.id,partNode,{side:'top',offset:.4}),replacement=applyOperation(createProject('Empty'),{type:'replace-project',project});const restored=replacement.diagrams[0].nodes.find(node=>node.id===portNode.id);assert.equal(restored.boundaryOwnerNodeId,partNode.id);assert.equal(restored.portSide,'top');assert.equal(restored.perimeterOffset,.4);assert.deepEqual(restored.endpointPath,[part.id,partPort.id]);
});

test('import-shaped IBD records normalize endpoint paths and boundary attachments',()=>{
  const {project,partPort,part,other,diagram}=fixture(),partNode=createIBDPropertyPresentation(project,diagram,part.id),otherNode=createIBDPropertyPresentation(project,diagram,other.id),importedPort={id:'imported-port-node',elementId:partPort.id,x:partNode.x+partNode.width,y:partNode.y+30,width:18,height:18,boundaryOwnerNodeId:partNode.id,portSide:'right',perimeterOffset:.25,endpointPath:[part.id,partPort.id]};diagram.nodes.push(importedPort);const connector=defaultRelationship('Connector',part.id,other.id,diagram.contextId);connector.sourceEndpointPath=[part.id];connector.targetEndpointPath=[other.id];project.relationships.push(connector);const edge={id:'imported-edge',relationshipId:connector.id,points:[]};diagram.edges.push(edge);normalizeProject(project);assert.equal(importedPort.boundary,true);assert.deepEqual(importedPort.endpointPath,[part.id,partPort.id]);assert.deepEqual({x:importedPort.x,y:importedPort.y},perimeterPosition(partNode,'right',.25,importedPort));assert.equal(edge.sourceNodeId,partNode.id);assert.equal(edge.targetNodeId,otherNode.id);assert.deepEqual(edge.sourceEndpointPath,[part.id]);
});

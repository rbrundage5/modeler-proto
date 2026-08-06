import test from 'node:test';
import assert from 'node:assert/strict';
import {createProject,defaultElement,defaultRelationship,uid} from '../public/src/model.js';
import {applyOperation} from '../public/src/operations.js';

function fixture(){
  const project=createProject('Operations');
  const owner=defaultElement('Package',project.root.id);
  const block=defaultElement('Block',owner.id);
  const diagram={id:uid('diagram'),name:'Structure',diagramType:'Block Definition Diagram',ownerId:owner.id,nodes:[],edges:[]};
  project.elements.push(owner,block);
  project.diagrams.push(diagram);
  project.activeDiagramId=diagram.id;
  return{project,owner,block,diagram};
}

test('element and presentation operations preserve diagram integrity',()=>{
  const {project,owner,diagram}=fixture(),element=defaultElement('Block',owner.id);
  const node={id:uid('node'),elementId:element.id,x:10,y:20,width:160,height:90};
  applyOperation(project,{type:'create-element',element,diagramId:diagram.id,node});
  applyOperation(project,{type:'move-node',diagramId:diagram.id,nodeId:node.id,x:30,y:40});
  applyOperation(project,{type:'resize-node',diagramId:diagram.id,nodeId:node.id,width:200,height:120});
  assert.deepEqual(diagram.nodes[0],{...node,x:30,y:40,width:200,height:120});
  applyOperation(project,{type:'remove-presentation',diagramId:diagram.id,nodeId:node.id});
  assert.equal(diagram.nodes.length,0);
  assert.equal(project.elements.some(item=>item.id===element.id),true);
});

test('deleting an element cascades to owned elements, relationships, nodes, and edges',()=>{
  const {project,owner,block,diagram}=fixture(),child=defaultElement('PartProperty',block.id);
  const peer=defaultElement('Block',owner.id),relationship=defaultRelationship('Association',block.id,peer.id,owner.id);
  project.elements.push(child,peer);project.relationships.push(relationship);
  diagram.nodes.push({id:'node-a',elementId:block.id},{id:'node-b',elementId:peer.id});
  diagram.edges.push({id:'edge-a',relationshipId:relationship.id,sourceNodeId:'node-a',targetNodeId:'node-b'});
  applyOperation(project,{type:'delete-element',elementId:block.id});
  assert.deepEqual(project.elements.map(item=>item.id),[owner.id,peer.id]);
  assert.equal(project.relationships.length,0);assert.deepEqual(diagram.nodes.map(item=>item.id),['node-b']);assert.equal(diagram.edges.length,0);
});

test('relationship and diagram operations reject duplicate IDs and missing diagrams',()=>{
  const {project,owner,block,diagram}=fixture(),peer=defaultElement('Block',owner.id);project.elements.push(peer);
  const relationship=defaultRelationship('Association',block.id,peer.id,owner.id);
  applyOperation(project,{type:'create-relationship',relationship});
  assert.throws(()=>applyOperation(project,{type:'create-relationship',relationship}),/Duplicate ID/);
  assert.throws(()=>applyOperation(project,{type:'add-presentation',diagramId:'missing',node:{id:'node-x',elementId:block.id}}),/Diagram not found/);
  assert.throws(()=>applyOperation(project,{type:'create-diagram',diagram}),/Duplicate ID/);
});

test('compartment operations initialize legacy elements safely',()=>{
  const {project,block}=fixture();delete block.compartments;delete block.compartmentVisibility;
  applyOperation(project,{type:'set-compartment',elementId:block.id,name:'parts',value:['part-a']});
  applyOperation(project,{type:'set-compartment-visibility',elementId:block.id,name:'parts',value:false});
  assert.deepEqual(block.compartments.parts,['part-a']);assert.equal(block.compartmentVisibility.parts,false);
});

test('replacing a project returns an isolated clone',()=>{
  const source=createProject('Replacement'),current=createProject('Current');
  const replacement=applyOperation(current,{type:'replace-project',project:source});
  replacement.name='Changed';
  assert.equal(source.name,'Replacement');assert.equal(current.name,'Current');
});

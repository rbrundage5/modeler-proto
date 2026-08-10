import test from 'node:test';
import assert from 'node:assert/strict';
import {createProject,defaultElement,normalizeProject} from '../public/src/model.js';
import {applyOperation,canRebaseOperation} from '../public/src/operations.js';
import {visibleCompartments} from '../public/src/notation.js';

test('compartment visibility is independent presentation state and survives reload/replay',()=>{
  const project=createProject(),block=defaultElement('Block',project.root.id),value=defaultElement('ValueProperty',block.id);block.id='block';value.id='value';project.elements.push(block,value);project.diagrams.push({id:'d1',diagramType:'Block Definition Diagram',nodes:[{id:'n1',elementId:'block',x:0,y:0,width:200,height:120},{id:'n2',elementId:'block',x:300,y:0,width:200,height:120}],edges:[]});normalizeProject(project);
  const operation={type:'set-presentation-compartment-visibility',diagramId:'d1',nodeId:'n1',name:'values',value:false};
  assert.equal(canRebaseOperation(project,{...operation,expectedValue:undefined}),true);applyOperation(project,operation);
  assert.equal(project.elements[0].compartmentVisibility.values,true);assert.equal(project.diagrams[0].nodes[0].presentationOptions.compartmentVisibility.values,false);assert.deepEqual(project.diagrams[0].nodes[1].presentationOptions?.compartmentVisibility||{},{});
  assert.equal(visibleCompartments(project,block,{...block.compartmentVisibility,...project.diagrams[0].nodes[0].presentationOptions.compartmentVisibility}).some(item=>item.name==='values'),false);
  const loaded=normalizeProject(JSON.parse(JSON.stringify(project)));assert.equal(loaded.diagrams[0].nodes[0].presentationOptions.compartmentVisibility.values,false);
});

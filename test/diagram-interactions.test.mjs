import test from 'node:test';
import assert from 'node:assert/strict';
import {captureGroupGeometry,hitTestPresentations,moveGroup,nodesInSelectionBox,pointToSegmentDistance,updateSelection} from '../public/src/diagram-interactions.js';

test('shared hit testing selects thin routed edges and respects presentation layering',()=>{
  const scene={nodes:[{id:'under',x:0,y:0,width:100,height:100,zOrder:1},{id:'over',x:20,y:20,width:100,height:100,zOrder:5},{id:'context',x:0,y:0,width:500,height:500,isContextBoundary:true,zOrder:99}],edges:[{id:'route',visiblePath:[{x:0,y:150},{x:100,y:150},{x:100,y:250}],zOrder:3}]};
  assert.equal(pointToSegmentDistance({x:52,y:154},{x:0,y:150},{x:100,y:150}),4);
  assert.deepEqual(hitTestPresentations(scene,{x:30,y:30}).map(hit=>hit.id),['over','under']);
  assert.equal(hitTestPresentations(scene,{x:99,y:205},{edgeTolerance:8})[0].id,'route');
});

test('selection box, additive selection, and group movement are presentation based',()=>{
  const nodes=[{id:'a',elementId:'same',x:10,y:10,width:20,height:20},{id:'b',elementId:'same',x:50,y:10,width:20,height:20},{id:'frame',x:0,y:0,width:500,height:500,nonVisualContext:true}];
  assert.deepEqual(nodesInSelectionBox(nodes,{x:0,y:0},{x:75,y:40}),['a','b']);
  let selected=updateSelection(new Set(),'a');selected=updateSelection(selected,'b',{additive:true});assert.deepEqual([...selected],['a','b']);
  const starts=captureGroupGeometry(nodes,selected);moveGroup(nodes,starts,15,-5);assert.deepEqual(nodes.slice(0,2).map(({x,y})=>({x,y})),[{x:25,y:5},{x:65,y:5}]);
  selected=updateSelection(selected,'a',{additive:true});assert.deepEqual([...selected],['b']);
});

import {applyOperation} from '../public/src/operations.js';
test('removing an edge presentation preserves its semantic relationship and other presentations',()=>{
  const project={root:{id:'root'},elements:[],relationships:[{id:'relationship'}],diagrams:[{id:'a',nodes:[],edges:[{id:'edge-a',relationshipId:'relationship'}]},{id:'b',nodes:[],edges:[{id:'edge-b',relationshipId:'relationship'}]}]};
  applyOperation(project,{type:'remove-edge-presentation',diagramId:'a',edgeId:'edge-a'});
  assert.equal(project.relationships.length,1);assert.equal(project.diagrams[0].edges.length,0);assert.equal(project.diagrams[1].edges.length,1);
});

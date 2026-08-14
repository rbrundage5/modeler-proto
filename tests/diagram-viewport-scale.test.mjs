import test from 'node:test';import assert from 'node:assert/strict';import {diagramRenderSet} from '../public/src/diagram-viewport.js';

test('100k-node 200k-edge diagram queries only the visible working set',()=>{
  const nodes=Array.from({length:100000},(_,i)=>({id:`n${i}`,elementId:`e${i}`,x:(i%1000)*160,y:Math.floor(i/1000)*120,width:100,height:60}));
  const edges=Array.from({length:200000},(_,i)=>({id:`x${i}`,relationshipId:`r${i}`,sourceNodeId:`n${i%100000}`,targetNodeId:`n${(i*17+31)%100000}`}));
  const diagram={id:'d',nodes,edges};const set=diagramRenderSet(diagram,{x:40000,y:3000,width:1600,height:900},{margin:200});
  assert.equal(set.totalNodes,100000);assert.equal(set.totalEdges,200000);assert.ok(set.renderedNodes<5000);assert.ok(set.renderedEdges<10000);
});

test('visible edges retain offscreen endpoints required for geometry',()=>{const diagram={nodes:[{id:'a',x:0,y:0,width:50,height:50},{id:'b',x:5000,y:0,width:50,height:50}],edges:[{id:'e',sourceNodeId:'a',targetNodeId:'b',points:[{x:0,y:25},{x:5000,y:25}]}]};const set=diagramRenderSet(diagram,{x:2400,y:0,width:300,height:100},{margin:20});assert.equal(set.edges.length,1);assert.equal(set.nodes.length,2)});

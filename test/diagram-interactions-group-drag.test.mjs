import test from 'node:test';
import assert from 'node:assert/strict';
import {captureGroupGeometry,moveGroup,updateSelection} from '../public/src/diagram-interactions.js';

test('pointer-down on an already-selected member preserves a multi-selection for dragging',()=>{
  const current=new Set(['node-a','node-b','node-c']);
  const next=updateSelection(current,'node-b',{additive:false,toggle:true});
  assert.deepEqual([...next].sort(),['node-a','node-b','node-c']);
});

test('pointer-down on an unselected node still starts a new single selection',()=>{
  const current=new Set(['node-a','node-b']);
  const next=updateSelection(current,'node-c',{additive:false,toggle:true});
  assert.deepEqual([...next],['node-c']);
});

test('modifier-click still toggles membership in a multi-selection',()=>{
  const current=new Set(['node-a','node-b']);
  const next=updateSelection(current,'node-b',{additive:true,toggle:true});
  assert.deepEqual([...next],['node-a']);
});

test('group geometry moves every selected node by the same delta',()=>{
  const nodes=[
    {id:'node-a',x:10,y:20},
    {id:'node-b',x:40,y:80},
    {id:'node-c',x:200,y:300},
  ];
  const selected=new Set(['node-a','node-b']);
  const starts=captureGroupGeometry(nodes,selected);
  moveGroup(nodes,starts,25,-15);
  assert.deepEqual(nodes,[
    {id:'node-a',x:35,y:5},
    {id:'node-b',x:65,y:65},
    {id:'node-c',x:200,y:300},
  ]);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {diagramContentExtent,diagramWorkspaceExtent} from '../public/src/diagram-workspace-extent.js';

test('keeps the existing canvas as the minimum workspace size',()=>{
  const result=diagramWorkspaceExtent({nodes:[{x:100,y:100,width:200,height:100}],edges:[]});
  assert.equal(result.width,3200);
  assert.equal(result.height,2560);
});

test('expands beyond nodes with working-space padding',()=>{
  const result=diagramWorkspaceExtent({nodes:[{x:4100,y:2750,width:500,height:300}],edges:[]});
  assert.ok(result.width>=4920);
  assert.ok(result.height>=3370);
  assert.ok(result.width>4600);
  assert.ok(result.height>3050);
});

test('includes imported canvas dimensions and relationship geometry',()=>{
  const diagram={canvasWidth:5100,canvasHeight:3600,nodes:[],edges:[{points:[{x:5450,y:3900}],labelPosition:{x:5600,y:4020}}]};
  const content=diagramContentExtent(diagram),result=diagramWorkspaceExtent(diagram);
  assert.deepEqual(content,{right:5600,bottom:4020});
  assert.ok(result.width>=5920);
  assert.ok(result.height>=4340);
});

test('includes sequence lifeline timeline extent',()=>{
  const result=diagramWorkspaceExtent({nodes:[{x:100,y:100,width:180,height:80,timelineEndY:4200}],edges:[]});
  assert.ok(result.height>=4520);
});

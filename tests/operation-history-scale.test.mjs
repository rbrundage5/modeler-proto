import test from 'node:test';
import assert from 'node:assert/strict';
import {buildProjectIndex,indexedElement} from '../public/src/model-index.js';
import {HistoryController} from '../public/src/history-controller.js';
import {OperationHistory} from '../public/src/operation-history.js';

test('history footprint follows edit size rather than million-element repository size',()=>{
  const count=1_000_000,project={root:{id:'root',name:'Root'},elements:Array.from({length:count},(_,i)=>({id:`e${i}`,externalId:`E${i}`,name:`Element ${i}`,ownerId:'root',kind:'Block'})),relationships:[],diagrams:[]};
  buildProjectIndex(project);
  const history=new OperationHistory({limit:100,maxBytes:1024*1024}),controller=new HistoryController(project,{history});
  controller.apply({type:'set-property',targetType:'element',targetId:'e999999',property:'documentation',value:'changed'});
  assert.equal(indexedElement(project,'e999999').documentation,'changed');
  const stats=controller.stats();
  assert.equal(stats.undoEntries,1);
  assert.ok(stats.undoBytes<4096,`compact history unexpectedly used ${stats.undoBytes} bytes`);
  assert.equal(controller.undo(),true);
  assert.equal(indexedElement(project,'e999999').documentation,undefined);
  assert.equal(controller.redo(),true);
  assert.equal(indexedElement(project,'e999999').documentation,'changed');
});

test('history memory budget evicts old deltas instead of growing with edit count',()=>{
  const project={root:{id:'root'},elements:[{id:'e',externalId:'E',name:'E',ownerId:'root',kind:'Block'}],relationships:[],diagrams:[]};buildProjectIndex(project);
  const history=new OperationHistory({limit:100000,maxBytes:32*1024}),controller=new HistoryController(project,{history});
  for(let i=0;i<5000;i++)controller.apply({type:'set-property',targetType:'element',targetId:'e',property:'documentation',value:`v-${i}`});
  const stats=history.stats();assert.ok(stats.undoBytes<=32*1024);assert.ok(stats.undoEntries<5000);assert.equal(indexedElement(project,'e').documentation,'v-4999');
});

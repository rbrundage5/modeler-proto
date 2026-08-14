import test from 'node:test';
import assert from 'node:assert/strict';
import {OperationHistory} from '../public/src/operation-history.js';

test('grouped edits collapse to one undo entry with reverse-order inverse operations',()=>{const history=new OperationHistory({maxBytes:1024*1024});history.begin({label:'align selection'});history.record({type:'move-node',nodeId:'a',x:10},{type:'move-node',nodeId:'a',x:0});history.record({type:'move-node',nodeId:'b',x:20},{type:'move-node',nodeId:'b',x:5});assert.equal(history.commit(),true);assert.equal(history.stats().undoEntries,1);const applied=[];history.undo(operation=>applied.push(operation));assert.equal(applied.length,1);assert.deepEqual(applied[0].operations.map(op=>[op.nodeId,op.x]),[['b',5],['a',0]]);history.redo(operation=>applied.push(operation));assert.deepEqual(applied.at(-1).operations.map(op=>[op.nodeId,op.x]),[['a',10],['b',20]])});

test('oversized single operation is rejected rather than evicting the entire history budget',()=>{const history=new OperationHistory({maxBytes:1024});const accepted=history.record({type:'set-property',value:'x'.repeat(5000)},{type:'set-property',value:''});assert.equal(accepted,false);assert.equal(history.stats().undoEntries,0);assert.equal(history.stats().undoBytes,0)});

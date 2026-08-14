import test from 'node:test';import assert from 'node:assert/strict';import {processInChunks} from '../public/src/chunked-work.js';
test('large jobs yield at bounded chunk boundaries',async()=>{let handled=0,yields=0;await processInChunks(Array.from({length:10000},(_,i)=>i),()=>{handled++},{chunkSize:500,yieldControl:async()=>{yields++}});assert.equal(handled,10000);assert.equal(yields,19)});

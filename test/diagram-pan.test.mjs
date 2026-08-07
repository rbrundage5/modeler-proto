import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {diagramPanPosition,isDiagramPanGesture} from '../public/src/diagram-pan.js';

test('Ctrl or Command primary drag, Space drag, and middle drag initiate diagram panning',()=>{assert.equal(isDiagramPanGesture({button:0,ctrlKey:true,metaKey:false}),true);assert.equal(isDiagramPanGesture({button:0,ctrlKey:false,metaKey:true}),true);assert.equal(isDiagramPanGesture({button:0,ctrlKey:false,metaKey:false},{spacePan:true}),true);assert.equal(isDiagramPanGesture({button:1,ctrlKey:false,metaKey:false}),true);assert.equal(isDiagramPanGesture({button:0,ctrlKey:false,metaKey:false}),false);assert.equal(isDiagramPanGesture({button:2,ctrlKey:true,metaKey:false}),false)});

test('diagram panning converts pointer displacement to scroll position with a drag threshold',()=>{assert.deepEqual(diagramPanPosition({x:100,y:100,left:300,top:200},{clientX:140,clientY:70}),{left:260,top:230,moved:true});assert.equal(diagramPanPosition({x:10,y:10,left:0,top:0},{clientX:12,clientY:11}).moved,false)});

test('application captures modified drags before node movement and cancels click selection after panning',async()=>{const source=await readFile(new URL('../public/src/app.js',import.meta.url),'utf8');assert.match(source,/isDiagramPanGesture/);assert.match(source,/addEventListener\('pointerdown',[\s\S]*,true\)/);assert.match(source,/suppressPanClick/);assert.match(source,/pointercancel/);assert.match(source,/lostpointercapture/)});

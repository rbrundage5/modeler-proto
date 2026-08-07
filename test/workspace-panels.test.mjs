import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizePanelLayout} from '../public/src/workspace-panels.js';

test('workspace panel dimensions normalize and clamp without losing visibility choices',()=>{const state=normalizePanelLayout({left:900,right:10,bottom:350,palette:260,visible:{repository:false,activity:false}});assert.deepEqual({left:state.left,right:state.right,bottom:state.bottom,palette:state.palette},{left:600,right:240,bottom:350,palette:260});assert.equal(state.visible.repository,false);assert.equal(state.visible.activity,false);assert.equal(state.visible.properties,true)});

test('all peripheral workspace panels have persistent show-hide controls and keyboard splitters',async()=>{const [html,source,css]=await Promise.all([readFile(new URL('../public/index.html',import.meta.url),'utf8'),readFile(new URL('../public/src/workspace-panels.js',import.meta.url),'utf8'),readFile(new URL('../public/src/styles.css',import.meta.url),'utf8')]);for(const panel of ['repository','palette','properties','activity'])assert.match(html,new RegExp(`data-panel="${panel}"`));assert.match(source,/role','separator/);assert.match(source,/ArrowLeft/);assert.match(source,/systems-modeler\.workspace-panels\.v1/);assert.match(css,/--repository-width/);assert.match(css,/--activity-height/)});

import test from 'node:test';
import assert from 'node:assert/strict';
import {labelAnchorForPoint,labelPointForAnchor} from '../public/src/relationship-geometry.js';

test('relationship labels follow route geometry through a relative anchor',()=>{
  const anchor=labelAnchorForPoint([{x:0,y:0},{x:100,y:0}],{x:40,y:-12});
  assert.deepEqual(labelPointForAnchor([{x:0,y:50},{x:200,y:50}],anchor),{x:80,y:38});
});

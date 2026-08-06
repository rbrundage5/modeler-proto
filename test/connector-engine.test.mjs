import test from 'node:test';
import assert from 'node:assert/strict';
import {boundaryPoint,orthogonalRoute,obstacleAwareRoute,pathData,nearestSegmentIndex,midpointAlong} from '../public/src/connector-engine.js';

test('connector geometry clips to nodes and creates orthogonal routes',()=>{
  const source={id:'a',x:0,y:0,width:100,height:60},target={id:'b',x:300,y:100,width:100,height:60};
  assert.deepEqual(boundaryPoint(source,{x:300,y:30}),{x:100,y:30});
  const route=orthogonalRoute(source,target);
  assert.equal(route.length,2);assert.equal(route[0].x,route[1].x);
  assert.match(pathData([{x:0,y:0},...route,{x:300,y:100}]),/^M0,0 L/);
});

test('connector editing helpers select segments and calculate path midpoints',()=>{
  const points=[{x:0,y:0},{x:100,y:0},{x:100,y:100}];
  assert.equal(nearestSegmentIndex(points,{x:98,y:75}),1);
  assert.deepEqual(midpointAlong(points),{x:100,y:0});
  assert.deepEqual(midpointAlong([]),{x:0,y:0});
});

test('self relationships receive a visible loop route',()=>{
  const node={id:'same',x:20,y:30,width:100,height:60};
  const route=orthogonalRoute(node,node);
  assert.equal(route.length,3);assert(route.some(point=>point.x>node.x+node.width));assert(route.some(point=>point.y<node.y));
});

test('obstacle-aware routing avoids unrelated presentation bounds',()=>{const a={id:'a',x:0,y:40,width:40,height:40},b={id:'b',x:300,y:40,width:40,height:40},obstacle={id:'middle',x:120,y:20,width:80,height:80},route=obstacleAwareRoute(a,b,[a,b,obstacle]);assert(route.some(point=>point.y<=8||point.y>=112));});

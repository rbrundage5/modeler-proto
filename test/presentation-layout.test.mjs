import test from 'node:test';
import assert from 'node:assert/strict';
import {resizePresentation,presentationMinimum} from '../public/src/presentation-layout.js';

test('all resize directions preserve the opposite edge',()=>{
  const start={x:100,y:100,width:200,height:120};
  assert.deepEqual(resizePresentation(start,'se',50,30),{x:100,y:100,width:250,height:150});
  assert.deepEqual(resizePresentation(start,'nw',20,10),{x:120,y:110,width:180,height:110});
  assert.deepEqual(resizePresentation(start,'e',25,99),{x:100,y:100,width:225,height:120});
  assert.deepEqual(resizePresentation(start,'n',99,-20),{x:100,y:80,width:200,height:140});
});

test('resize constraints prevent collapsed or excessive presentations',()=>{
  const start={x:100,y:100,width:200,height:120},min={minWidth:170,minHeight:80,maxWidth:300,maxHeight:200};
  assert.deepEqual(resizePresentation(start,'nw',190,110,min),{x:130,y:140,width:170,height:80});
  assert.deepEqual(resizePresentation(start,'se',900,900,min),{x:100,y:100,width:300,height:200});
});

test('semantic presentation minimums protect readable notation',()=>{
  assert.deepEqual(presentationMinimum({kind:'PartProperty'},{contentHeight:96}),{minWidth:170,minHeight:96});
  assert.deepEqual(presentationMinimum({kind:'Block'},{isContextBoundary:true}),{minWidth:520,minHeight:340});
  assert.deepEqual(presentationMinimum({kind:'ProxyPort'}),{minWidth:18,minHeight:18});
});

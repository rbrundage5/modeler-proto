import test from 'node:test';
import assert from 'node:assert/strict';
import {collaborationLink,collaborationSettings,loadCollaborationSettings,saveCollaborationSettings} from '../public/src/collaboration-settings.js';

test('URL collaboration settings override remembered room and branch',()=>{
  assert.deepEqual(collaborationSettings({search:'?room=review-room&branch=feature-a',stored:{displayName:'Ada',roomId:'old-room',branchId:'main'}}),{
    displayName:'Ada',roomId:'review-room',branchId:'feature-a'
  });
});

test('collaboration settings normalize blank values',()=>{
  assert.deepEqual(collaborationSettings({stored:{displayName:' ',roomId:'',branchId:null}}),{
    displayName:'Modeler',roomId:'default',branchId:'main'
  });
});

test('share links preserve unrelated query parameters and omit the default branch',()=>{
  const link=collaborationLink({href:'https://modeler.example/app?theme=dark#diagram'},{roomId:'Team A',branchId:'main'});
  assert.equal(link,'https://modeler.example/app?theme=dark&room=Team+A');
});

test('stored collaboration settings round trip and tolerate invalid data',()=>{
  const values=new Map();
  const storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
  saveCollaborationSettings(storage,{displayName:' Grace ',roomId:' review ',branchId:' feature '});
  assert.deepEqual(loadCollaborationSettings(storage),{displayName:'Grace',roomId:'review',branchId:'feature'});
  values.set('systems-modeler.collaboration','{broken');
  assert.deepEqual(loadCollaborationSettings(storage),{});
});

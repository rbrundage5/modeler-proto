import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CollaborationClient} from '../public/src/collaboration.js';
import {presenceColor,presenceState,throttleAwareness} from '../public/src/collaboration-presence.js';
import {createProject} from '../public/src/model.js';

class MemoryStorage{
 constructor(){this.values=new Map()}
 getItem(key){return this.values.get(key)??null}
 setItem(key,value){this.values.set(key,String(value))}
 removeItem(key){this.values.delete(key)}
}
class FakeSocket{
 static OPEN=1;
 static instances=[];
 constructor(url){this.url=url;this.readyState=0;this.sent=[];FakeSocket.instances.push(this)}
 open(){this.readyState=FakeSocket.OPEN;this.onopen?.()}
 receive(message){this.onmessage?.({data:JSON.stringify(message)})}
 send(value){this.sent.push(JSON.parse(value))}
 close(){this.readyState=3;this.onclose?.()}
}
const noTimers={setInterval:()=>1,clearInterval:()=>{},setTimeout:()=>2,clearTimeout:()=>{}};
function clientOptions(storage,project=createProject('Shared')){return{storage,WebSocketClass:FakeSocket,location:{protocol:'https:',host:'modeler.test'},timer:noTimers,getProject:()=>project,onProject:next=>{project=next},onStatus:()=>{},onPresence:()=>{}}}

test('Connect uses the browser History API instead of the local undo stack',async()=>{const source=await readFile(new URL('../public/src/app.js',import.meta.url),'utf8');assert.match(source,/window\.history\.replaceState\(/);assert.doesNotMatch(source,/\blet\b[^;]*\bhistory=\[\]/);assert.match(source,/undoHistory=\[\]/)});

test('presence colors are stable and activity states distinguish active, idle, and offline users',()=>{assert.equal(presenceColor('user-a'),presenceColor('user-a'));assert.notEqual(presenceColor('user-a'),presenceColor('user-b'));const now=1_000_000;assert.equal(presenceState({lastSeen:now-1000},now),'active');assert.equal(presenceState({lastSeen:now-70000},now),'idle');assert.equal(presenceState({lastSeen:now-200000},now),'offline');assert.equal(presenceState({lastSeen:now,offline:true},now),'offline')});

test('cursor awareness is throttled and coalesces the latest ephemeral state',async()=>{const sent=[],publish=throttleAwareness(value=>sent.push(value),20);publish({cursor:{x:1,y:1}});publish({cursor:{x:2,y:2},typing:true});await new Promise(resolve=>setTimeout(resolve,30));assert.equal(sent.length,2);assert.deepEqual(sent.at(-1),{cursor:{x:2,y:2},typing:true})});

test('application wires visible presence panel, cursor, selection, property, and typing awareness',async()=>{const [app,index]=await Promise.all([readFile(new URL('../public/src/app.js',import.meta.url),'utf8'),readFile(new URL('../public/index.html',import.meta.url),'utf8')]);assert.match(index,/id="presencePanel"/);assert.match(app,/CollaborationPresenceView/);assert.match(app,/propertyName,typing:true/);assert.match(app,/presentationId:selected\.nodeId/);assert.match(app,/cursor:\{x:/)});

test('collaboration identity survives reconnects and hello includes device session identity',()=>{FakeSocket.instances=[];const storage=new MemoryStorage(),first=new CollaborationClient(clientOptions(storage));first.connect('aircraft','main');FakeSocket.instances[0].open();const hello=FakeSocket.instances[0].sent[0];assert.equal(hello.type,'hello');assert.ok(hello.sessionId);first.disconnect();const second=new CollaborationClient(clientOptions(storage));assert.equal(second.sessionId,hello.sessionId)});

test('offline operations persist by room and branch, resend after snapshot, and clear only on acknowledgement',()=>{FakeSocket.instances=[];const storage=new MemoryStorage(),project=createProject('Offline'),first=new CollaborationClient(clientOptions(storage,project));assert.equal(first.publish({type:'set-property'}),null);first.connect('aircraft','main');const firstSocket=FakeSocket.instances.at(-1);firstSocket.open();firstSocket.receive({type:'snapshot',project,revision:4,branchId:'main',presence:[]});firstSocket.close();const operationId=first.publish({type:'set-property',targetId:project.root.id,property:'name',value:'Aircraft'});assert.equal(first.pending.length,1);const restored=new CollaborationClient(clientOptions(storage,project));restored.connect('aircraft','main');const socket=FakeSocket.instances.at(-1);socket.open();socket.receive({type:'snapshot',project,revision:4,branchId:'main',presence:[]});assert.equal(socket.sent.filter(message=>message.type==='operation').length,1);socket.receive({type:'operation',operationId,clientId:restored.clientId,operation:{type:'set-property'},revision:5});assert.equal(restored.pending.length,0);assert.equal(storage.getItem(restored.pendingKey()),null)});

test('conflicts pause automatic retries and support explicit remote or local resolution',()=>{FakeSocket.instances=[];const storage=new MemoryStorage(),project=createProject('Conflict'),conflicts=[],client=new CollaborationClient({...clientOptions(storage,project),onConflict:message=>conflicts.push(message)});client.connect('aircraft');const socket=FakeSocket.instances.at(-1);socket.open();socket.receive({type:'snapshot',project,revision:1,branchId:'main',presence:[]});const operationId=client.publish({type:'set-property',targetId:project.root.id,property:'name',value:'Local'});socket.receive({type:'conflict',operationId,operation:{type:'set-property'},project,revision:2,message:'Concurrent edit'});const sendsBefore=socket.sent.length;client.flush(true);assert.equal(socket.sent.length,sendsBefore);conflicts[0].resolve('retry-local');assert.equal(socket.sent.at(-1).force,true);socket.receive({type:'operation',operationId,clientId:client.clientId,operation:{type:'set-property'},revision:3});assert.equal(client.pending.length,0)});

test('terminal server errors remove queued operations instead of retrying forever',()=>{FakeSocket.instances=[];const storage=new MemoryStorage(),project=createProject('Errors'),client=new CollaborationClient({...clientOptions(storage,project),onLog:()=>{}});client.connect('aircraft');const socket=FakeSocket.instances.at(-1);socket.open();socket.receive({type:'snapshot',project,revision:0,branchId:'main',presence:[]});const operationId=client.publish({type:'delete-element',elementId:'missing'});socket.receive({type:'operation-error',operationId,message:'Element not found'});assert.equal(client.pending.length,0)});

test('missing remembered branches safely fall back to main without replaying the wrong branch queue',()=>{FakeSocket.instances=[];const storage=new MemoryStorage(),project=createProject('Fallback'),logs=[],client=new CollaborationClient({...clientOptions(storage,project),onLog:message=>logs.push(message)});client.connect('deleted-feature','feature-a');const socket=FakeSocket.instances.at(-1);socket.open();client.publish({type:'set-property',targetId:project.root.id,property:'name',value:'Feature edit'});assert.equal(client.pending.length,1);assert.equal(socket.sent.filter(message=>message.type==='operation').length,0);socket.receive({type:'snapshot',project,revision:3,branchId:'main',branchFallback:{requestedBranchId:'feature-a',message:'Branch feature-a was not found. Connected to main instead.'},presence:[]});assert.equal(client.branchId,'main');assert.equal(client.pending.length,0);assert.equal(socket.sent.filter(message=>message.type==='operation').length,0);assert.match(logs.at(-1),/Connected to main instead/)});

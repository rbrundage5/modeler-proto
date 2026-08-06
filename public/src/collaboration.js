import {applyOperation} from './operations.js';

const PENDING_PREFIX='systems-modeler.collaboration.pending';
const SESSION_KEY='systems-modeler.collaboration.session';
const clone=value=>globalThis.structuredClone?structuredClone(value):JSON.parse(JSON.stringify(value));

export class CollaborationClient{
 constructor(options={}){
  Object.assign(this,options);
  this.storage=options.storage||globalThis.localStorage;
  this.WebSocketClass=options.WebSocketClass||globalThis.WebSocket;
  this.location=options.location||globalThis.location;
  this.timer=options.timer||globalThis;
  this.clientId=options.clientId||crypto.randomUUID();
  this.sessionId=this.storedSessionId();
  this.name=this.storage?.getItem('modeler.displayName')||`User-${this.clientId.slice(0,5)}`;
  this.branchId='main';this.baseRevision=0;this.socket=null;this.roomId='default';this.pending=[];this.conflicts=new Map();this.awaitingCanonical=new Set();this.seen=new Set();this.reconnectAttempt=0;this.intentional=false;this.activated=false;this.heartbeat=null;this.reconnectTimer=null;this.connectionGeneration=0;
 }
 storedSessionId(){let value=this.storage?.getItem(SESSION_KEY);if(!value){value=crypto.randomUUID();this.storage?.setItem(SESSION_KEY,value)}return value}
 pendingKey(){return`${PENDING_PREFIX}:${this.roomId}:${this.branchId}`}
 restorePending(){try{const records=JSON.parse(this.storage?.getItem(this.pendingKey())||'[]');this.pending=Array.isArray(records)?records.filter(item=>item?.operationId&&item.operation):[]}catch{this.pending=[]}this.onPending?.(this.pending.length)}
 persistPending(){try{if(this.pending.length)this.storage?.setItem(this.pendingKey(),JSON.stringify(this.pending.map(({sentAt,...item})=>item)));else this.storage?.removeItem(this.pendingKey())}catch(error){this.onLog?.(`Could not persist offline changes: ${error.message}`,'warn')}this.onPending?.(this.pending.length)}
 connect(roomId,branchId='main'){
  this.disconnect(false);this.intentional=false;this.activated=true;this.roomId=roomId;this.branchId=branchId;this.restorePending();const generation=++this.connectionGeneration,protocol=this.location.protocol==='https:'?'wss':'ws';
  const socket=new this.WebSocketClass(`${protocol}://${this.location.host}/api/projects/${encodeURIComponent(roomId)}/socket`);this.socket=socket;this.onStatus('Connecting');
  socket.onopen=()=>{if(generation!==this.connectionGeneration)return;this.reconnectAttempt=0;this.onStatus('Connected');this.send({type:'hello',clientId:this.clientId,sessionId:this.sessionId,name:this.name,branchId:this.branchId,device:{userAgent:globalThis.navigator?.userAgent||'unknown'},initialProject:this.getProject()});this.startHeartbeat(generation)};
  socket.onmessage=event=>{if(generation!==this.connectionGeneration)return;let message;try{message=JSON.parse(event.data)}catch{this.onLog?.('Ignored an invalid collaboration message.','warn');return}this.handle(message)};
  socket.onclose=()=>{if(generation!==this.connectionGeneration)return;this.stopHeartbeat();this.onStatus('Offline');if(!this.intentional)this.scheduleReconnect(generation)};
  socket.onerror=()=>{if(generation===this.connectionGeneration)this.onStatus('Error')};
 }
 scheduleReconnect(generation=this.connectionGeneration){if(this.reconnectTimer)return;const delay=Math.min(15000,500*2**this.reconnectAttempt++);this.onLog?.(`Collaboration reconnect in ${Math.max(1,Math.round(delay/1000))}s`,'warn');this.reconnectTimer=this.timer.setTimeout(()=>{this.reconnectTimer=null;if(!this.intentional&&generation===this.connectionGeneration)this.connect(this.roomId,this.branchId)},delay)}
 startHeartbeat(generation=this.connectionGeneration){this.stopHeartbeat();this.heartbeat=this.timer.setInterval(()=>{if(generation===this.connectionGeneration)this.send({type:'ping',at:Date.now()})},25000)}
 stopHeartbeat(){if(this.heartbeat)this.timer.clearInterval(this.heartbeat);this.heartbeat=null}
 remember(operationId){if(!operationId||this.seen.has(operationId))return false;this.seen.add(operationId);if(this.seen.size>2000)this.seen.delete(this.seen.values().next().value);return true}
 acknowledge(operationId){this.pending=this.pending.filter(item=>item.operationId!==operationId);this.conflicts.delete(operationId);this.persistPending()}
 handle(message){
  if(message.operationId&&this.seen.has(message.operationId)&&message.type!=='conflict')return;
  if(message.type==='snapshot'){this.baseRevision=message.revision||0;this.branchId=message.branchId||this.branchId;if(message.project)this.onProject(message.project,'room snapshot');this.awaitingCanonical=new Set(this.pending.map(item=>item.operationId));this.onPresence(message.presence||[]);this.onMeta?.(message);this.flush(true);return}
  if(message.type==='operation'){const own=message.clientId===this.clientId||this.pending.some(item=>item.operationId===message.operationId),needsCanonical=this.awaitingCanonical.delete(message.operationId);this.remember(message.operationId);this.acknowledge(message.operationId);if(!own){try{const updated=applyOperation(this.getProject(),message.operation);updated.revision=message.revision;this.onProject(updated,`${message.author||'Collaborator'}: ${message.operation.type}`)}catch(error){this.onLog?.(`Remote operation failed: ${error.message}; requesting a fresh snapshot.`,'error');this.send({type:'resync',branchId:this.branchId})}}this.baseRevision=message.revision;this.onMeta?.(message);if(needsCanonical)this.send({type:'resync',branchId:this.branchId});else this.flush(true);return}
  if(message.type==='conflict'){this.baseRevision=message.revision;const pending=this.pending.find(item=>item.operationId===message.operationId);if(pending){pending.sentAt=0;this.conflicts.set(message.operationId,{message,pending});this.persistPending()}this.onConflict?.({...message,resolve:strategy=>this.resolveConflict(message.operationId,strategy)});return}
  if(message.type==='presence'){this.onPresence(message.users||[]);return}
  if(message.type==='pong')return;
  if(['branches','commit','locks','merge-result','members'].includes(message.type)){this.onMeta?.(message);return}
  if(['permission-error','operation-error','locked'].includes(message.type)){if(message.operationId)this.acknowledge(message.operationId);this.onLog?.(message.message||`Locked by ${message.owner}`,'error');this.onMeta?.(message)}
 }
 resolveConflict(operationId,strategy='accept-remote'){
  const conflict=this.conflicts.get(operationId);if(!conflict)return false;
  if(strategy==='retry-local'){conflict.pending.baseRevision=this.baseRevision;conflict.pending.force=true;conflict.pending.sentAt=0;this.conflicts.delete(operationId);this.persistPending();this.send(conflict.pending);return true}
  this.acknowledge(operationId);if(conflict.message.project)this.onProject(conflict.message.project,'conflict resolution');return true;
 }
 publish(operation){if(!this.activated)return null;const envelope={type:'operation',operationId:crypto.randomUUID(),clientId:this.clientId,author:this.name,baseRevision:this.baseRevision,operation:clone(operation),createdAt:new Date().toISOString()};this.pending.push(envelope);this.persistPending();this.flush(true);return envelope.operationId}
 flush(force=false){if(this.socket?.readyState!==this.WebSocketClass.OPEN)return;for(const item of this.pending){if(this.conflicts.has(item.operationId))continue;if(!force&&item.sentAt&&Date.now()-item.sentAt<5000)continue;item.baseRevision=this.baseRevision;item.sentAt=Date.now();this.send(item)}}
 commit(message){this.send({type:'commit',message,baseRevision:this.baseRevision})}
 createBranch(name){this.send({type:'create-branch',name,branchId:name})}
 switchBranch(branchId){this.persistPending();this.branchId=branchId;this.restorePending();this.send({type:'switch-branch',branchId})}
 lock(resourceId,ttlMs=120000){this.send({type:'lock',resourceId,ttlMs})}
 unlock(resourceId){this.send({type:'unlock',resourceId})}
 awareness(state={}){this.send({type:'awareness',state:{selectedId:state.selectedId||null,diagramId:state.diagramId||null,mode:state.mode||'modeling'}})}
 setName(name){this.name=name;this.storage?.setItem('modeler.displayName',name)}
 send(value){if(this.socket?.readyState===this.WebSocketClass.OPEN)this.socket.send(JSON.stringify(value))}
 disconnect(intentional=true){this.intentional=intentional;this.connectionGeneration++;this.stopHeartbeat();if(this.reconnectTimer){this.timer.clearTimeout(this.reconnectTimer);this.reconnectTimer=null}const socket=this.socket;this.socket=null;if(socket)socket.close()}
}

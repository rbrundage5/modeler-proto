import {DurableObject} from "cloudflare:workers";
import {applyOperation,canRebaseOperation,deepClone} from '../public/src/operations.js';

const json=v=>JSON.stringify(v);
const now=()=>new Date().toISOString();

export class ProjectRoom extends DurableObject{
  constructor(ctx,env){
    super(ctx,env);
    this.state=ctx;this.env=env;this.sql=ctx.storage.sql;
    ctx.blockConcurrencyWhile(async()=>this.init());
  }
  async init(){
    this.sql.exec(`CREATE TABLE IF NOT EXISTS branches (id TEXT PRIMARY KEY,name TEXT NOT NULL,head_revision INTEGER NOT NULL DEFAULT 0,snapshot TEXT,created_at TEXT NOT NULL,created_by TEXT);
      CREATE TABLE IF NOT EXISTS operations (branch_id TEXT NOT NULL,revision INTEGER NOT NULL,operation_id TEXT NOT NULL UNIQUE,actor TEXT,client_id TEXT,operation TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(branch_id,revision));
      CREATE TABLE IF NOT EXISTS commits (id TEXT PRIMARY KEY,branch_id TEXT NOT NULL,revision INTEGER NOT NULL,message TEXT NOT NULL,author TEXT,created_at TEXT NOT NULL,snapshot TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS members (identity TEXT PRIMARY KEY,role TEXT NOT NULL,display_name TEXT,created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS locks (resource_id TEXT PRIMARY KEY,owner_identity TEXT NOT NULL,owner_name TEXT,expires_at INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS idx_operations_branch ON operations(branch_id,revision);
      CREATE INDEX IF NOT EXISTS idx_commits_branch ON commits(branch_id,revision);`);
    const existing=[...this.sql.exec('SELECT id FROM branches LIMIT 1')];
    if(!existing.length)this.sql.exec('INSERT INTO branches(id,name,head_revision,snapshot,created_at,created_by) VALUES(?,?,?,?,?,?)','main','main',0,null,now(),'system');
  }
  identity(request){
    return request.headers.get('Cf-Access-Authenticated-User-Email')||request.headers.get('X-Modeler-User')||`guest:${crypto.randomUUID()}`;
  }
  async fetch(request){
    const url=new URL(request.url),identity=this.identity(request);
    if(request.headers.get('Upgrade')==='websocket'){
      const pair=new WebSocketPair(),client=pair[0],server=pair[1];
      this.state.acceptWebSocket(server);server.serializeAttachment({identity,clientId:null,name:identity,branchId:'main'});
      return new Response(null,{status:101,webSocket:client});
    }
    if(request.method==='GET'&&url.pathname.endsWith('/health'))return Response.json({ok:true});
    return new Response('Project collaboration room',{status:200});
  }
  member(identity,name){
    let row=[...this.sql.exec('SELECT role,display_name FROM members WHERE identity=?',identity)][0];
    if(!row){const count=[...this.sql.exec('SELECT COUNT(*) AS count FROM members')][0]?.count||0;const role=count===0?'owner':'editor';this.sql.exec('INSERT INTO members(identity,role,display_name,created_at) VALUES(?,?,?,?)',identity,role,name||identity,now());row={role,display_name:name||identity};}
    return row;
  }
  branch(id='main'){
    const row=[...this.sql.exec('SELECT id,name,head_revision,snapshot FROM branches WHERE id=?',id)][0];
    if(!row)throw new Error(`Branch not found: ${id}`);
    return {...row,project:row.snapshot?JSON.parse(row.snapshot):null};
  }
  async webSocketMessage(ws,raw){
    let msg;try{msg=JSON.parse(raw)}catch{return}
    const attachment=ws.deserializeAttachment()||{};
    if(msg.type==='hello'){
      const branchId=msg.branchId||'main',member=this.member(attachment.identity,msg.name);
      ws.serializeAttachment({...attachment,clientId:msg.clientId,name:msg.name||member.display_name,branchId,role:member.role});
      let branch=this.branch(branchId);
      if(!branch.project&&msg.initialProject){this.sql.exec('UPDATE branches SET snapshot=? WHERE id=?',json(msg.initialProject),branchId);branch=this.branch(branchId);}
      ws.send(json({type:'snapshot',project:branch.project,revision:branch.head_revision,branchId,branches:this.listBranches(),commits:this.listCommits(branchId),presence:this.presence(branchId),role:member.role}));
      this.broadcast(branchId,{type:'presence',users:this.presence(branchId)});return;
    }
    const session=ws.deserializeAttachment()||attachment,member=this.member(session.identity,session.name);
    if(member.role==='viewer'&&msg.type!=='hello'){ws.send(json({type:'permission-error',message:'Viewer role cannot modify the model.'}));return;}
    if(msg.type==='operation'){await this.handleOperation(ws,msg,session);return;}
    if(msg.type==='commit'){this.handleCommit(ws,msg,session);return;}
    if(msg.type==='create-branch'){this.createBranch(ws,msg,session);return;}
    if(msg.type==='merge-branch'){this.mergeBranch(ws,msg,session);return;}
    if(msg.type==='set-member-role'){this.setMemberRole(ws,msg,session);return;}
    if(msg.type==='switch-branch'){const branch=this.branch(msg.branchId);ws.serializeAttachment({...session,branchId:msg.branchId});ws.send(json({type:'snapshot',project:branch.project,revision:branch.head_revision,branchId:msg.branchId,branches:this.listBranches(),commits:this.listCommits(msg.branchId),presence:this.presence(msg.branchId),role:member.role}));return;}
    if(msg.type==='lock'){this.handleLock(ws,msg,session);return;}
    if(msg.type==='unlock'){this.sql.exec('DELETE FROM locks WHERE resource_id=? AND owner_identity=?',msg.resourceId,session.identity);this.broadcast(session.branchId,{type:'locks',locks:this.listLocks()});return;}
  }
  async handleOperation(ws,msg,session){
    const branch=this.branch(session.branchId),op=msg.operation;
    const lock=this.activeLock(op.targetId||op.elementId||op.diagramId||op.relationshipId);
    if(lock&&lock.owner_identity!==session.identity){ws.send(json({type:'locked',resourceId:lock.resource_id,owner:lock.owner_name}));return;}
    const current=branch.project;
    const stale=msg.baseRevision!==branch.head_revision;
    if(stale&&!canRebaseOperation(current,op)){
      ws.send(json({type:'conflict',revision:branch.head_revision,project:current,operationId:msg.operationId,operation:op,message:'Another user changed the same model value.'}));return;
    }
    let updated;
    try{updated=applyOperation(deepClone(current),op)}catch(error){ws.send(json({type:'operation-error',message:error.message,operationId:msg.operationId}));return;}
    const revision=branch.head_revision+1;updated.revision=revision;updated.branch=session.branchId;
    this.sql.exec('UPDATE branches SET head_revision=?,snapshot=? WHERE id=?',revision,json(updated),session.branchId);
    this.sql.exec('INSERT INTO operations(branch_id,revision,operation_id,actor,client_id,operation,created_at) VALUES(?,?,?,?,?,?,?)',session.branchId,revision,msg.operationId,session.name,msg.clientId,json(op),now());
    this.broadcast(session.branchId,{type:'operation',operationId:msg.operationId,clientId:msg.clientId,author:session.name,operation:op,revision,rebased:stale});
  }
  handleCommit(ws,msg,session){
    const branch=this.branch(session.branchId);if(!branch.project)return;
    const commit={id:crypto.randomUUID(),branchId:session.branchId,revision:branch.head_revision,message:msg.message||'Model update',author:session.name,createdAt:now()};
    this.sql.exec('INSERT INTO commits(id,branch_id,revision,message,author,created_at,snapshot) VALUES(?,?,?,?,?,?,?)',commit.id,commit.branchId,commit.revision,commit.message,commit.author,commit.createdAt,json(branch.project));
    this.broadcast(session.branchId,{type:'commit',commit,revision:branch.head_revision,commits:this.listCommits(session.branchId)});
  }
  createBranch(ws,msg,session){
    const source=this.branch(session.branchId),id=(msg.branchId||msg.name||'branch').toLowerCase().replace(/[^a-z0-9_-]+/g,'-');
    try{this.sql.exec('INSERT INTO branches(id,name,head_revision,snapshot,created_at,created_by) VALUES(?,?,?,?,?,?)',id,msg.name||id,source.head_revision,source.snapshot,now(),session.name);ws.send(json({type:'branches',branches:this.listBranches()}));}
    catch{ws.send(json({type:'operation-error',message:'Branch already exists or has an invalid name.'}));}
  }

  mergeBranch(ws,msg,session){
    const member=this.member(session.identity,session.name);if(!['owner','editor'].includes(member.role)){ws.send(json({type:'permission-error',message:'Insufficient permission to merge branches.'}));return;}
    let source,target;try{source=this.branch(msg.sourceBranchId);target=this.branch(msg.targetBranchId||session.branchId)}catch(e){ws.send(json({type:'operation-error',message:e.message}));return;}
    if(!source.project){ws.send(json({type:'operation-error',message:'Source branch has no model.'}));return;}
    const merged=this.threeWayMerge(target.project,source.project),revision=target.head_revision+1;merged.revision=revision;merged.branch=target.id;
    this.sql.exec('UPDATE branches SET head_revision=?,snapshot=? WHERE id=?',revision,json(merged),target.id);
    const op={type:'merge-branch',sourceBranchId:source.id,targetBranchId:target.id};this.sql.exec('INSERT INTO operations(branch_id,revision,operation_id,actor,client_id,operation,created_at) VALUES(?,?,?,?,?,?,?)',target.id,revision,crypto.randomUUID(),session.name,session.clientId,json(op),now());
    this.broadcast(target.id,{type:'snapshot',project:merged,revision,branchId:target.id,branches:this.listBranches(),commits:this.listCommits(target.id),presence:this.presence(target.id),role:member.role});
    ws.send(json({type:'merge-result',message:`Merged ${source.id} into ${target.id}`,revision}));
  }
  threeWayMerge(target,source){
    if(!target)return deepClone(source);const out=deepClone(target),mergeById=(key)=>{const map=new Map((out[key]||[]).map(x=>[x.id,x]));for(const item of source[key]||[]){if(!map.has(item.id)){out[key].push(deepClone(item));continue}const existing=map.get(item.id);for(const [k,v] of Object.entries(item))if(k!=='id'&&JSON.stringify(existing[k])===JSON.stringify(target[key]?.find(x=>x.id===item.id)?.[k]))existing[k]=deepClone(v)}};mergeById('elements');mergeById('relationships');mergeById('diagrams');return out;
  }
  setMemberRole(ws,msg,session){const me=this.member(session.identity,session.name);if(me.role!=='owner'){ws.send(json({type:'permission-error',message:'Only the owner may change roles.'}));return;}if(!['owner','editor','viewer'].includes(msg.role)){ws.send(json({type:'operation-error',message:'Invalid role.'}));return;}this.sql.exec('INSERT OR REPLACE INTO members(identity,role,display_name,created_at) VALUES(?,?,COALESCE((SELECT display_name FROM members WHERE identity=?),?),?)',msg.identity,msg.role,msg.identity,msg.identity,now());ws.send(json({type:'members',members:[...this.sql.exec('SELECT identity,role,display_name,created_at FROM members')]}));
  }
  handleLock(ws,msg,session){
    const expires=Date.now()+Math.min(Math.max(Number(msg.ttlMs)||120000,30000),600000),existing=this.activeLock(msg.resourceId);
    if(existing&&existing.owner_identity!==session.identity){ws.send(json({type:'locked',resourceId:msg.resourceId,owner:existing.owner_name}));return;}
    this.sql.exec('INSERT OR REPLACE INTO locks(resource_id,owner_identity,owner_name,expires_at) VALUES(?,?,?,?)',msg.resourceId,session.identity,session.name,expires);this.broadcast(session.branchId,{type:'locks',locks:this.listLocks()});
  }
  activeLock(resourceId){if(!resourceId)return null;this.sql.exec('DELETE FROM locks WHERE expires_at<?',Date.now());return [...this.sql.exec('SELECT * FROM locks WHERE resource_id=?',resourceId)][0]||null;}
  listLocks(){this.sql.exec('DELETE FROM locks WHERE expires_at<?',Date.now());return [...this.sql.exec('SELECT resource_id,owner_name,expires_at FROM locks')];}
  listBranches(){return [...this.sql.exec('SELECT id,name,head_revision,created_at,created_by FROM branches ORDER BY created_at')];}
  listCommits(branchId){return [...this.sql.exec('SELECT id,branch_id,revision,message,author,created_at FROM commits WHERE branch_id=? ORDER BY created_at DESC LIMIT 100',branchId)];}
  presence(branchId){return this.state.getWebSockets().map(x=>x.deserializeAttachment()).filter(x=>x?.clientId&&x.branchId===branchId).map(x=>({clientId:x.clientId,name:x.name,role:x.role,branchId:x.branchId}));}
  broadcast(branchId,message){const data=json(message);for(const ws of this.state.getWebSockets()){const a=ws.deserializeAttachment();if(a?.branchId===branchId)try{ws.send(data)}catch{}}}
  async webSocketClose(ws){const a=ws.deserializeAttachment();if(a?.branchId)this.broadcast(a.branchId,{type:'presence',users:this.presence(a.branchId)})}
  async webSocketError(ws){return this.webSocketClose(ws)}
}
export default{
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname==='/api/health'){
      return Response.json({ok:true,service:'systems-modeler-collaborative',storage:'durable-object-sqlite'});
    }
    if(url.pathname.startsWith('/api/projects/')){
      const parts=url.pathname.split('/').filter(Boolean);
      const projectId=parts[2]||'default';
      const stub=env.PROJECT_ROOMS.getByName
        ? env.PROJECT_ROOMS.getByName(projectId)
        : env.PROJECT_ROOMS.get(env.PROJECT_ROOMS.idFromName(projectId));
      return stub.fetch(request);
    }
    return env.ASSETS.fetch(request);
  }
};

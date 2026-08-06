import {DurableObject} from "cloudflare:workers";
import {applyOperation,canRebaseOperation,deepClone} from '../public/src/operations.js';
import {acceptedOperation,migrateCollaborationOperation,validateCollaborationOperation} from '../public/src/collaboration-operation.js';
import {createRevision} from '../public/src/revision-journal.js';

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
      CREATE TABLE IF NOT EXISTS locks (resource_id TEXT PRIMARY KEY,owner_identity TEXT NOT NULL,owner_name TEXT,expires_at INTEGER NOT NULL,branch_id TEXT NOT NULL DEFAULT 'main');
      CREATE TABLE IF NOT EXISTS revisions (revision_id TEXT PRIMARY KEY,project_id TEXT NOT NULL,branch_id TEXT NOT NULL,sequence INTEGER NOT NULL,parent_revision_ids TEXT NOT NULL,author TEXT NOT NULL,created_at TEXT NOT NULL,message TEXT NOT NULL,operation_ids TEXT NOT NULL,validation_summary TEXT NOT NULL,metadata TEXT NOT NULL,review_id TEXT);
      CREATE TABLE IF NOT EXISTS operation_records (operation_id TEXT PRIMARY KEY,project_id TEXT NOT NULL,branch_id TEXT NOT NULL,revision_id TEXT NOT NULL,sequence INTEGER NOT NULL DEFAULT 0,target_id TEXT,actor_user_id TEXT,status TEXT NOT NULL,record TEXT NOT NULL,created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS snapshots (branch_id TEXT NOT NULL,sequence INTEGER NOT NULL,revision_id TEXT NOT NULL,project TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(branch_id,sequence));
      CREATE TABLE IF NOT EXISTS audit_events (event_id TEXT PRIMARY KEY,event_type TEXT NOT NULL,actor_user_id TEXT,actor_name TEXT,branch_id TEXT,target_id TEXT,created_at TEXT NOT NULL,details TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS idx_operations_branch ON operations(branch_id,revision);
      CREATE INDEX IF NOT EXISTS idx_commits_branch ON commits(branch_id,revision);`);
    const operationColumns=[...this.sql.exec('PRAGMA table_info(operation_records)')].map(column=>column.name);if(!operationColumns.includes('sequence'))this.sql.exec('ALTER TABLE operation_records ADD COLUMN sequence INTEGER NOT NULL DEFAULT 0');if(!operationColumns.includes('target_id'))this.sql.exec('ALTER TABLE operation_records ADD COLUMN target_id TEXT');if(!operationColumns.includes('actor_user_id'))this.sql.exec('ALTER TABLE operation_records ADD COLUMN actor_user_id TEXT');
    this.sql.exec('CREATE INDEX IF NOT EXISTS idx_revisions_branch ON revisions(branch_id,sequence); CREATE INDEX IF NOT EXISTS idx_operation_records_target ON operation_records(branch_id,target_id,sequence); CREATE INDEX IF NOT EXISTS idx_operation_records_actor ON operation_records(branch_id,actor_user_id,sequence); CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_events(created_at);');
    const lockColumns=[...this.sql.exec('PRAGMA table_info(locks)')].map(column=>column.name);
    if(!lockColumns.includes('branch_id'))this.sql.exec("ALTER TABLE locks ADD COLUMN branch_id TEXT NOT NULL DEFAULT 'main'");
    const existing=[...this.sql.exec('SELECT id FROM branches LIMIT 1')];
    if(!existing.length)this.sql.exec('INSERT INTO branches(id,name,head_revision,snapshot,created_at,created_by) VALUES(?,?,?,?,?,?)','main','main',0,null,now(),'system');
    const legacySnapshots=[...this.sql.exec('SELECT id,snapshot FROM branches WHERE snapshot IS NOT NULL')];
    for(const branch of legacySnapshots)this.sql.exec('INSERT OR IGNORE INTO snapshots(branch_id,sequence,revision_id,project,created_at) VALUES(?,?,?,?,?)',branch.id,0,`${branch.id}:0`,branch.snapshot,now());
  }
  identity(request){const authenticated=request.headers.get('Cf-Access-Authenticated-User-Email')||request.headers.get('X-Modeler-User');return{identity:authenticated||'',authenticated:Boolean(authenticated)}}
  async fetch(request){
    const url=new URL(request.url),identity=this.identity(request);
    if(request.headers.get('Upgrade')==='websocket'){
      const pair=new WebSocketPair(),client=pair[0],server=pair[1];
      this.state.acceptWebSocket(server);server.serializeAttachment({identity:identity.identity,authenticated:identity.authenticated,clientId:null,name:identity.identity||'Guest',branchId:'main'});
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
    if(String(raw).length>2_000_000){ws.send(json({type:'operation-error',message:'Collaboration message exceeds the 2 MB safety limit.'}));ws.close(1009,'Message too large');return}
    let msg;try{msg=JSON.parse(raw)}catch{ws.send(json({type:'operation-error',message:'Invalid collaboration message.'}));return}
    const attachment=ws.deserializeAttachment()||{};
    if(msg.type==='hello'){
      const branchId=msg.branchId||'main',identity=attachment.authenticated?attachment.identity:`guest:${String(msg.sessionId||msg.clientId||crypto.randomUUID()).slice(0,128)}`,member=this.member(identity,msg.name);
      ws.serializeAttachment({...attachment,identity,clientId:msg.clientId,name:msg.name||member.display_name,branchId,role:member.role,device:msg.device||{},lastSeen:Date.now()});
      let branch;try{branch=this.branch(branchId)}catch(error){ws.send(json({type:'operation-error',message:error.message}));return}
      if(!branch.project&&msg.initialProject){this.sql.exec('UPDATE branches SET snapshot=? WHERE id=?',json(msg.initialProject),branchId);this.sql.exec('INSERT OR IGNORE INTO snapshots(branch_id,sequence,revision_id,project,created_at) VALUES(?,?,?,?,?)',branchId,0,`${branchId}:0`,json(msg.initialProject),now());branch=this.branch(branchId);}
      ws.send(json({type:'snapshot',project:branch.project,revision:branch.head_revision,branchId,branches:this.listBranches(),commits:this.listCommits(branchId),presence:this.presence(branchId),locks:this.listLocks(branchId),role:member.role}));
      this.broadcast(branchId,{type:'presence',users:this.presence(branchId)});return;
    }
    const session=ws.deserializeAttachment()||attachment,member=this.member(session.identity,session.name);
    ws.serializeAttachment({...session,lastSeen:Date.now()});
    if(msg.type==='ping'){ws.send(json({type:'pong',at:msg.at,serverAt:Date.now()}));return}
    if(msg.type==='resync'){const branch=this.branch(session.branchId);ws.send(json({type:'snapshot',project:branch.project,revision:branch.head_revision,branchId:branch.id,branches:this.listBranches(),commits:this.listCommits(branch.id),presence:this.presence(branch.id),locks:this.listLocks(branch.id),role:member.role}));return}
    if(msg.type==='awareness'){ws.serializeAttachment({...session,lastSeen:Date.now(),awareness:{selectedId:msg.state?.selectedId||null,diagramId:msg.state?.diagramId||null,mode:msg.state?.mode||'modeling'}});this.broadcast(session.branchId,{type:'presence',users:this.presence(session.branchId)});return}
    if(msg.type==='history'){ws.send(json({type:'history',...this.history(session.branchId,msg)}));return}
    if(msg.type==='time-travel'){try{const project=this.projectAtRevision(session.branchId,Number(msg.sequence));ws.send(json({type:'time-travel',project,branchId:session.branchId,sequence:Number(msg.sequence),readOnly:true}))}catch(error){ws.send(json({type:'operation-error',message:error.message}));}return}
    if(member.role==='viewer'&&!['switch-branch'].includes(msg.type)){ws.send(json({type:'permission-error',message:'Viewer role cannot modify the model.'}));return;}
    if(msg.type==='operation'){await this.handleOperation(ws,msg,session);return;}
    if(msg.type==='commit'){this.handleCommit(ws,msg,session);return;}
    if(msg.type==='create-branch'){this.createBranch(ws,msg,session);return;}
    if(msg.type==='merge-branch'){this.mergeBranch(ws,msg,session);return;}
    if(msg.type==='set-member-role'){this.setMemberRole(ws,msg,session);return;}
    if(msg.type==='switch-branch'){let branch;try{branch=this.branch(msg.branchId)}catch(error){ws.send(json({type:'operation-error',message:error.message}));return}ws.serializeAttachment({...session,branchId:msg.branchId});ws.send(json({type:'snapshot',project:branch.project,revision:branch.head_revision,branchId:msg.branchId,branches:this.listBranches(),commits:this.listCommits(msg.branchId),presence:this.presence(msg.branchId),locks:this.listLocks(msg.branchId),role:member.role}));return;}
    if(msg.type==='lock'){this.handleLock(ws,msg,session);return;}
    if(msg.type==='unlock'){this.sql.exec('DELETE FROM locks WHERE resource_id=? AND owner_identity=? AND branch_id=?',this.lockKey(msg.resourceId,session.branchId),session.identity,session.branchId);this.broadcast(session.branchId,{type:'locks',locks:this.listLocks(session.branchId)});return;}
  }
  async handleOperation(ws,msg,session){
    const branch=this.branch(session.branchId),op=msg.operation;
    if(!msg.operationId||!op?.type){ws.send(json({type:'operation-error',operationId:msg.operationId,message:'Operation ID and type are required.'}));return}
    const prior=[...this.sql.exec('SELECT revision,actor,client_id,operation FROM operations WHERE operation_id=?',msg.operationId)][0];
    if(prior){ws.send(json({type:'operation',operationId:msg.operationId,clientId:prior.client_id,author:prior.actor,operation:JSON.parse(prior.operation),revision:prior.revision,duplicate:true}));return}
    const submitted=migrateCollaborationOperation(msg.record||{operation:op,operationId:msg.operationId,clientId:msg.clientId,author:session.name,createdAt:msg.createdAt},{projectId:branch.project?.id||'unknown',branchId:session.branchId,actorUserId:session.identity,actorDisplayName:session.name,clientId:msg.clientId});
    Object.assign(submitted,{projectId:branch.project?.id||submitted.projectId,branchId:session.branchId,actorUserId:session.identity,actorDisplayName:session.name,clientId:msg.clientId,operationId:msg.operationId,operationType:op.type,operation:deepClone(op)});
    const schema=validateCollaborationOperation(submitted,{allowRecovery:['import','merge','recovery'].includes(submitted.source)});if(!schema.ok){ws.send(json({type:'operation-error',operationId:msg.operationId,message:schema.errors.join('; ')}));this.audit('operation-rejected',session,{targetId:submitted.semanticTargetId,errors:schema.errors});return}
    const lock=this.activeLock(op.targetId||op.elementId||op.diagramId||op.relationshipId,session.branchId);
    if(lock&&lock.owner_identity!==session.identity){ws.send(json({type:'locked',resourceId:op.targetId||op.elementId||op.diagramId||op.relationshipId,owner:lock.owner_name,operationId:msg.operationId}));return;}
    const current=branch.project;
    const stale=msg.baseRevision!==branch.head_revision;
    if(stale&&!msg.force&&!canRebaseOperation(current,op)){
      ws.send(json({type:'conflict',revision:branch.head_revision,project:current,operationId:msg.operationId,operation:op,message:'Another user changed the same model value.'}));return;
    }
    let updated;
    try{updated=applyOperation(deepClone(current),op)}catch(error){ws.send(json({type:'operation-error',message:error.message,operationId:msg.operationId}));return;}
    const revision=branch.head_revision+1;updated.revision=revision;updated.branch=session.branchId;
    const revisionId=`${session.branchId}:${revision}`,parentRevisionId=branch.head_revision?`${session.branchId}:${branch.head_revision}`:`${session.branchId}:0`,accepted=acceptedOperation(submitted,{revisionId,parentRevisionId,actorUserId:session.identity,actorDisplayName:session.name,timestamp:now()}),revisionRecord=createRevision({revisionId,projectId:updated.id,branchId:session.branchId,parentRevisionIds:[parentRevisionId],author:{userId:session.identity,displayName:session.name},message:op.type,operationIds:[msg.operationId],metadata:{source:accepted.source,rebased:stale,forced:Boolean(msg.force)}});
    this.sql.exec('UPDATE branches SET head_revision=?,snapshot=? WHERE id=?',revision,json(updated),session.branchId);
    this.sql.exec('INSERT INTO operations(branch_id,revision,operation_id,actor,client_id,operation,created_at) VALUES(?,?,?,?,?,?,?)',session.branchId,revision,msg.operationId,session.name,msg.clientId,json(op),now());
    this.sql.exec('INSERT INTO operation_records(operation_id,project_id,branch_id,revision_id,sequence,target_id,actor_user_id,status,record,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)',msg.operationId,updated.id,session.branchId,revisionId,revision,accepted.semanticTargetId||accepted.presentationTargetId||'',accepted.actorUserId,'accepted',json(accepted),accepted.timestamp);
    this.sql.exec('INSERT INTO revisions(revision_id,project_id,branch_id,sequence,parent_revision_ids,author,created_at,message,operation_ids,validation_summary,metadata,review_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',revisionId,updated.id,session.branchId,revision,json(revisionRecord.parentRevisionIds),json(revisionRecord.author),revisionRecord.createdAt,revisionRecord.message,json(revisionRecord.operationIds),json(revisionRecord.validationSummary),json(revisionRecord.metadata),revisionRecord.reviewId);
    if(revision%50===0)this.sql.exec('INSERT OR REPLACE INTO snapshots(branch_id,sequence,revision_id,project,created_at) VALUES(?,?,?,?,?)',session.branchId,revision,revisionId,json(updated),now());
    this.audit('operation-accepted',session,{targetId:accepted.semanticTargetId,operationId:msg.operationId,revisionId,operationType:op.type});
    this.broadcast(session.branchId,{type:'operation',operationId:msg.operationId,clientId:msg.clientId,author:session.name,operation:op,record:accepted,revision,revisionId,rebased:stale,forced:Boolean(msg.force)});
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
    this.broadcast(target.id,{type:'snapshot',project:merged,revision,branchId:target.id,branches:this.listBranches(),commits:this.listCommits(target.id),presence:this.presence(target.id),locks:this.listLocks(target.id),role:member.role});
    ws.send(json({type:'merge-result',message:`Merged ${source.id} into ${target.id}`,revision}));
  }
  threeWayMerge(target,source){
    if(!target)return deepClone(source);const out=deepClone(target),mergeById=(key)=>{const map=new Map((out[key]||[]).map(x=>[x.id,x]));for(const item of source[key]||[]){if(!map.has(item.id)){out[key].push(deepClone(item));continue}const existing=map.get(item.id);for(const [k,v] of Object.entries(item))if(k!=='id'&&JSON.stringify(existing[k])===JSON.stringify(target[key]?.find(x=>x.id===item.id)?.[k]))existing[k]=deepClone(v)}};mergeById('elements');mergeById('relationships');mergeById('diagrams');return out;
  }
  setMemberRole(ws,msg,session){const me=this.member(session.identity,session.name);if(me.role!=='owner'){ws.send(json({type:'permission-error',message:'Only the owner may change roles.'}));return;}if(!['owner','editor','viewer'].includes(msg.role)){ws.send(json({type:'operation-error',message:'Invalid role.'}));return;}this.sql.exec('INSERT OR REPLACE INTO members(identity,role,display_name,created_at) VALUES(?,?,COALESCE((SELECT display_name FROM members WHERE identity=?),?),?)',msg.identity,msg.role,msg.identity,msg.identity,now());ws.send(json({type:'members',members:[...this.sql.exec('SELECT identity,role,display_name,created_at FROM members')]}));
  }
  handleLock(ws,msg,session){
    const expires=Date.now()+Math.min(Math.max(Number(msg.ttlMs)||120000,30000),600000),existing=this.activeLock(msg.resourceId,session.branchId);
    if(existing&&existing.owner_identity!==session.identity){ws.send(json({type:'locked',resourceId:msg.resourceId,owner:existing.owner_name}));return;}
    this.sql.exec('INSERT OR REPLACE INTO locks(resource_id,owner_identity,owner_name,expires_at,branch_id) VALUES(?,?,?,?,?)',this.lockKey(msg.resourceId,session.branchId),session.identity,session.name,expires,session.branchId);this.broadcast(session.branchId,{type:'locks',locks:this.listLocks(session.branchId)});
  }
  lockKey(resourceId,branchId='main'){return`${branchId}\0${resourceId}`}
  activeLock(resourceId,branchId='main'){if(!resourceId)return null;this.sql.exec('DELETE FROM locks WHERE expires_at<?',Date.now());return [...this.sql.exec('SELECT * FROM locks WHERE resource_id=? AND branch_id=?',this.lockKey(resourceId,branchId),branchId)][0]||null;}
  listLocks(branchId='main'){this.sql.exec('DELETE FROM locks WHERE expires_at<?',Date.now());return [...this.sql.exec('SELECT resource_id,owner_name,expires_at FROM locks WHERE branch_id=?',branchId)].map(lock=>({...lock,resource_id:String(lock.resource_id).split('\0').at(-1)}));}
  listBranches(){return [...this.sql.exec('SELECT id,name,head_revision,created_at,created_by FROM branches ORDER BY created_at')];}
  listCommits(branchId){return [...this.sql.exec('SELECT id,branch_id,revision,message,author,created_at FROM commits WHERE branch_id=? ORDER BY created_at DESC LIMIT 100',branchId)];}
  history(branchId,{cursor=null,limit=100,targetId='',actorUserId=''}={}){const size=Math.min(Math.max(Number(limit)||100,1),250),before=cursor==null?Number.MAX_SAFE_INTEGER:Number(cursor),conditions=['branch_id=?','sequence<?'],params=[branchId,before];if(targetId){conditions.push('target_id=?');params.push(targetId)}if(actorUserId){conditions.push('actor_user_id=?');params.push(actorUserId)}params.push(size);const records=[...this.sql.exec(`SELECT record FROM operation_records WHERE ${conditions.join(' AND ')} ORDER BY sequence DESC LIMIT ?`,...params)].map(row=>JSON.parse(row.record)),nextCursor=records.length===size?Number(String(records.at(-1).revisionId).split(':').at(-1)):null;return{records,nextCursor}}
  projectAtRevision(branchId,sequence){if(!Number.isInteger(sequence)||sequence<0)throw Error('Revision sequence must be a non-negative integer');const head=this.branch(branchId);if(sequence>head.head_revision)throw Error('Revision is newer than the branch head');const snapshot=[...this.sql.exec('SELECT sequence,project FROM snapshots WHERE branch_id=? AND sequence<=? ORDER BY sequence DESC LIMIT 1',branchId,sequence)][0];if(!snapshot)throw Error('No compatible branch snapshot is available');let project=JSON.parse(snapshot.project);for(const row of this.sql.exec('SELECT operation FROM operations WHERE branch_id=? AND revision>? AND revision<=? ORDER BY revision',branchId,snapshot.sequence,sequence))project=applyOperation(project,JSON.parse(row.operation));project.revision=sequence;project.branch=branchId;return project}
  audit(eventType,session,details={}){this.sql.exec('INSERT INTO audit_events(event_id,event_type,actor_user_id,actor_name,branch_id,target_id,created_at,details) VALUES(?,?,?,?,?,?,?,?)',crypto.randomUUID(),eventType,session.identity||'',session.name||'',session.branchId||'main',details.targetId||'',now(),json(details))}
  presence(branchId){return this.state.getWebSockets().map(x=>x.deserializeAttachment()).filter(x=>x?.clientId&&x.branchId===branchId).map(x=>({clientId:x.clientId,name:x.name,role:x.role,branchId:x.branchId,device:x.device||{},awareness:x.awareness||{},lastSeen:x.lastSeen||Date.now()}));}
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

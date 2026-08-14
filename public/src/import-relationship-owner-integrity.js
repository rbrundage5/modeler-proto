const clone=value=>typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));
const dependencyKinds=new Set(['Trace','Dependency','Satisfy','Verify','Refine','DeriveReqt','Copy','Allocate','Usage','Abstraction','Realization']);
const GOVERNANCE_PACKAGE_ID='FSBS.PKG.100';
let wrapped=false,repairing=false,lastFingerprint='';

function api(){return globalThis.SystemsModelerAPI}
function allElements(project){return [project?.root,...(project?.elements||[])].filter(Boolean)}
function byId(project,id){return allElements(project).find(element=>element.id===id)||null}
function qualifiedName(project,id){const parts=[],seen=new Set();let element=byId(project,id);while(element&&!seen.has(element.id)){seen.add(element.id);parts.unshift(element.name||element.id);element=byId(project,element.ownerId)}return parts.join('::')}
function isGovernanceTrace(relationship){const id=String(relationship?.externalId||relationship?.id||''),name=String(relationship?.name||'');return /^FSBS\.REL\.GOV\./i.test(id)||/^trace_GOV[-_]/i.test(name)}
function governanceStableKey(relationship){
  if(!isGovernanceTrace(relationship))return'';
  const externalId=String(relationship.externalId||'').trim();if(/^FSBS\.REL\.GOV\./i.test(externalId))return externalId.toUpperCase();
  const id=String(relationship.id||'').trim();if(/^FSBS\.REL\.GOV\./i.test(id))return id.toUpperCase();
  const match=String(relationship.name||'').trim().toUpperCase().match(/^TRACE_GOV[-_](\d{4})_TO_OWNER$/i);return match?`FSBS.REL.GOV.${match[1]}`:'';
}
function isDescendantOf(project,id,ancestorId,{allowAncestor=false}={}){let current=byId(project,id),seen=new Set();while(current&&!seen.has(current.id)){seen.add(current.id);if(current.id===ancestorId)return allowAncestor||id!==ancestorId;current=byId(project,current.ownerId)}return false}
function governanceOwnerIsValid(project,ownerId){const owner=byId(project,ownerId);return owner?.kind==='Package'&&owner.id!==GOVERNANCE_PACKAGE_ID&&isDescendantOf(project,owner.id,GOVERNANCE_PACKAGE_ID)}
function expectedGovernanceOwner(project,relationship){
  const target=byId(project,relationship.targetId);if(target?.kind==='Package'&&governanceOwnerIsValid(project,target.id))return target;
  const source=byId(project,relationship.sourceId);if(source?.kind!=='Requirement')return null;
  const sourceOwner=byId(project,source.ownerId);if(sourceOwner?.kind==='Package'&&governanceOwnerIsValid(project,sourceOwner.id))return sourceOwner;
  const ownerQN=String(relationship.ownerQualifiedNameString||'').trim();if(ownerQN){const match=(project.elements||[]).find(element=>element.kind==='Package'&&qualifiedName(project,element.id)===ownerQN&&governanceOwnerIsValid(project,element.id));if(match)return match}
  return null;
}
function relationshipScore(project,relationship){let score=0;const key=governanceStableKey(relationship),expected=expectedGovernanceOwner(project,relationship),owner=byId(project,relationship.ownerId);if(key&&String(relationship.externalId||'').toUpperCase()===key)score+=8;if(key&&String(relationship.id||'').toUpperCase()===key)score+=6;if(byId(project,relationship.sourceId)?.kind==='Requirement')score+=4;if(expected&&relationship.ownerId===expected.id)score+=12;if(governanceOwnerIsValid(project,owner?.id))score+=4;if(relationship.importSource)score+=1;return score}
function redirectRelationshipReferences(project,fromId,toId){for(const diagram of project.diagrams||[]){for(const edge of diagram.edges||[])if(edge.relationshipId===fromId)edge.relationshipId=toId;const seen=new Set();diagram.edges=(diagram.edges||[]).filter(edge=>{const key=`${edge.relationshipId||''}:${edge.sourceNodeId||edge.sourceId||''}:${edge.targetNodeId||edge.targetId||''}`;if(seen.has(key))return false;seen.add(key);return true})}for(const relationship of project.relationships||[]){for(const field of ['connectorId','associationId','realizingRelationshipId'])if(relationship[field]===fromId)relationship[field]=toId;if(Array.isArray(relationship.itemFlowIds))relationship.itemFlowIds=[...new Set(relationship.itemFlowIds.map(id=>id===fromId?toId:id))]}}
function dedupeGovernanceRelationships(project){const groups=new Map();for(const relationship of project.relationships||[]){const key=governanceStableKey(relationship);if(!key)continue;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(relationship)}const removed=[];for(const [key,items] of groups){if(items.length<2)continue;const ranked=[...items].sort((a,b)=>relationshipScore(project,b)-relationshipScore(project,a)||String(a.id).localeCompare(String(b.id))),survivor=ranked[0];survivor.externalId=key;if(!String(survivor.id||'').trim())survivor.id=key;for(const duplicate of ranked.slice(1)){redirectRelationshipReferences(project,duplicate.id,survivor.id);removed.push({key,removedId:duplicate.id,survivorId:survivor.id})}const removeIds=new Set(ranked.slice(1).map(item=>item.id));project.relationships=project.relationships.filter(item=>!removeIds.has(item.id))}return removed}

export function repairImportedRelationshipOwners(project){
  if(!project)return{changed:false,repairs:[],deduplicated:[],errors:[]};
  const deduplicated=dedupeGovernanceRelationships(project),repairs=[],errors=[];
  for(const relationship of project.relationships||[]){
    if(!dependencyKinds.has(relationship.kind)||(!relationship.importSource&&!isGovernanceTrace(relationship)))continue;
    if(isGovernanceTrace(relationship)){
      const expected=expectedGovernanceOwner(project,relationship);
      if(!expected){errors.push({relationshipId:relationship.id,message:'Governance relationship has no resolvable owner below FSBS_Model::Governance.'});continue}
      if(relationship.ownerId!==expected.id||!governanceOwnerIsValid(project,relationship.ownerId)){
        const previous=relationship.ownerId||'';relationship.ownerId=expected.id;relationship.ownerQualifiedNameString=qualifiedName(project,expected.id);relationship.qualifiedNameString=`${relationship.ownerQualifiedNameString}::${relationship.name||relationship.externalId||relationship.id}`;repairs.push({relationshipId:relationship.id,from:previous,to:expected.id,reason:'governance-descendant-package'})
      }
      continue
    }
    const source=byId(project,relationship.sourceId);if(source?.kind!=='Requirement')continue;const sourceOwner=byId(project,source.ownerId);if(sourceOwner?.kind!=='Package')continue;const currentOwner=byId(project,relationship.ownerId),rootOwned=relationship.ownerId===project.root?.id,invalidOwner=!currentOwner||currentOwner.kind!=='Package';if(!rootOwned&&!invalidOwner)continue;const previous=relationship.ownerId||'';relationship.ownerId=sourceOwner.id;relationship.ownerQualifiedNameString=qualifiedName(project,sourceOwner.id);relationship.qualifiedNameString=`${relationship.ownerQualifiedNameString}::${relationship.name||relationship.externalId||relationship.id}`;repairs.push({relationshipId:relationship.id,from:previous,to:sourceOwner.id,reason:'invalid-or-root-owner'})
  }
  return{changed:deduplicated.length>0||repairs.length>0,repairs,deduplicated,errors};
}

function log(message,kind='warn'){api()?.log?.(message,kind)}
function repairCurrent(){const service=api();if(repairing||!service?.getProject||!service?.setProject)return false;const current=service.getProject(),next=clone(current),result=repairImportedRelationshipOwners(next);if(result.errors.length)result.errors.forEach(error=>log(`Import ownership error: ${error.relationshipId}: ${error.message}`,'error'));if(!result.changed)return false;repairing=true;try{service.setProject(next);const parts=[];if(result.deduplicated.length)parts.push(`removed ${result.deduplicated.length} duplicate Governance relationship record(s)`);if(result.repairs.length)parts.push(`corrected ${result.repairs.length} relationship owner(s)`);log(`Import integrity repair ${parts.join(' and ')}.`,'warn')}finally{repairing=false}return true}
function ownershipFingerprint(){const p=api()?.getProject?.();if(!p)return'';const keys=new Map();for(const r of p.relationships||[]){const key=governanceStableKey(r);if(key)keys.set(key,(keys.get(key)||0)+1)}const duplicates=[...keys].filter(([,count])=>count>1).map(([key,count])=>`dup:${key}:${count}`),ownership=[];for(const r of p.relationships||[]){if(!isGovernanceTrace(r))continue;const expected=expectedGovernanceOwner(p,r),invalid=!expected||r.ownerId!==expected.id||!governanceOwnerIsValid(p,r.ownerId);if(invalid)ownership.push(`${r.id}:${r.sourceId}:${r.ownerId||''}:${expected?.id||'UNRESOLVED'}`)}return[...duplicates,...ownership].sort().join('|')}
function monitorImports(){setInterval(()=>{const fingerprint=ownershipFingerprint();if(!fingerprint||fingerprint===lastFingerprint)return;lastFingerprint=fingerprint;repairCurrent()},250)}
function wrapSetProject(){const service=api();if(!service?.setProject||wrapped)return false;const original=service.setProject.bind(service);service.setProject=project=>{if(repairing)return original(project);const next=clone(project),result=repairImportedRelationshipOwners(next);if(result.errors.length)result.errors.forEach(error=>log(`Import ownership error: ${error.relationshipId}: ${error.message}`,'error'));const value=original(next);if(result.changed)queueMicrotask(()=>{const parts=[];if(result.deduplicated.length)parts.push(`${result.deduplicated.length} duplicate Governance relationship(s) removed`);if(result.repairs.length)parts.push(`${result.repairs.length} owner(s) normalized`);log(`Import ownership normalization: ${parts.join('; ')}.`,'warn')});return value};wrapped=true;repairCurrent();monitorImports();return true}
function boot(){if(wrapSetProject())return;let attempts=0;const timer=setInterval(()=>{attempts+=1;if(wrapSetProject()||attempts>100)clearInterval(timer)},50)}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();globalThis.addEventListener?.('systems-modeler-ready',boot)}

globalThis.SystemsModelerImportRelationshipOwners={repair:repairImportedRelationshipOwners,repairCurrent,dedupeGovernanceRelationships,governanceOwnerIsValid};

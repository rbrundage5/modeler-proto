const clone=value=>typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));
const dependencyKinds=new Set(['Trace','Dependency','Satisfy','Verify','Refine','DeriveReqt','Copy','Allocate','Usage','Abstraction','Realization']);
let wrapped=false,repairing=false,lastFingerprint='';

function api(){return globalThis.SystemsModelerAPI}
function allElements(project){return [project?.root,...(project?.elements||[])].filter(Boolean)}
function byId(project,id){return allElements(project).find(element=>element.id===id)||null}
function qualifiedName(project,id){const parts=[],seen=new Set();let element=byId(project,id);while(element&&!seen.has(element.id)){seen.add(element.id);parts.unshift(element.name||element.id);element=byId(project,element.ownerId)}return parts.join('::')}
function isGovernanceTrace(relationship){const id=String(relationship?.externalId||relationship?.id||''),name=String(relationship?.name||'');return /^FSBS\.REL\.GOV\./i.test(id)||/^trace_GOV[-_]/i.test(name)}

export function repairImportedRelationshipOwners(project){
  if(!project)return{changed:false,repairs:[]};const repairs=[];
  for(const relationship of project.relationships||[]){
    if(!relationship.importSource||!dependencyKinds.has(relationship.kind))continue;
    const source=byId(project,relationship.sourceId);if(source?.kind!=='Requirement')continue;
    const sourceOwner=byId(project,source.ownerId);if(sourceOwner?.kind!=='Package')continue;
    const currentOwner=byId(project,relationship.ownerId),rootOwned=relationship.ownerId===project.root?.id,invalidOwner=!currentOwner||currentOwner.kind!=='Package',governanceMismatch=isGovernanceTrace(relationship)&&relationship.ownerId!==sourceOwner.id;
    if(!rootOwned&&!invalidOwner&&!governanceMismatch)continue;
    const previous=relationship.ownerId||'';
    relationship.ownerId=sourceOwner.id;
    relationship.ownerQualifiedNameString=qualifiedName(project,sourceOwner.id);
    relationship.qualifiedNameString=`${relationship.ownerQualifiedNameString}::${relationship.name||relationship.externalId||relationship.id}`;
    repairs.push({relationshipId:relationship.id,from:previous,to:sourceOwner.id,reason:governanceMismatch?'governance-source-package':'invalid-or-root-owner'});
  }
  return{changed:repairs.length>0,repairs};
}

function log(message,kind='warn'){api()?.log?.(message,kind)}
function repairCurrent(){
  const service=api();if(repairing||!service?.getProject||!service?.setProject)return false;
  const current=service.getProject(),next=clone(current),result=repairImportedRelationshipOwners(next);if(!result.changed)return false;
  repairing=true;try{service.setProject(next);log(`Repaired ${result.repairs.length} imported relationship owner(s) into their semantic Package owner.`,'warn')}finally{repairing=false}return true;
}

function ownershipFingerprint(){
  const p=api()?.getProject?.();if(!p)return'';
  return(p.relationships||[]).filter(r=>r.importSource&&dependencyKinds.has(r.kind)).map(r=>{
    const source=byId(p,r.sourceId),sourceOwner=source&&byId(p,source.ownerId),invalid=!byId(p,r.ownerId),rootOwned=r.ownerId===p.root?.id,governanceMismatch=isGovernanceTrace(r)&&sourceOwner?.kind==='Package'&&r.ownerId!==sourceOwner.id;
    return invalid||rootOwned||governanceMismatch?`${r.id}:${r.sourceId}:${r.ownerId||''}:${sourceOwner?.id||''}`:'';
  }).filter(Boolean).sort().join('|');
}
function monitorImports(){setInterval(()=>{const fingerprint=ownershipFingerprint();if(!fingerprint||fingerprint===lastFingerprint)return;lastFingerprint=fingerprint;repairCurrent()},250)}

function wrapSetProject(){const service=api();if(!service?.setProject||wrapped)return false;const original=service.setProject.bind(service);service.setProject=project=>{if(repairing)return original(project);const next=clone(project),result=repairImportedRelationshipOwners(next),value=original(next);if(result.changed)queueMicrotask(()=>log(`Import ownership normalization placed ${result.repairs.length} relationship(s) under their semantic Package owner.`,'warn'));return value};wrapped=true;repairCurrent();monitorImports();return true}

function boot(){if(wrapSetProject())return;let attempts=0;const timer=setInterval(()=>{attempts+=1;if(wrapSetProject()||attempts>100)clearInterval(timer)},50)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();window.addEventListener('systems-modeler-ready',boot);

globalThis.SystemsModelerImportRelationshipOwners={repair:repairImportedRelationshipOwners,repairCurrent};

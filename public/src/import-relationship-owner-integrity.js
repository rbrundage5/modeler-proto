const clone=value=>typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));
const dependencyKinds=new Set(['Trace','Dependency','Satisfy','Verify','Refine','DeriveReqt','Copy','Allocate','Usage','Abstraction','Realization']);
let wrapped=false;

function api(){return globalThis.SystemsModelerAPI}
function allElements(project){return [project?.root,...(project?.elements||[])].filter(Boolean)}
function byId(project,id){return allElements(project).find(element=>element.id===id)||null}
function qualifiedName(project,id){const parts=[],seen=new Set();let element=byId(project,id);while(element&&!seen.has(element.id)){seen.add(element.id);parts.unshift(element.name||element.id);element=byId(project,element.ownerId)}return parts.join('::')}

export function repairImportedRelationshipOwners(project){
  if(!project)return{changed:false,repairs:[]};
  const repairs=[];
  for(const relationship of project.relationships||[]){
    if(!relationship.importSource||!dependencyKinds.has(relationship.kind))continue;
    const source=byId(project,relationship.sourceId);if(source?.kind!=='Requirement')continue;
    const sourceOwner=byId(project,source.ownerId);if(sourceOwner?.kind!=='Package')continue;
    const currentOwner=byId(project,relationship.ownerId),rootOwned=relationship.ownerId===project.root?.id,invalidOwner=!currentOwner||currentOwner.kind!=='Package';
    if(!rootOwned&&!invalidOwner)continue;
    const previous=relationship.ownerId||'';
    relationship.ownerId=sourceOwner.id;
    relationship.ownerQualifiedNameString=qualifiedName(project,sourceOwner.id);
    relationship.qualifiedNameString=`${relationship.ownerQualifiedNameString}::${relationship.name||relationship.externalId||relationship.id}`;
    repairs.push({relationshipId:relationship.id,from:previous,to:sourceOwner.id});
  }
  return{changed:repairs.length>0,repairs};
}

function log(message,kind='warn'){api()?.log?.(message,kind)}
function repairCurrent(){const service=api();if(!service?.getProject||!service?.setProject)return false;const current=service.getProject(),next=clone(current),result=repairImportedRelationshipOwners(next);if(!result.changed)return false;service.setProject(next);log(`Repaired ${result.repairs.length} imported Requirement relationship owner(s) into their source Requirement packages.`,'warn');return true}

function wrapSetProject(){const service=api();if(!service?.setProject||wrapped)return false;const original=service.setProject.bind(service);service.setProject=project=>{const next=clone(project),result=repairImportedRelationshipOwners(next);const value=original(next);if(result.changed)queueMicrotask(()=>log(`Import ownership normalization placed ${result.repairs.length} relationship(s) under their semantic Package owner.`,'warn'));return value};wrapped=true;repairCurrent();return true}

function boot(){if(wrapSetProject())return;let attempts=0;const timer=setInterval(()=>{attempts+=1;if(wrapSetProject()||attempts>100)clearInterval(timer)},50)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.addEventListener('systems-modeler-ready',boot);

globalThis.SystemsModelerImportRelationshipOwners={repair:repairImportedRelationshipOwners,repairCurrent};

export const WORKING_COPY_KEY='systems-modeler.v6.2';
const LARGE_MODEL_ENTRY_THRESHOLD=1500;

function projectEntryCount(project){
  return (project?.elements?.length||0)+(project?.relationships?.length||0)+(project?.diagrams||[]).reduce((count,diagram)=>count+(diagram?.nodes?.length||0)+(diagram?.edges?.length||0),0);
}

export function loadWorkingCopy(storage=globalThis.localStorage){
  try{return JSON.parse(storage?.getItem(WORKING_COPY_KEY)||'null')}catch{return null}
}

export function saveWorkingCopy(project,{storage=globalThis.localStorage,onQuota=()=>{}}={}){
  if(projectEntryCount(project)>=LARGE_MODEL_ENTRY_THRESHOLD){
    try{storage?.removeItem(WORKING_COPY_KEY)}catch{}
    const error=new Error('Large project bypassed localStorage working-copy persistence.');error.name='LargeModelPersistenceBypass';
    onQuota(project,error);
    return{stored:false,mode:'indexedDB',error,bypassed:true};
  }
  try{storage?.setItem(WORKING_COPY_KEY,JSON.stringify(project));return{stored:true,mode:'localStorage'}}
  catch(error){
    if(error?.name!=='QuotaExceededError'&&!/quota|exceeded/i.test(String(error?.message||'')))throw error;
    try{storage?.removeItem(WORKING_COPY_KEY)}catch{}
    onQuota(project,error);
    return{stored:false,mode:'indexedDB',error};
  }
}

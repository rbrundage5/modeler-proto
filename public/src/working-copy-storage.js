export const WORKING_COPY_KEY='systems-modeler.v6.2';

export function loadWorkingCopy(storage=globalThis.localStorage){
  try{return JSON.parse(storage?.getItem(WORKING_COPY_KEY)||'null')}catch{return null}
}

export function saveWorkingCopy(project,{storage=globalThis.localStorage,onQuota=()=>{}}={}){
  try{storage?.setItem(WORKING_COPY_KEY,JSON.stringify(project));return{stored:true,mode:'localStorage'}}
  catch(error){
    if(error?.name!=='QuotaExceededError'&&!/quota|exceeded/i.test(String(error?.message||'')))throw error;
    try{storage?.removeItem(WORKING_COPY_KEY)}catch{}
    onQuota(project,error);
    return{stored:false,mode:'indexedDB',error};
  }
}

import {transformAppSource} from './app-source-transform.js';

async function boot(){
  const response=await fetch('/src/app.js',{cache:'no-store'});
  if(!response.ok)throw new Error(`APP_SOURCE_LOAD_FAILED:${response.status}`);
  const transformed=transformAppSource(await response.text());
  const blob=new Blob([transformed],{type:'text/javascript'}),url=URL.createObjectURL(blob);
  try{await import(url)}finally{URL.revokeObjectURL(url)}
}

boot().catch(error=>{
  console.error(error);
  const log=document.getElementById('log');
  if(log){const row=document.createElement('div');row.className='log-entry error';row.textContent=`Application bootstrap failed: ${error.message}`;log.prepend(row)}
});

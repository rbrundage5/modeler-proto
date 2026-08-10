import {dirname,basename,join} from 'node:path';
import {open,rename,rm} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {validateText} from './ipc-contract.mjs';

export async function atomicWrite(destination,content,deps={open,rename,rm}){
  validateText(content);if(typeof destination!=='string'||!destination)throw new TypeError('A user-selected destination is required.');
  const temporary=join(dirname(destination),`.${basename(destination)}.${randomUUID()}.tmp`);let handle;
  try{handle=await deps.open(temporary,'wx',0o600);await handle.writeFile(content,'utf8');await handle.sync();await handle.close();handle=null;await deps.rename(temporary,destination);return destination}
  catch(error){if(handle)await handle.close().catch(()=>{});await deps.rm(temporary,{force:true}).catch(()=>{});throw new Error(`Could not safely save ${basename(destination)}: ${error.message}`,{cause:error})}
}

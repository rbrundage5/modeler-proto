import {processInChunks} from './chunked-work.js';
export async function stageImportRows(rows,applyRow,{chunkSize=2000,signal=null,onProgress=null}={}){const staged=[];await processInChunks(rows,async(row,index)=>{const result=await applyRow(row,index);if(result!==undefined)staged.push(result)},{chunkSize,signal,onProgress});return staged}

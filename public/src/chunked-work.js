// Cooperative chunk runner used by future import/validation/persistence migrations.
// Long jobs yield between chunks so the browser event loop can service input and paint.
const defaultYield=()=>new Promise(resolve=>setTimeout(resolve,0));
export async function processInChunks(items,handler,{chunkSize=1000,yieldControl=defaultYield,signal=null,onProgress=null}={}){const total=items.length;for(let start=0;start<total;start+=chunkSize){if(signal?.aborted)throw new DOMException('Operation aborted','AbortError');const end=Math.min(total,start+chunkSize);for(let i=start;i<end;i++)await handler(items[i],i);onProgress?.({processed:end,total});if(end<total)await yieldControl()}return total}

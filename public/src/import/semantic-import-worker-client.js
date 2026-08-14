let sequence=0;
const cloneOptions=options=>{const {signal,onProgress,downloadReport,...safe}=options||{};return safe};
export function semanticImportInWorker({project,parsed,fileName,options={},signal=null,onProgress=()=>{}}={}){
  return new Promise((resolve,reject)=>{
    if(signal?.aborted)return reject(new DOMException('Import aborted','AbortError'));
    const worker=new Worker('/src/import/semantic-import-worker.js',{type:'module'}),id=`semantic-import-${++sequence}`;
    const cleanup=()=>{worker.terminate();signal?.removeEventListener?.('abort',abort)};
    const abort=()=>{cleanup();reject(new DOMException('Import aborted','AbortError'))};
    signal?.addEventListener?.('abort',abort,{once:true});
    worker.onerror=event=>{cleanup();reject(new Error(event.message||'Semantic import worker failed.'))};
    worker.onmessage=event=>{const message=event.data||{};if(message.id!==id)return;if(message.type==='progress'){onProgress(message.progress||{});return}if(message.type==='complete'){cleanup();resolve(message);return}if(message.type==='error'){cleanup();const error=new Error(message.error||'Semantic import failed.');error.importReport=message.report||null;reject(error)}};
    worker.postMessage({id,project,parsed,fileName,options:cloneOptions(options)});
  });
}
export function semanticImportWorkerContract(){return{semanticTransformOffMainThread:true,moduleWorker:true,transactionalWorkerStage:true,liveCommitAfterWorkerSuccess:true,fullProjectPayloadReturnedOnSuccess:true}}

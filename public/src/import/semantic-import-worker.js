import {importWorkbook} from '../importer.js';

const parsedFile=(name,parsed)=>({name:name||'workbook.xlsx',size:0,type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',lastModified:Date.now(),__parsedWorkbook:parsed,arrayBuffer:async()=>{throw new Error('Worker semantic import must use pre-parsed workbook data.')}});

self.onmessage=async event=>{
  const {id,project,parsed,fileName,options={}}=event.data||{};
  if(!id)return;
  try{
    if(!project||!parsed?.sheets)throw new Error('Semantic import worker requires project and parsed workbook data.');
    const logs=[];
    const log=(message,kind='ok')=>{if(logs.length<2000)logs.push({message:String(message),kind})};
    const report=await importWorkbook(parsedFile(fileName,parsed),project,log,{...options,downloadReport:false,onProgress:progress=>self.postMessage({id,type:'progress',progress})});
    self.postMessage({id,type:'complete',project,report,logs});
  }catch(error){
    self.postMessage({id,type:'error',error:String(error?.message||error),report:error?.importReport||null});
  }
};

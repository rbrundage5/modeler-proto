import {test,expect} from './fixtures.mjs';

test('100k workbook semantic stage stays off the browser main thread',async({page})=>{
  await page.goto('/');
  const result=await page.evaluate(async()=>{
    const {semanticImportInWorker}=await import('/src/import/semantic-import-worker-client.js');
    const rows=Array.from({length:100000},(_,i)=>[`EXT-${i}`,`Element ${i}`]);
    const parsed={sheets:[{name:'Unknown_Scale_Sheet',matrix:[['External ID','Name'],...rows]}]};
    const project={schemaVersion:'3.2',sysmlVersion:'1.6',id:`worker-scale-${crypto.randomUUID()}`,name:'Worker Scale',revision:0,branch:'main',root:{id:'root',externalId:'root',name:'Root',kind:'Model',metaclass:'Model',ownerId:null},elements:[],relationships:[],diagrams:[],metadata:{}};
    let ticks=0,done=false;
    const timer=setInterval(()=>{ticks++},0);
    try{
      const response=await semanticImportInWorker({project,parsed,fileName:'scale.xlsx',options:{strict:true}});
      done=true;
      return{ticks,done,elementCount:response.project.elements.length,errorCount:response.validation?.errorCount??-1};
    }finally{clearInterval(timer)}
  });
  expect(result.done).toBe(true);
  expect(result.ticks).toBeGreaterThan(0);
  expect(result.elementCount).toBe(0);
  expect(result.errorCount).toBe(0);
});

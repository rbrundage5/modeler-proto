import {test,expect} from './fixtures.mjs';

async function readIndexedProject(page,id){return page.evaluate(async projectId=>{const request=indexedDB.open('systems-modeler.projects.db',1);const db=await new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});return new Promise((resolve,reject)=>{const tx=db.transaction('projects','readonly'),req=tx.objectStore('projects').get(projectId);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error)})},id)}

test('large project saves to IndexedDB without expanding the localStorage project registry',async({page})=>{
  await page.goto('/');
  await page.waitForFunction(()=>window.SystemsModelerProjectsReady===true);
  const state=await page.evaluate(()=>{const p=SystemsModelerAPI.getProject();p.name='Large Storage Qualification';p.metadata={...(p.metadata||{}),largeQualification:'x'.repeat(6*1024*1024)};return{id:p.id,name:p.name}});
  await page.locator('#saveProject').click();
  await expect.poll(async()=>Boolean(await readIndexedProject(page,state.id)),{timeout:15000}).toBe(true);
  const stored=await readIndexedProject(page,state.id);
  expect(stored.project.name).toBe(state.name);
  expect(stored.project.metadata.largeQualification.length).toBe(6*1024*1024);
  const local=await page.evaluate(()=>({meta:localStorage.getItem('systems-modeler.projects.meta.v3')||'',old:localStorage.getItem('systems-modeler.projects.v2'),mode:SystemsModelerProjects.storageMode}));
  expect(local.mode).toBe('indexeddb');
  expect(local.old).toBeNull();
  expect(local.meta.length).toBeLessThan(100000);
});

test('legacy v2 project registry migrates into IndexedDB and is removed from localStorage',async({page})=>{
  await page.addInitScript(()=>{const legacy={version:2,projects:[{id:'legacy-project',name:'Legacy Project',createdAt:'2026-01-01T00:00:00.000Z',updatedAt:'2026-01-01T00:00:00.000Z',archived:false,history:[],project:{id:'legacy-project',name:'Legacy Project',root:{id:'root',name:'Root',kind:'Package'},elements:[],relationships:[],diagrams:[]}}]};localStorage.setItem('systems-modeler.projects.v2',JSON.stringify(legacy));localStorage.removeItem('systems-modeler.projects.meta.v3')});
  await page.goto('/');
  await page.waitForFunction(()=>window.SystemsModelerProjectsReady===true);
  await expect.poll(()=>page.evaluate(()=>SystemsModelerProjects.list().some(x=>x.id==='legacy-project'))).toBe(true);
  const stored=await readIndexedProject(page,'legacy-project');
  expect(stored?.project?.name).toBe('Legacy Project');
  expect(await page.evaluate(()=>localStorage.getItem('systems-modeler.projects.v2'))).toBeNull();
});

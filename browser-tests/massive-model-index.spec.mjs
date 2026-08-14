import {test,expect} from './fixtures.mjs';

test('massive repository uses indexed element and relationship lookup',async({page})=>{
  await page.goto('/');
  const result=await page.evaluate(async()=>{
    const model=await import('/src/model.js');
    const indexModule=await import('/src/model-index.js');
    const count=100000;
    const project={root:{id:'root',externalId:'root',name:'Root',kind:'Model'},elements:Array.from({length:count},(_,i)=>({id:`e-${i}`,externalId:`EXT-${i}`,name:`Element ${i}`,ownerId:'root',kind:'Block'})),relationships:Array.from({length:count},(_,i)=>({id:`r-${i}`,sourceId:`e-${i}`,targetId:`e-${(i+1)%count}`})),diagrams:[]};
    indexModule.buildProjectIndex(project);
    const started=performance.now();
    let checksum=0;
    for(let i=0;i<20000;i++){const n=(i*7919)%count;if(model.findElement(project,`e-${n}`))checksum++;if(model.findRelationship(project,`r-${n}`))checksum++}
    const elapsed=performance.now()-started;
    const stats=indexModule.indexStats(project);
    return{checksum,elapsed,stats};
  });
  expect(result.checksum).toBe(40000);
  expect(result.stats.elements).toBe(100001);
  expect(result.stats.relationships).toBe(100000);
  // Deliberately generous CI ceiling: this catches accidental O(n) lookup regressions
  // without turning the qualification into a machine-speed benchmark.
  expect(result.elapsed).toBeLessThan(3000);
});

test('index provides owner, endpoint, and presentation adjacency without repository scans',async({page})=>{
  await page.goto('/');
  const result=await page.evaluate(async()=>{
    const m=await import('/src/model-index.js');
    const project={root:{id:'root'},elements:[{id:'a',ownerId:'root'},{id:'b',ownerId:'a'}],relationships:[{id:'r',sourceId:'a',targetId:'b'}],diagrams:[{id:'d',nodes:[{id:'n',elementId:'b'}],edges:[]}]};
    m.buildProjectIndex(project);
    return{children:m.indexedChildren(project,'a').map(x=>x.id),rels:m.indexedRelationshipsFor(project,'b').map(x=>x.id),presentations:m.indexedPresentationsFor(project,'b').map(x=>x.diagram.id)};
  });
  expect(result.children).toEqual(['b']);
  expect(result.rels).toEqual(['r']);
  expect(result.presentations).toEqual(['d']);
});

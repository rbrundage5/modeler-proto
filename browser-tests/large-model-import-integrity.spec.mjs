import {test,expect} from './fixtures.mjs';

test('large-model import layer preserves unrelated existing diagrams by stable identity',async({page})=>{
  await page.goto('/');
  await page.waitForFunction(()=>Boolean(window.SystemsModelerLargeModelImport&&window.SystemsModelerProjectsReady));
  const result=await page.evaluate(()=>{
    const before={activeDiagramId:'existing-id',diagrams:[{id:'existing-id',externalId:'EXISTING.DGM.1',name:'Incoming Stable ID',diagramType:'Block Definition Diagram',ownerId:'root',contextId:'root',nodes:[{id:'n1',elementId:'e1'}],edges:[]}]};
    const after={activeDiagramId:'incoming-id',diagrams:[{id:'existing-id',externalId:'EXISTING.DGM.1',name:'__existing_diagram_existing-id',diagramType:'Block Definition Diagram',ownerId:'wrong',contextId:'wrong',nodes:[],edges:[]},{id:'incoming-id',externalId:'Incoming Stable ID',name:'Imported Diagram',diagramType:'Block Definition Diagram',ownerId:'root',contextId:'root',nodes:[],edges:[]}]};
    const intent={diagramIds:new Set(['Incoming Stable ID'])};
    const restored=SystemsModelerLargeModelImport.preserveExistingDiagrams(before,after,intent);
    return{restored,active:after.activeDiagramId,existing:after.diagrams.find(d=>d.id==='existing-id'),incoming:after.diagrams.find(d=>d.id==='incoming-id')};
  });
  expect(result.restored).toBe(1);
  expect(result.active).toBe('existing-id');
  expect(result.existing.name).toBe('Incoming Stable ID');
  expect(result.existing.ownerId).toBe('root');
  expect(result.existing.nodes).toHaveLength(1);
  expect(result.incoming.name).toBe('Imported Diagram');
});

test('large models bypass the legacy full-project localStorage working copy',async({page})=>{
  await page.goto('/');
  await page.waitForFunction(()=>window.SystemsModelerProjectsReady===true);
  const outcome=await page.evaluate(async()=>{
    const module=await import('/src/working-copy-storage.js');
    let writes=0,removed=0,fallbacks=0;
    const storage={setItem(){writes++},removeItem(){removed++},getItem(){return null}};
    const project={elements:Array.from({length:1600},(_,i)=>({id:`e${i}`})),relationships:[],diagrams:[]};
    const result=module.saveWorkingCopy(project,{storage,onQuota:()=>fallbacks++});
    return{writes,removed,fallbacks,stored:result.stored,mode:result.mode,bypassed:result.bypassed};
  });
  expect(outcome.writes).toBe(0);
  expect(outcome.removed).toBe(1);
  expect(outcome.fallbacks).toBe(1);
  expect(outcome.stored).toBe(false);
  expect(outcome.mode).toBe('indexedDB');
  expect(outcome.bypassed).toBe(true);
});

test('large-model mode collapses top-level package branches instead of rendering the entire repository expanded',async({page})=>{
  await page.goto('/');
  await page.waitForFunction(()=>Boolean(window.SystemsModelerLargeModelImport));
  const result=await page.evaluate(()=>{
    const project={root:{id:'root'},elements:[{id:'pkg-a',ownerId:'root',kind:'Package'},{id:'pkg-b',ownerId:'root',kind:'Package'},...Array.from({length:1500},(_,i)=>({id:`e${i}`,ownerId:'pkg-a',kind:'Block'}))],relationships:[],diagrams:[],uiState:{collapsedTreeIds:[]}};
    const enabled=SystemsModelerLargeModelImport.optimizeContainmentForScale(project);
    return{enabled,collapsed:project.uiState.collapsedTreeIds,hints:project.performanceHints};
  });
  expect(result.enabled).toBe(true);
  expect(result.collapsed).toEqual(expect.arrayContaining(['pkg-a','pkg-b']));
  expect(result.hints.largeModel).toBe(true);
});

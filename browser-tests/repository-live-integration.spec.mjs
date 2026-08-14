import {test,expect} from './fixtures.mjs';

test('live Model repository stays DOM-bounded with 100k semantic elements',async({page})=>{
  await page.goto('/');
  await page.waitForFunction(()=>window.SystemsModelerAPI&&window.SystemsModelerRepository);
  await page.evaluate(()=>{
    const root={id:'root',externalId:'root',name:'Massive Model',kind:'Model',metaclass:'Model',ownerId:null};
    const elements=Array.from({length:100000},(_,i)=>({id:`e-${i}`,externalId:`EXT-${i}`,name:`Element ${String(i).padStart(6,'0')}`,kind:'Block',metaclass:'Class',ownerId:'root',compartments:{},compartmentVisibility:{}}));
    window.SystemsModelerAPI.setProject({schemaVersion:'3.2',sysmlVersion:'1.6',id:'massive',name:'Massive',revision:1,branch:'main',root,elements,relationships:[],diagrams:[],activeDiagramId:null,commits:[],metadata:{}});
    window.SystemsModelerRepository.mode='model';
    window.SystemsModelerRepository.refresh(true);
  });
  const tree=page.locator('#virtualTree');
  await expect(tree).toHaveAttribute('data-logical-rows','100001');
  expect(await tree.locator('.tree-row').count()).toBeLessThanOrEqual(160);
  await tree.evaluate(node=>node.scrollTop=2_000_000);
  await page.waitForTimeout(50);
  expect(await tree.locator('.tree-row').count()).toBeLessThanOrEqual(160);
  expect(await tree.locator('.tree-row').first().getAttribute('data-id')).not.toBe('root');
});

test('live repository preserves selection, collapse, and diagram tabs',async({page})=>{
  await page.goto('/');
  await page.waitForFunction(()=>window.SystemsModelerAPI&&window.SystemsModelerRepository);
  await page.evaluate(()=>{
    const p=window.SystemsModelerAPI.createBlankProject('Repository UX');
    p.elements.push({id:'pkg',externalId:'pkg',name:'Package A',kind:'Package',metaclass:'Package',ownerId:p.root.id,compartments:{},compartmentVisibility:{}},{id:'block',externalId:'block',name:'Block A',kind:'Block',metaclass:'Class',ownerId:'pkg',compartments:{},compartmentVisibility:{}});
    p.diagrams.push({id:'d1',externalId:'d1',name:'BDD A',diagramType:'Block Definition Diagram',ownerId:'pkg',contextId:'pkg',nodes:[],edges:[]});p.activeDiagramId='d1';
    window.SystemsModelerAPI.setProject(p);window.SystemsModelerRepository.refresh(true);
  });
  await page.locator('#virtualTree .tree-row[data-id="pkg"]').click();
  await expect.poll(()=>page.evaluate(()=>window.SystemsModelerAPI.getSelection().id)).toBe('pkg');
  await page.locator('#virtualTree .tree-row[data-id="pkg"] .tree-disclosure').click();
  await expect(page.locator('#virtualTree .tree-row[data-id="block"]')).toHaveCount(0);
  await page.locator('#diagramTab').click();
  await expect(page.locator('#virtualTree .tree-row[data-id="d1"]')).toHaveCount(1);
});

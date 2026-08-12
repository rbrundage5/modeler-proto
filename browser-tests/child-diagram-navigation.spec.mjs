import {test,expect} from './fixtures.mjs';

test('element with child diagram shows navigation glyph and double click opens child',async({page})=>{
  await page.goto('/');
  await page.waitForFunction(()=>Boolean(window.SystemsModelerAPI&&window.SystemsModelerChildDiagrams));
  const ids=await page.evaluate(()=>{
    const p=structuredClone(SystemsModelerAPI.getProject()),root=p.root.id;
    const block={id:'nav-block',externalId:'NAV-BLOCK',kind:'Block',metaclass:'Class',stereotype:'block',name:'ParentBlock',ownerId:root,documentation:'',compartments:{},compartmentVisibility:{}};
    p.elements.push(block);
    const parent={id:'nav-parent',externalId:'NAV-DGM-PARENT',name:'Parent BDD',diagramType:'Block Definition Diagram',ownerId:root,contextId:root,nodes:[{id:'nav-node',elementId:block.id,x:120,y:120,width:220,height:120}],edges:[]};
    const child={id:'nav-child',externalId:'NAV-DGM-CHILD',name:'ParentBlock IBD',diagramType:'Internal Block Diagram',ownerId:root,contextId:block.id,nodes:[],edges:[]};
    p.diagrams=[parent,child,...(p.diagrams||[]).filter(d=>!['nav-parent','nav-child'].includes(d.id))];
    p.activeDiagramId=parent.id;
    SystemsModelerAPI.setProject(p);
    return{parent:parent.id,child:child.id,block:block.id};
  });
  await expect(page.locator(`#canvas g.node[data-semantic-id="${ids.block}"] .child-diagram-glyph`)).toBeVisible();
  await expect(page.locator(`#canvas .child-diagram-glyph[data-child-diagram-id="${ids.child}"]`)).toHaveCount(1);
  await page.locator(`#canvas g.node[data-semantic-id="${ids.block}"]`).dblclick({position:{x:70,y:45}});
  await expect(page.locator('#diagramSelect')).toHaveValue(ids.child);
});

test('glyph is absent when an element has no child diagram',async({page})=>{
  await page.goto('/');
  await page.waitForFunction(()=>Boolean(window.SystemsModelerAPI&&window.SystemsModelerChildDiagrams));
  const id=await page.evaluate(()=>{
    const p=structuredClone(SystemsModelerAPI.getProject()),root=p.root.id;
    const block={id:'leaf-block',externalId:'LEAF-BLOCK',kind:'Block',metaclass:'Class',stereotype:'block',name:'LeafBlock',ownerId:root,documentation:'',compartments:{},compartmentVisibility:{}};
    p.elements.push(block);
    const parent={id:'leaf-parent',externalId:'LEAF-DGM',name:'Leaf BDD',diagramType:'Block Definition Diagram',ownerId:root,contextId:root,nodes:[{id:'leaf-node',elementId:block.id,x:120,y:120,width:220,height:120}],edges:[]};
    p.diagrams=[parent,...(p.diagrams||[]).filter(d=>d.id!==parent.id)];p.activeDiagramId=parent.id;SystemsModelerAPI.setProject(p);return block.id;
  });
  await expect(page.locator(`#canvas g.node[data-semantic-id="${id}"]`)).toBeVisible();
  await expect(page.locator(`#canvas g.node[data-semantic-id="${id}"] .child-diagram-glyph`)).toHaveCount(0);
});

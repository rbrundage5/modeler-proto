import {test,expect} from './fixtures.mjs';

test('selecting a diagram in Diagrams tab keeps diagram-only repository content',async({page})=>{
  await page.goto('/');
  await page.waitForFunction(()=>Boolean(window.SystemsModelerAPI&&window.SystemsModelerRepositoryDiagramInteractions));
  await page.evaluate(()=>{
    const p=SystemsModelerAPI.getProject(),owner=p.root.id;
    p.diagrams=[
      {id:'TAB-DGM-1',externalId:'TAB-DGM-1',name:'First Diagram',diagramType:'Block Definition Diagram',ownerId:owner,contextId:owner,nodes:[],edges:[]},
      {id:'TAB-DGM-2',externalId:'TAB-DGM-2',name:'Second Diagram',diagramType:'Requirement Diagram',ownerId:owner,contextId:owner,nodes:[],edges:[]}
    ];p.activeDiagramId='TAB-DGM-1';SystemsModelerAPI.setProject(p);
  });
  await page.locator('#diagramTab').click();
  await expect(page.locator('#diagramTab')).toHaveClass(/active/);
  await expect(page.locator('#tree .tree-row[data-type="diagram"]')).toHaveCount(2);
  await page.locator('#tree .tree-row[data-type="diagram"][data-id="TAB-DGM-2"]').click();
  await expect(page.locator('#diagramTab')).toHaveClass(/active/);
  await expect(page.locator('#tree .tree-row[data-type="diagram"]')).toHaveCount(2);
  await expect(page.locator('#tree .tree-row[data-type="element"]')).toHaveCount(0);
  await expect.poll(()=>page.evaluate(()=>SystemsModelerAPI.getProject().activeDiagramId)).toBe('TAB-DGM-2');
});

test('rapid double click on canvas presentation opens child diagram despite node rerender',async({page})=>{
  await page.goto('/');
  await page.waitForFunction(()=>Boolean(window.SystemsModelerAPI&&window.SystemsModelerRepositoryDiagramInteractions));
  await page.evaluate(()=>{
    const p=SystemsModelerAPI.getProject(),owner=p.root.id;
    const block={id:'CANVAS-PARENT',externalId:'CANVAS-PARENT',kind:'Block',metaclass:'Class',stereotype:'SysML::Block',name:'Parent Block',ownerId:owner,childDiagramIds:['CANVAS-CHILD'],primaryChildDiagramId:'CANVAS-CHILD'};
    const parent={id:'CANVAS-PARENT-DGM',externalId:'CANVAS-PARENT-DGM',name:'Parent BDD',diagramType:'Block Definition Diagram',ownerId:owner,contextId:owner,nodes:[{id:'CANVAS-NODE',elementId:block.id,x:180,y:150,width:220,height:120}],edges:[]};
    const child={id:'CANVAS-CHILD',externalId:'CANVAS-CHILD',name:'Child IBD',diagramType:'Internal Block Diagram',ownerId:owner,contextId:block.id,nodes:[],edges:[]};
    p.elements.push(block);p.diagrams.push(parent,child);p.activeDiagramId=parent.id;SystemsModelerAPI.setProject(p);
  });
  const node=page.locator('#canvas g.node[data-semantic-id="CANVAS-PARENT"]');
  await expect(node).toHaveCount(1);
  const box=await node.boundingBox();
  await page.mouse.dblclick(box.x+box.width/2,box.y+box.height/2,{delay:80});
  await expect.poll(()=>page.evaluate(()=>SystemsModelerAPI.getProject().activeDiagramId)).toBe('CANVAS-CHILD');
});

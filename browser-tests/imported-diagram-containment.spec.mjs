import {test,expect} from './fixtures.mjs';

test('owned diagrams appear beneath their Package in the Model tree and open from containment',async({page})=>{
  await page.goto('/');
  await page.evaluate(()=>{
    const p=SystemsModelerAPI.createBlankProject('Diagram Containment');
    const pkg={id:'pkg-bdd',externalId:'PKG-BDD',kind:'Package',metaclass:'Package',stereotype:'',name:'BDD',ownerId:p.root.id,documentation:'',compartments:{},compartmentVisibility:{}};
    const block={id:'blk',externalId:'BLK',kind:'Block',metaclass:'Class',stereotype:'block',name:'System',ownerId:pkg.id,documentation:'',compartments:{},compartmentVisibility:{}};
    p.elements=[pkg,block];
    p.diagrams=[{id:'dgm',externalId:'DGM',name:'System BDD',diagramType:'Block Definition Diagram',ownerId:pkg.id,contextId:block.id,nodes:[{id:'n1',elementId:block.id,x:120,y:120,width:190,height:110}],edges:[]}];
    p.activeDiagramId='dgm';
    SystemsModelerAPI.setProject(p);
  });
  await page.getByRole('button',{name:'Model',exact:true}).click();
  await page.evaluate(()=>SystemsModelerImportSafety.renderOwnedDiagramContainment());
  const owner=page.locator('.tree-row[data-type="element"][data-id="pkg-bdd"]');
  await expect(owner).toContainText('BDD');
  const diagram=page.locator('.owned-diagram-tree-row[data-id="dgm"]');
  await expect(diagram).toBeVisible();
  await expect(diagram).toContainText('System BDD');
  await expect(diagram).toContainText('Block Definition Diagram');
  expect(Number(await diagram.evaluate(el=>parseFloat(el.style.paddingLeft)))).toBeGreaterThan(Number(await owner.evaluate(el=>parseFloat(el.style.paddingLeft))));
  await diagram.click();
  await expect(page.locator('#diagramSelect')).toHaveValue('dgm');
  await expect(page.locator('#diagramTitle')).toHaveText('System BDD');
});

test('owned diagram rows disappear when their owner Package is collapsed',async({page})=>{
  await page.goto('/');
  await page.evaluate(()=>{
    const p=SystemsModelerAPI.createBlankProject('Collapsed Diagram Containment');
    const pkg={id:'pkg',externalId:'PKG',kind:'Package',metaclass:'Package',stereotype:'',name:'Behavior',ownerId:p.root.id,documentation:'',compartments:{},compartmentVisibility:{}};
    const activity={id:'act',externalId:'ACT',kind:'Activity',metaclass:'Activity',stereotype:'',name:'Operate',ownerId:pkg.id,documentation:'',compartments:{},compartmentVisibility:{}};
    p.elements=[pkg,activity];p.diagrams=[{id:'ad',externalId:'AD',name:'Operate Activity',diagramType:'Activity Diagram',ownerId:pkg.id,contextId:activity.id,nodes:[],edges:[]}];p.activeDiagramId='ad';SystemsModelerAPI.setProject(p);
  });
  await page.getByRole('button',{name:'Model',exact:true}).click();
  await page.evaluate(()=>SystemsModelerImportSafety.renderOwnedDiagramContainment());
  await expect(page.locator('.owned-diagram-tree-row[data-id="ad"]')).toBeVisible();
  await page.locator('.tree-row[data-id="pkg"] .tree-disclosure').click();
  await page.evaluate(()=>SystemsModelerImportSafety.renderOwnedDiagramContainment());
  await expect(page.locator('.owned-diagram-tree-row[data-id="ad"]')).toHaveCount(0);
});

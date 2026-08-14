import {test,expect} from './fixtures.mjs';

async function blankDiagram(page,diagramType,contextKind='Package'){
  await page.goto('/');
  await page.evaluate(({diagramType,contextKind})=>{
    const p=SystemsModelerAPI.createBlankProject('Remaining element qualification'),root=p.root.id;
    let contextId=root;
    if(contextKind!=='Model'){
      const context={id:'context',externalId:'CTX-1',kind:contextKind,metaclass:contextKind,name:'Context',ownerId:root,compartments:{},compartmentVisibility:{}};
      p.elements=[context];contextId=context.id;
    }
    p.diagrams=[{id:'diagram',name:'Qualification',diagramType,ownerId:contextId,contextId,nodes:[],edges:[]}];p.activeDiagramId='diagram';SystemsModelerAPI.setProject(p);
  },{diagramType,contextKind});
}

test('Profile is manually creatable and editable on a Package Diagram',async({page})=>{
  await blankDiagram(page,'Package Diagram','Package');
  await page.locator('[data-tool="Profile"]').click();
  await page.locator('#canvas').click({position:{x:420,y:240}});
  const profile=await page.evaluate(()=>SystemsModelerAPI.getProject().elements.find(item=>item.kind==='Profile'));
  expect(profile).toBeTruthy();
  await expect(page.locator(`[data-semantic-id="${profile.id}"]`)).toBeVisible();
  await page.locator(`[data-semantic-id="${profile.id}"]`).click();
  const name=page.locator('#properties input').first();await name.fill('Domain Profile');await name.blur();
  expect(await page.evaluate(id=>SystemsModelerAPI.getProject().elements.find(item=>item.id===id)?.name,profile.id)).toBe('Domain Profile');
});

test('Activity is a qualified Requirement Diagram presentation',async({page})=>{
  await blankDiagram(page,'Requirement Diagram','Package');
  await page.locator('[data-tool="Activity"]').click();
  await page.locator('#canvas').click({position:{x:450,y:260}});
  const activity=await page.evaluate(()=>SystemsModelerAPI.getProject().elements.find(item=>item.kind==='Activity'));
  expect(activity).toBeTruthy();
  await expect(page.locator(`[data-semantic-id="${activity.id}"]`)).toBeVisible();
});

test('Lifeline, CombinedFragment, and InteractionUse retain specialized Sequence presentations',async({page})=>{
  await page.goto('/');
  await page.evaluate(()=>{
    const p=SystemsModelerAPI.createBlankProject('Sequence qualification'),root=p.root.id;
    p.elements=[{id:'interaction',externalId:'INT-1',kind:'Interaction',metaclass:'Interaction',name:'Nominal',ownerId:root,compartments:{},compartmentVisibility:{}}];
    p.diagrams=[{id:'seq',name:'Nominal',diagramType:'Sequence Diagram',ownerId:'interaction',contextId:'interaction',nodes:[],edges:[]}];p.activeDiagramId='seq';SystemsModelerAPI.setProject(p);
  });
  for(const [tool,position] of [['CombinedFragment',{x:220,y:240}],['InteractionUse',{x:650,y:300}]]){
    await page.locator(`[data-tool="${tool}"]`).click();await page.locator('#canvas').click({position});
  }
  const kinds=await page.evaluate(()=>SystemsModelerAPI.getProject().elements.filter(item=>['CombinedFragment','InteractionUse'].includes(item.kind)).map(item=>item.kind));
  expect(kinds.sort()).toEqual(['CombinedFragment','InteractionUse']);
  await expect(page.locator('.sequence-fragment')).toHaveCount(1);
  await expect(page.locator('.interaction-use')).toHaveCount(1);
});

test('UseCase ExtensionPoint is created as an owned element and rendered in the UML compartment',async({page})=>{
  await page.goto('/');
  await page.evaluate(()=>{
    const p=SystemsModelerAPI.createBlankProject('Use Case qualification'),root=p.root.id,useCase={id:'uc',externalId:'UC-1',kind:'UseCase',metaclass:'UseCase',name:'Authenticate',ownerId:root,compartments:{},compartmentVisibility:{}};
    p.elements=[useCase];p.diagrams=[{id:'ucd',name:'Use Cases',diagramType:'Use Case Diagram',ownerId:root,contextId:root,nodes:[{id:'uc-node',elementId:'uc',x:260,y:180,width:260,height:150}],edges:[]}];p.activeDiagramId='ucd';SystemsModelerAPI.setProject(p);
  });
  await page.locator('[data-presentation-id="uc-node"]').click();
  await page.getByRole('button',{name:'+ Extension Point'}).first().click();
  const extension=await page.evaluate(()=>SystemsModelerAPI.getProject().elements.find(item=>item.kind==='ExtensionPoint'));
  expect(extension).toBeTruthy();expect(extension.ownerId).toBe('uc');
  await expect(page.locator('.uml-extension-points')).toBeVisible();
  await expect(page.locator('.uml-extension-points')).toContainText('extension points');
});

import {test,expect} from './fixtures.mjs';

async function blankBdd(page){await page.goto('/');await page.evaluate(()=>{const p=SystemsModelerAPI.createBlankProject('Structural Typing');p.diagrams=[{id:'bdd',name:'Typing BDD',diagramType:'Block Definition Diagram',ownerId:p.root.id,contextId:p.root.id,nodes:[],edges:[]}];p.activeDiagramId='bdd';SystemsModelerAPI.setProject(p)})}
async function createAt(page,kind,x,y){const tool=page.locator(`[data-tool="${kind}"]`);await expect(tool).toHaveAttribute('data-support','complete');await tool.focus();await page.keyboard.press('Enter');await page.locator('#canvas').click({position:{x,y}});return page.locator(`[data-semantic-kind="${kind}"]`).last()}
async function identityName(page,value){const input=page.getByRole('region',{name:'Properties'}).getByLabel('Name',{exact:true});await input.fill(value);await input.blur()}

test('structural typing production workflow creates, edits, types, resizes, saves, reloads, and deletes independently',async({page})=>{
  test.setTimeout(60000);
  await blankBdd(page);
  const data=await createAt(page,'DataType',120,120);await data.click();await identityName(page,'Real');
  const value=await createAt(page,'ValueType',380,120);await value.click();await identityName(page,'Mass');
  await expect(page.locator('#properties .section').filter({hasText:'Value Type Semantics'})).toBeVisible();
  const block=await createAt(page,'Block',650,140);await block.click();await identityName(page,'Vehicle');
  await page.getByRole('button',{name:'+ ValueProperty'}).click();await identityName(page,'mass');
  const feature=page.locator('#properties .section').filter({hasText:'Semantic Feature'});const typeSelect=feature.locator('label.field').filter({hasText:'Type'}).locator('select');const typeValue=await typeSelect.locator('option').filter({hasText:'Mass'}).getAttribute('value');await typeSelect.selectOption(typeValue);
  await feature.locator('label.compact-field').filter({hasText:'Lower'}).locator('input').fill('0');await feature.locator('label.compact-field').filter({hasText:'Upper'}).locator('input').fill('*');await feature.locator('label.compact-field').filter({hasText:'Upper'}).locator('input').blur();
  await feature.locator('label.field').filter({hasText:'Default value'}).locator('input').fill('10');await feature.locator('label.field').filter({hasText:'Default value'}).locator('input').blur();
  await block.click();await expect(page.locator('#properties .compartment-item',{hasText:'mass'})).toBeVisible();
  const geometry=page.locator('#properties .section').filter({hasText:'Diagram Presentation'});await geometry.locator('label.field').filter({hasText:'Width'}).locator('input').fill('320');await geometry.locator('label.field').filter({hasText:'Width'}).locator('input').blur();await geometry.locator('label.field').filter({hasText:'Height'}).locator('input').fill('220');await geometry.locator('label.field').filter({hasText:'Height'}).locator('input').blur();
  await expect(block.locator('text=values')).toBeVisible();await expect(block.locator('text=mass')).toBeVisible();await page.screenshot({path:'/tmp/e01s2-structural-typing.png',fullPage:true});
  const state=await page.evaluate(()=>{const p=SystemsModelerAPI.getProject(),property=p.elements.find(e=>e.kind==='ValueProperty');return{propertyId:property.id,typeRef:property.typeRef,typeId:p.elements.find(e=>e.kind==='ValueType').id}});expect(state.typeRef).toBe(state.typeId);
  await page.locator('#undo').click();await page.locator('#redo').click();await page.locator('#saveProject').click();await page.reload();await page.waitForFunction(()=>window.SystemsModelerAPI);expect(await page.evaluate(id=>{const p=SystemsModelerAPI.getProject(),e=p.elements.find(x=>x.id===id);return{id:e.id,typeRef:e.typeRef,multiplicity:e.multiplicity,defaultValue:e.defaultValue}},state.propertyId)).toEqual({id:state.propertyId,typeRef:state.typeId,multiplicity:'0..*',defaultValue:'10'});
  await page.locator('[data-semantic-kind="DataType"]').click();await page.locator('#deleteSelected').click();expect(await page.evaluate(()=>SystemsModelerAPI.getProject().elements.some(e=>e.kind==='DataType'))).toBe(true);
  await page.locator('[data-semantic-kind="Block"]').click();await page.locator('#properties .compartment-item',{hasText:'mass'}).click();page.once('dialog',dialog=>dialog.accept());await page.locator('#deleteSelected').click();expect(await page.evaluate(()=>SystemsModelerAPI.getProject().elements.some(e=>e.kind==='ValueProperty'))).toBe(false);
});

test('production JSON open is deterministic and accessible validation is field specific',async({page})=>{
  await page.goto('/');const project=await page.evaluate(()=>{const p=SystemsModelerAPI.createBlankProject('Imported typing');p.elements.push({id:'data',externalId:'data',kind:'DataType',name:'Real',ownerId:p.root.id},{id:'value',externalId:'value',kind:'ValueType',name:'Mass',ownerId:p.root.id},{id:'block',externalId:'block',kind:'Block',name:'Vehicle',ownerId:p.root.id},{id:'property',externalId:'property',kind:'ValueProperty',name:'mass',ownerId:'block',typeRef:'value'});p.diagrams=[{id:'bdd',name:'BDD',diagramType:'Block Definition Diagram',ownerId:p.root.id,contextId:p.root.id,nodes:[],edges:[]}];p.activeDiagramId='bdd';return p});
  const json=JSON.stringify(project);for(let run=0;run<2;run++){await page.locator('#fileInput').setInputFiles({name:'typing.sysml.json',mimeType:'application/json',buffer:Buffer.from(json)});await expect(page.locator('#log')).toContainText('Opened typing.sysml.json')}
  expect(await page.evaluate(()=>{const p=SystemsModelerAPI.getProject();return{id:p.elements.find(e=>e.kind==='ValueProperty').id,count:p.elements.filter(e=>['DataType','ValueType','ValueProperty'].includes(e.kind)).length}})).toEqual({id:'property',count:3});
  await page.evaluate(()=>{const p=SystemsModelerAPI.getProject();p.elements.find(e=>e.id==='property').typeRef='missing';p.diagrams[0].nodes=[{id:'property-node',elementId:'property',x:80,y:80,width:190,height:110}];SystemsModelerAPI.setProject(p)});await page.locator('[data-semantic-kind="ValueProperty"]').click();const alert=page.locator('#properties [role="alert"]');await expect(alert).toContainText('selected type cannot be resolved');await expect(alert.locator('[data-field="typeRef"]')).toBeVisible();
});

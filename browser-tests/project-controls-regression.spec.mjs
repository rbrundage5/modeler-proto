import {test,expect} from './fixtures.mjs';

test('Projects button opens the project manager and Save persists the active project',async({page})=>{
  await page.goto('/');
  await page.waitForFunction(()=>Boolean(window.SystemsModelerAPI&&window.SystemsModelerProjects));
  await expect(page.locator('#projectManager')).toBeEnabled();
  await expect(page.locator('#saveProject')).toBeEnabled();

  await page.locator('#projectManager').click();
  await expect(page.locator('#projectManagerDialog')).toHaveJSProperty('open',true);
  await page.locator('#projectManagerDialog button').filter({hasText:'Close'}).click();

  const before=await page.evaluate(()=>{
    const p=SystemsModelerAPI.getProject();
    p.name='Project Control Regression';
    return {id:p.id,name:p.name};
  });
  await page.locator('#saveProject').click();
  await expect.poll(async()=>page.evaluate(id=>{
    const item=SystemsModelerProjects.list().find(project=>project.id===id);
    return item?.name||'';
  },before.id)).toBe('Project Control Regression');
});

test('project controls can be rebound without losing handlers',async({page})=>{
  await page.goto('/');
  await page.waitForFunction(()=>Boolean(window.SystemsModelerProjects));
  await page.evaluate(()=>SystemsModelerProjects.rebind());
  await page.locator('#projectManager').click();
  await expect(page.locator('#projectManagerDialog')).toHaveJSProperty('open',true);
  await page.locator('#projectManagerDialog button').filter({hasText:'Close'}).click();
  await page.locator('#saveProject').click();
  await expect.poll(()=>page.evaluate(()=>SystemsModelerProjects.activeId())).not.toBeNull();
});

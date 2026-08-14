import {test,expect} from './fixtures.mjs';

test('relationships render beneath their semantic owner package and collapse with it',async({page})=>{
  await page.goto('/');
  await page.waitForFunction(()=>Boolean(window.SystemsModelerAPI&&window.SystemsModelerOwnedTree));
  await page.evaluate(()=>{
    const p=structuredClone(SystemsModelerAPI.getProject());
    const root=p.root.id;
    p.elements=[...(p.elements||[]),
      {id:'PKG-GOV',externalId:'PKG-GOV',kind:'Package',name:'Governance',ownerId:root},
      {id:'PKG-RM',externalId:'PKG-RM',kind:'Package',name:'Repository_Management',ownerId:'PKG-GOV'},
      {id:'REQ-1',externalId:'REQ-1',kind:'Requirement',name:'UseStableExternalIdentifiers',ownerId:'PKG-RM',requirementId:'GOV-0001',requirementText:'Stable IDs are required.'},
      {id:'PKG-NEXT',externalId:'PKG-NEXT',kind:'Package',name:'Common_Library',ownerId:root}
    ];
    p.relationships=[...(p.relationships||[]),{id:'REL-GOV-1',externalId:'REL-GOV-1',kind:'Trace',name:'trace_GOV_0001_to_owner',ownerId:'PKG-RM',sourceId:'REQ-1',targetId:'PKG-RM',stereotype:'trace'}];
    p.uiState={...(p.uiState||{}),collapsedTreeIds:[]};
    SystemsModelerAPI.setProject(p);
  });
  await page.locator('#modelTab').click();
  await page.waitForFunction(()=>document.querySelector('.tree-row[data-id="REL-GOV-1"]')?.dataset.ownerStatus==='valid');
  const positions=await page.evaluate(()=>{
    const owner=document.querySelector('.tree-row[data-id="PKG-RM"]');
    const rel=document.querySelector('.tree-row[data-id="REL-GOV-1"]');
    const next=document.querySelector('.tree-row[data-id="PKG-NEXT"]');
    const rows=[...document.querySelectorAll('#tree>.tree-row')];
    return{ownerPad:parseFloat(owner.style.paddingLeft),relPad:parseFloat(rel.style.paddingLeft),ownerIndex:rows.indexOf(owner),relIndex:rows.indexOf(rel),nextIndex:rows.indexOf(next),hidden:rel.hidden};
  });
  expect(positions.relPad).toBeGreaterThan(positions.ownerPad);
  expect(positions.relIndex).toBeGreaterThan(positions.ownerIndex);
  expect(positions.relIndex).toBeLessThan(positions.nextIndex);
  expect(positions.hidden).toBe(false);

  await page.locator('.tree-row[data-id="PKG-RM"] .tree-disclosure').click();
  await expect.poll(()=>page.locator('.tree-row[data-id="REL-GOV-1"]').evaluate(el=>el.hidden)).toBe(true);
});

test('invalid relationship owners are explicitly flagged instead of appearing contained',async({page})=>{
  await page.goto('/');
  await page.waitForFunction(()=>Boolean(window.SystemsModelerAPI&&window.SystemsModelerOwnedTree));
  await page.evaluate(()=>{
    const p=structuredClone(SystemsModelerAPI.getProject());
    p.relationships=[...(p.relationships||[]),{id:'REL-ORPHAN',externalId:'REL-ORPHAN',kind:'Trace',name:'orphan_trace',ownerId:'MISSING-PACKAGE',sourceId:p.root.id,targetId:p.root.id,stereotype:'trace'}];
    SystemsModelerAPI.setProject(p);
  });
  await page.locator('#modelTab').click();
  await page.waitForFunction(()=>document.querySelector('.tree-row[data-id="REL-ORPHAN"]')?.dataset.ownerStatus==='invalid');
  await expect(page.locator('.tree-row[data-id="REL-ORPHAN"]')).toHaveAttribute('title',/no valid semantic owner/i);
});

import {test,expect} from './fixtures.mjs';

test('double click uses explicit imported child diagram links and direct model navigation',async({page})=>{
  await page.goto('/');
  await page.waitForFunction(()=>Boolean(window.SystemsModelerAPI&&window.SystemsModelerChildDiagrams));
  await page.evaluate(()=>{
    const p=SystemsModelerAPI.getProject(),owner=p.root.id,block={id:'NAV-BLOCK',externalId:'NAV-BLOCK',kind:'Block',metaclass:'Class',stereotype:'SysML::Block',name:'Parent Block',ownerId:owner,childDiagramIds:['NAV-IBD'],primaryChildDiagramId:'NAV-IBD'},parent={id:'NAV-BDD',externalId:'NAV-BDD',name:'Parent BDD',diagramType:'Block Definition Diagram',ownerId:owner,contextId:owner,nodes:[{id:'NAV-NODE',elementId:block.id,x:150,y:120,width:220,height:120}],edges:[]},child={id:'NAV-IBD',externalId:'NAV-IBD',name:'Parent Block IBD',diagramType:'Internal Block Diagram',ownerId:owner,contextId:owner,nodes:[],edges:[]};
    p.elements.push(block);p.diagrams.push(parent,child);p.activeDiagramId=parent.id;SystemsModelerAPI.setProject(p);
  });
  await expect(page.locator('#canvas g.node[data-semantic-id="NAV-BLOCK"] .child-diagram-glyph')).toHaveCount(1);
  await page.locator('#canvas g.node[data-semantic-id="NAV-BLOCK"] .shape').dblclick();
  await expect.poll(()=>page.evaluate(()=>SystemsModelerAPI.getProject().activeDiagramId)).toBe('NAV-IBD');
});

test('child resolver works for arbitrary explicit parent-child diagram links',async({page})=>{
  await page.goto('/');
  await page.waitForFunction(()=>Boolean(window.SystemsModelerChildDiagrams&&window.SystemsModelerAPI));
  const result=await page.evaluate(()=>{
    const p=SystemsModelerAPI.getProject(),owner=p.root.id,element={id:'NAV-REQ',externalId:'NAV-REQ',kind:'Requirement',name:'Parent Requirement',ownerId:owner,childDiagramIds:['NAV-REQ-DGM'],primaryChildDiagramId:'NAV-REQ-DGM'},diagram={id:'NAV-REQ-DGM',name:'Requirement Child',diagramType:'Requirement Diagram',ownerId:owner,contextId:owner,nodes:[],edges:[]};p.elements.push(element);p.diagrams.push(diagram);return SystemsModelerChildDiagrams.preferredChildDiagram(p,element.id)?.id;
  });
  expect(result).toBe('NAV-REQ-DGM');
});

test('import ownership repair places root-owned Requirement trace under source package',async({page})=>{
  await page.goto('/');
  await page.waitForFunction(()=>Boolean(window.SystemsModelerImportRelationshipOwners));
  const result=await page.evaluate(()=>{
    const project={root:{id:'ROOT',kind:'Package',name:'Model'},elements:[{id:'PKG-GOV',kind:'Package',name:'Governance Area',ownerId:'ROOT'},{id:'REQ-GOV',kind:'Requirement',name:'Governance Requirement',ownerId:'PKG-GOV'}],relationships:[{id:'REL-GOV',externalId:'REL-GOV',kind:'Trace',name:'trace_GOV_0001_to_owner',sourceId:'REQ-GOV',targetId:'PKG-GOV',ownerId:'ROOT',importSource:{file:'Governance.xlsx',sheet:'Relationships_Import',row:5}}],diagrams:[]};
    const repaired=SystemsModelerImportRelationshipOwners.repair(project);return{changed:repaired.changed,ownerId:project.relationships[0].ownerId,qualifiedName:project.relationships[0].qualifiedNameString};
  });
  expect(result.changed).toBe(true);expect(result.ownerId).toBe('PKG-GOV');expect(result.qualifiedName).toContain('Governance Area::trace_GOV_0001_to_owner');
});

test('Governance import repair removes duplicate stable relationships and preserves one correctly owned record',async({page})=>{
  await page.goto('/');
  await page.waitForFunction(()=>Boolean(window.SystemsModelerImportRelationshipOwners));
  const result=await page.evaluate(()=>{
    const project={root:{id:'ROOT',kind:'Package',name:'test7'},elements:[{id:'FSBS.PKG.000',externalId:'FSBS.PKG.000',kind:'Package',name:'FSBS_Model',ownerId:'ROOT'},{id:'FSBS.PKG.100',externalId:'FSBS.PKG.100',kind:'Package',name:'Governance',ownerId:'FSBS.PKG.000'},{id:'FSBS.PKG.110',externalId:'FSBS.PKG.110',kind:'Package',name:'Repository_Management',ownerId:'FSBS.PKG.100'},{id:'FSBS.GOV.REQ.0001',externalId:'FSBS.GOV.REQ.0001',kind:'Requirement',name:'UseStableExternalIdentifiers',ownerId:'FSBS.PKG.110'}],relationships:[
      {id:'legacy-root-copy',externalId:'FSBS.REL.GOV.0001',kind:'Trace',name:'trace_GOV-0001_to_owner',sourceId:'FSBS.GOV.REQ.0001',targetId:'FSBS.PKG.110',ownerId:'ROOT',importSource:{file:'old.xlsx',sheet:'Relationships_Import',row:5}},
      {id:'FSBS.REL.GOV.0001',externalId:'FSBS.REL.GOV.0001',kind:'Trace',name:'trace_GOV-0001_to_owner',sourceId:'FSBS.GOV.REQ.0001',targetId:'FSBS.PKG.110',ownerId:'FSBS.PKG.000',importSource:{file:'new.xlsx',sheet:'Relationships_Import',row:5}}
    ],diagrams:[{id:'D1',nodes:[],edges:[{id:'E1',relationshipId:'legacy-root-copy',sourceNodeId:'N1',targetNodeId:'N2'}]}]};
    const repaired=SystemsModelerImportRelationshipOwners.repair(project),relationships=project.relationships.filter(r=>r.externalId==='FSBS.REL.GOV.0001');return{changed:repaired.changed,count:relationships.length,ownerId:relationships[0]?.ownerId,id:relationships[0]?.id,edgeRelationshipId:project.diagrams[0].edges[0].relationshipId,deduplicated:repaired.deduplicated.length};
  });
  expect(result.changed).toBe(true);expect(result.count).toBe(1);expect(result.ownerId).toBe('FSBS.PKG.110');expect(result.id).toBe('FSBS.REL.GOV.0001');expect(result.edgeRelationshipId).toBe('FSBS.REL.GOV.0001');expect(result.deduplicated).toBe(1);
});

import {test,expect} from './fixtures.mjs';

test('Sequence palette exposes Reply Message and messages can move vertically on Lifelines',async({page})=>{
  await page.goto('/');
  await page.evaluate(()=>{const p=SystemsModelerAPI.createBlankProject('Sequence completion'),root=p.root.id,interaction={id:'i',externalId:'I',kind:'Interaction',metaclass:'Interaction',name:'Interaction',ownerId:root,compartments:{},compartmentVisibility:{}},a={id:'a',externalId:'A',kind:'Actor',metaclass:'Actor',name:'A',ownerId:root,compartments:{},compartmentVisibility:{}},b={id:'b',externalId:'B',kind:'Actor',metaclass:'Actor',name:'B',ownerId:root,compartments:{},compartmentVisibility:{}},l1={id:'l1',externalId:'L1',kind:'Lifeline',metaclass:'Lifeline',name:'a',ownerId:'i',representedElementId:'a',compartments:{},compartmentVisibility:{}},l2={id:'l2',externalId:'L2',kind:'Lifeline',metaclass:'Lifeline',name:'b',ownerId:'i',representedElementId:'b',compartments:{},compartmentVisibility:{}};p.elements=[interaction,a,b,l1,l2];p.diagrams=[{id:'seq',name:'Sequence',diagramType:'Sequence Diagram',ownerId:'i',contextId:'i',nodes:[{id:'n1',elementId:'l1',x:160,y:70,width:140,height:45,timelineEndY:700},{id:'n2',elementId:'l2',x:520,y:70,width:140,height:45,timelineEndY:700}],edges:[]}];p.activeDiagramId='seq';SystemsModelerAPI.setProject(p)});
  await expect(page.locator('[data-tool="ReplyMessage"]')).toBeVisible();
  await page.locator('[data-tool="ReplyMessage"]').click();
  await page.locator('[data-presentation-id="n1"] .shape').click();
  await page.locator('[data-presentation-id="n2"] .shape').click();
  const edge=page.locator('.sequence-message-hit').first();await expect(edge).toBeVisible();
  const before=await page.evaluate(()=>SystemsModelerAPI.getProject().diagrams[0].edges[0].occurrenceY);
  const box=await edge.boundingBox();await page.mouse.move(box.x+20,box.y+2);await page.mouse.down();await page.mouse.move(box.x+20,box.y+100,{steps:5});await page.mouse.up();
  const result=await page.evaluate(()=>{const p=SystemsModelerAPI.getProject(),r=p.relationships[0],e=p.diagrams[0].edges[0];return{sort:r.messageSort,y:e.occurrenceY}});
  expect(result.sort).toBe('reply');expect(result.y).toBeGreaterThan(before+40);
});

test('State Machine supports composite state, region, pseudostates and transition labels',async({page})=>{
  await page.goto('/');
  await page.evaluate(()=>{const p=SystemsModelerAPI.createBlankProject('STM completion'),root=p.root.id,m={id:'machine',externalId:'STM',kind:'StateMachine',metaclass:'StateMachine',name:'Machine',ownerId:root,compartments:{},compartmentVisibility:{}},region={id:'region',externalId:'REG',kind:'Region',metaclass:'Region',name:'Region 1',ownerId:'machine',compartments:{},compartmentVisibility:{}},initial={id:'initial',externalId:'INI',kind:'InitialPseudostate',metaclass:'Pseudostate',name:'',ownerId:'region',compartments:{},compartmentVisibility:{}},state={id:'state',externalId:'S',kind:'CompositeState',metaclass:'State',name:'Operating',ownerId:'region',entry:'initialize()',doActivity:'operate()',exit:'cleanup()',compartments:{},compartmentVisibility:{}},final={id:'final',externalId:'F',kind:'FinalState',metaclass:'FinalState',name:'',ownerId:'region',compartments:{},compartmentVisibility:{}};p.elements=[m,region,initial,state,final];p.relationships=[{id:'t1',externalId:'T1',kind:'Transition',metaclass:'Transition',sourceId:'initial',targetId:'state',ownerId:'region',name:'',triggerIds:[],guard:'ready',effect:'start()',documentation:''},{id:'t2',externalId:'T2',kind:'Transition',metaclass:'Transition',sourceId:'state',targetId:'final',ownerId:'region',name:'',triggerIds:[],guard:'done',effect:'stop()',documentation:''}];p.diagrams=[{id:'stm',name:'Machine states',diagramType:'State Machine Diagram',ownerId:'machine',contextId:'machine',nodes:[{id:'rn',elementId:'region',x:80,y:70,width:900,height:600},{id:'in',elementId:'initial',x:140,y:180,width:26,height:26},{id:'sn',elementId:'state',x:320,y:130,width:300,height:210},{id:'fn',elementId:'final',x:800,y:200,width:30,height:30}],edges:[{id:'e1',relationshipId:'t1',sourceNodeId:'in',targetNodeId:'sn',points:[]},{id:'e2',relationshipId:'t2',sourceNodeId:'sn',targetNodeId:'fn',points:[]}]}];p.activeDiagramId='stm';SystemsModelerAPI.setProject(p)});
  await expect(page.locator('[data-semantic-kind="CompositeState"] .state-shape')).toBeVisible();
  await expect(page.locator('[data-semantic-kind="Region"] .state-region')).toBeVisible();
  await expect(page.locator('.edge-label').filter({hasText:'[ready] / start()'})).toBeVisible();
  await page.locator('[data-semantic-kind="CompositeState"] .shape').click();
  await expect(page.locator('[data-state-machine-completion]')).toContainText('State Machine');
  await expect(page.locator('[data-state-machine-completion] button')).toContainText('+ Region');
});

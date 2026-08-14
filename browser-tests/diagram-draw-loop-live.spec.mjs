import {test,expect} from './fixtures.mjs';

test('live canvas reports bounded rendered working set',async({page})=>{
  await page.goto('/');
  await page.waitForFunction(()=>Boolean(window.SystemsModelerAPI));
  const project=await page.evaluate(()=>{
    const p=window.SystemsModelerAPI.createBlankProject('Massive Diagram');
    const d={id:'d1',name:'Massive',diagramType:'Block Definition Diagram',ownerId:p.root.id,contextId:p.root.id,nodes:[],edges:[]};
    for(let i=0;i<20000;i++){
      const e={id:`e${i}`,externalId:`EXT-${i}`,name:`Block ${i}`,kind:'Block',metaclass:'Class',ownerId:p.root.id,documentation:'',tags:{}};
      p.elements.push(e);
      d.nodes.push({id:`n${i}`,elementId:e.id,x:(i%200)*180,y:Math.floor(i/200)*120,width:140,height:80});
    }
    p.diagrams=[d];p.activeDiagramId=d.id;window.SystemsModelerAPI.setProject(p);return true;
  });
  expect(project).toBe(true);
  await page.waitForFunction(()=>Number(document.getElementById('canvas')?.dataset.totalNodes||0)===20000);
  const stats=await page.evaluate(()=>{const svg=document.getElementById('canvas');return{total:Number(svg.dataset.totalNodes),rendered:Number(svg.dataset.renderedNodes),dom:svg.querySelectorAll('[data-presentation-id]').length}});
  expect(stats.total).toBe(20000);
  expect(stats.rendered).toBeLessThan(1000);
  expect(stats.dom).toBeLessThan(3000);
});

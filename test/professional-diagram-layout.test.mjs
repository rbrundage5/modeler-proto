import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {cleanDiagramLayout,diagramReadabilityIssues,LAYOUT_VERSION} from '../public/src/professional-diagram-layout.js';

function project(){
  return {
    root:{id:'root',kind:'Model'},
    elements:[
      {id:'a',kind:'Block',name:'A'},{id:'b',kind:'Block',name:'B'},{id:'c',kind:'Block',name:'C'},
      {id:'port',kind:'ProxyPort',name:'p',ownerId:'a'}
    ],
    relationships:[
      {id:'r1',kind:'Dependency',sourceId:'a',targetId:'b'},
      {id:'r2',kind:'Dependency',sourceId:'a',targetId:'b'},
      {id:'r3',kind:'Generalization',sourceId:'c',targetId:'a'}
    ]
  };
}
function diagram(){return{id:'d',diagramType:'Block Definition Diagram',nodes:[
  {id:'na',elementId:'a',x:100,y:100,width:260,height:100},
  {id:'nb',elementId:'b',x:160,y:120,width:260,height:100},
  {id:'nc',elementId:'c',x:180,y:135,width:260,height:100},
  {id:'np',elementId:'port',x:340,y:145,width:16,height:16,parentPresentationId:'na',boundaryOwnerNodeId:'na'}
],edges:[
  {id:'e1',relationshipId:'r1',sourceNodeId:'na',targetNodeId:'nb',points:[]},
  {id:'e2',relationshipId:'r2',sourceNodeId:'na',targetNodeId:'nb',points:[]},
  {id:'e3',relationshipId:'r3',sourceNodeId:'nc',targetNodeId:'na',points:[]}
]}}

test('detects overlap and edge readability defects before layout',()=>{
  const issues=diagramReadabilityIssues(project(),diagram());
  assert.ok(issues.some(issue=>issue.code==='NODE_OVERLAP'));
  assert.ok(issues.some(issue=>issue.code==='PARALLEL_EDGE_OVERLAP'));
});

test('clean layout separates nodes and assigns orthogonal relationship lanes',()=>{
  const p=project(),d=diagram(),portBefore={x:d.nodes[3].x,y:d.nodes[3].y},ownerBefore={x:d.nodes[0].x,y:d.nodes[0].y};
  const result=cleanDiagramLayout(p,d);
  assert.equal(result.changed,true);
  assert.equal(d.layoutVersion,LAYOUT_VERSION);
  assert.equal(diagramReadabilityIssues(p,d).some(issue=>issue.code==='NODE_OVERLAP'),false);
  for(const edge of d.edges){
    const source=d.nodes.find(node=>node.id===edge.sourceNodeId),target=d.nodes.find(node=>node.id===edge.targetNodeId),path=[{x:source.x+source.width/2,y:source.y+source.height/2},...edge.points,{x:target.x+target.width/2,y:target.y+target.height/2}];
    assert.equal(path.every((point,index)=>!index||point.x===path[index-1].x||point.y===path[index-1].y),true,'every routed segment is orthogonal');
  }
  assert.equal(diagramReadabilityIssues(p,d).some(issue=>issue.code==='EDGE_THROUGH_NODE'),false);
  assert.notDeepEqual(d.edges[0].points,d.edges[1].points,'parallel relationships use distinct lanes');
  const ownerAfter=d.nodes[0],portAfter=d.nodes[3];
  assert.equal(portAfter.x-portBefore.x,ownerAfter.x-ownerBefore.x,'boundary child moves with owner in X');
  assert.equal(portAfter.y-portBefore.y,ownerAfter.y-ownerBefore.y,'boundary child moves with owner in Y');
});

test('opposite-direction relationships use separate endpoint attachments, corridors, and labels',()=>{
  const p=project(),d=diagram();
  p.relationships=p.relationships.filter(r=>r.id!=='r2'&&r.id!=='r3');
  d.edges=d.edges.filter(e=>e.id!=='e2'&&e.id!=='e3');
  p.relationships.push({id:'reverse',kind:'Dependency',sourceId:'b',targetId:'a'});
  d.edges.push({id:'reverse-edge',relationshipId:'reverse',sourceNodeId:'nb',targetNodeId:'na',points:[]});
  cleanDiagramLayout(p,d);
  const forward=d.edges.find(e=>e.id==='e1'),reverse=d.edges.find(e=>e.id==='reverse-edge');
  assert.notDeepEqual(forward.points,reverse.points,'reciprocal edges must never share the same route');
  assert.notEqual(forward.routingLane,reverse.routingLane,'reciprocal edges receive distinct endpoint lanes');
  assert.notEqual(forward.routingDirection,reverse.routingDirection,'reciprocal semantic directions remain explicit');
  assert.notDeepEqual(forward.labelPosition,reverse.labelPosition,'reciprocal labels are independently positioned');
  assert.ok(Math.abs(forward.routingLane-reverse.routingLane)>=84,'reciprocal endpoint lanes have strong visible separation');
});

test('automatic cleanup is scoped to the active diagram rather than sweeping the project',()=>{
  const source=fs.readFileSync(new URL('../public/src/professional-diagram-layout.js',import.meta.url),'utf8');
  assert.match(source,/function cleanActiveIfNeeded\(\)/);
  assert.doesNotMatch(source,/for\s*\(const diagram of p\.diagrams/);
  assert.doesNotMatch(source,/cleanAllNeeded/);
  assert.match(source,/const p=project\(\),diagram=activeDiagram\(p\)/);
});

test('Generalization is ranked with the general classifier above the specific classifier',()=>{
  const p=project(),d=diagram();cleanDiagramLayout(p,d);
  const parent=d.nodes.find(node=>node.elementId==='a'),child=d.nodes.find(node=>node.elementId==='c');
  assert.ok(parent.y<child.y);
});

test('only elements of the same semantic type share a branch row',()=>{
  const p=project(),d=diagram();
  p.elements.push({id:'actor',kind:'Actor',name:'Operator'});
  p.relationships.push({id:'r4',kind:'Dependency',sourceId:'a',targetId:'actor'});
  d.nodes.push({id:'nactor',elementId:'actor',x:190,y:130,width:180,height:90});
  d.edges.push({id:'e4',relationshipId:'r4',sourceNodeId:'na',targetNodeId:'nactor',points:[]});
  cleanDiagramLayout(p,d);
  const rows=new Map();
  for(const node of d.nodes.filter(node=>!node.parentPresentationId)){
    if(!rows.has(node.y))rows.set(node.y,[]);
    rows.get(node.y).push(p.elements.find(element=>element.id===node.elementId)?.kind);
  }
  assert.equal([...rows.values()].every(kinds=>new Set(kinds).size===1),true);
  assert.ok(d.nodes.find(node=>node.id==='nactor').y>d.nodes.find(node=>node.id==='na').y);
  assert.equal(d.layoutMode,'downstream-semantic-layers');
});

test('self relationships remain visible as orthogonal loops outside their element',()=>{
  const p=project(),d=diagram();
  p.relationships=[{id:'self',kind:'Dependency',sourceId:'a',targetId:'a'}];
  d.edges=[{id:'self-edge',relationshipId:'self',sourceNodeId:'na',targetNodeId:'na',points:[]}];
  cleanDiagramLayout(p,d);
  const node=d.nodes.find(item=>item.id==='na'),edge=d.edges[0];
  assert.ok(edge.points.some(point=>point.x>node.x+node.width||point.x<node.x));
  assert.ok(edge.points.some(point=>point.y>node.y+node.height||point.y<node.y));
  assert.equal(diagramReadabilityIssues(p,d).some(issue=>issue.code==='EDGE_THROUGH_NODE'),false);
});

test('Sequence diagrams are not rearranged by generic layout',()=>{
  const p=project(),d=diagram();d.diagramType='Sequence Diagram';const before=structuredClone(d.nodes);
  const result=cleanDiagramLayout(p,d);
  assert.equal(result.changed,false);
  assert.deepEqual(d.nodes,before);
});

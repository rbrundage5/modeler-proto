import test from 'node:test';
import assert from 'node:assert/strict';
import {diagramRepositoryTree} from '../public/src/diagram-repository-tree.js';

function flatten(node,result=[]){result.push(node);for(const child of node.children)flatten(child,result);return result}

test('diagrams are grouped beneath their complete semantic owner package chain',()=>{
  const project={
    root:{id:'root',name:'Model',kind:'Model'},
    elements:[
      {id:'requirements',name:'Requirements',kind:'Package',ownerId:'root'},
      {id:'mission',name:'Mission Requirements',kind:'Package',ownerId:'requirements'},
      {id:'unrelated',name:'Unrelated',kind:'Package',ownerId:'root'}
    ],
    diagrams:[
      {id:'overview',name:'Enterprise Overview',diagramType:'Requirement Diagram',ownerId:'requirements'},
      {id:'mission-diagram',name:'Mission Requirements',diagramType:'Requirement Diagram',ownerId:'mission'}
    ]
  };
  const tree=diagramRepositoryTree(project),rows=flatten(tree);
  const requirements=rows.find(row=>row.id==='requirements'),mission=rows.find(row=>row.id==='mission');
  assert.ok(requirements.children.some(row=>row.id==='overview'));
  assert.ok(requirements.children.some(row=>row.id==='mission'));
  assert.ok(mission.children.some(row=>row.id==='mission-diagram'));
  assert.equal(rows.some(row=>row.id==='unrelated'),false);
  assert.equal(rows.filter(row=>row.type==='diagram').length,2);
});

test('unresolved diagram owners are isolated in one diagnostic group',()=>{
  const project={root:{id:'root',name:'Model',kind:'Model'},elements:[],diagrams:[{id:'loose',name:'Loose',diagramType:'BDD',ownerId:'missing'}]};
  const tree=diagramRepositoryTree(project),group=tree.children.find(row=>row.id==='unresolved-diagram-owners');
  assert.ok(group);
  assert.deepEqual(group.children.map(row=>row.id),['loose']);
});

const text=value=>String(value??'').trim();

export function diagramRepositoryTree(project){
  const root=project.root||{id:'ROOT',name:'Model',kind:'Model'},elements=new Map((project.elements||[]).map(element=>[element.id,element]));
  elements.set(root.id,root);
  const ownerIds=new Set(),unresolved=[];
  for(const diagram of project.diagrams||[]){
    let owner=elements.get(diagram.ownerId);
    if(!owner){unresolved.push(diagram);continue}
    const seen=new Set();
    while(owner&&!seen.has(owner.id)){
      seen.add(owner.id);ownerIds.add(owner.id);
      if(owner.id===root.id)break;
      owner=elements.get(owner.ownerId);
    }
  }
  const children=new Map();
  for(const id of ownerIds){
    if(id===root.id)continue;
    const element=elements.get(id);if(!element)continue;
    const parentId=ownerIds.has(element.ownerId)?element.ownerId:root.id;
    if(!children.has(parentId))children.set(parentId,[]);
    children.get(parentId).push(element);
  }
  const diagramsByOwner=new Map();
  for(const diagram of project.diagrams||[]){
    if(!elements.has(diagram.ownerId))continue;
    if(!diagramsByOwner.has(diagram.ownerId))diagramsByOwner.set(diagram.ownerId,[]);
    diagramsByOwner.get(diagram.ownerId).push(diagram);
  }
  const build=element=>({
    type:'owner',id:element.id,name:text(element.name)||element.id,kind:element.kind||'Package',
    children:[
      ...(children.get(element.id)||[]).sort(byName).map(build),
      ...(diagramsByOwner.get(element.id)||[]).sort(byName).map(diagram=>({type:'diagram',id:diagram.id,name:text(diagram.name)||diagram.id,kind:diagram.diagramType||'Diagram',children:[]}))
    ]
  });
  const tree=build(root);
  if(unresolved.length)tree.children.push({type:'diagnostic',id:'unresolved-diagram-owners',name:'Unresolved diagram ownership',kind:'Diagnostic',children:unresolved.sort(byName).map(diagram=>({type:'diagram',id:diagram.id,name:text(diagram.name)||diagram.id,kind:diagram.diagramType||'Diagram',children:[]}))});
  return tree;
}

function byName(a,b){return text(a.name).localeCompare(text(b.name))}

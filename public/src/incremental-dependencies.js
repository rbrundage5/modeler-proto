import {projectIndex} from './model-index.js';

export function dependencyClosure(project,{elementIds=[],relationshipIds=[],diagramIds=[],ownerIds=[]}={}){
  const index=projectIndex(project),elements=new Set(elementIds.map(String)),relationships=new Set(relationshipIds.map(String)),diagrams=new Set(diagramIds.map(String)),owners=new Set(ownerIds.filter(Boolean).map(String));
  const queue=[...elements];
  while(queue.length){
    const id=queue.shift(),element=index.elements.get(id);if(!element)continue;
    if(element.ownerId)owners.add(String(element.ownerId));
    for(const rel of index.relationshipsByEndpoint.get(id)||[])relationships.add(String(rel.id));
    for(const presentation of index.presentationsByElement.get(id)||[])diagrams.add(String(presentation.diagram.id));
  }
  for(const ownerId of owners){for(const child of index.children.get(ownerId)||[])elements.add(String(child.id))}
  return{elements,relationships,diagrams,owners};
}

export function descendantClosure(project,rootIds){const index=projectIndex(project),out=new Set(),queue=[...rootIds].filter(Boolean).map(String);while(queue.length){const id=queue.shift();if(out.has(id))continue;out.add(id);for(const child of index.children.get(id)||[])queue.push(String(child.id))}return out}

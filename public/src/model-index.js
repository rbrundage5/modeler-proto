// Runtime indexes for massive SysML repositories. Indexes are deliberately non-serialized:
// the canonical project remains portable JSON while hot lookup paths become O(1).
const cache=new WeakMap();

function add(map,key,value){if(key===undefined||key===null||key==='')return;map.set(String(key),value)}
function addMany(map,key,value){if(key===undefined||key===null||key==='')return;const k=String(key);let values=map.get(k);if(!values){values=[];map.set(k,values)}values.push(value)}

export function buildProjectIndex(project){
  const elements=new Map(),externalElements=new Map(),children=new Map(),relationships=new Map(),relationshipsByEndpoint=new Map(),diagrams=new Map(),presentationsByElement=new Map();
  const root=project?.root;
  if(root){add(elements,root.id,root);add(externalElements,root.externalId,root)}
  for(const element of project?.elements||[]){
    add(elements,element.id,element);add(externalElements,element.externalId,element);addMany(children,element.ownerId||root?.id,element);
  }
  for(const relationship of project?.relationships||[]){
    add(relationships,relationship.id,relationship);addMany(relationshipsByEndpoint,relationship.sourceId,relationship);if(relationship.targetId!==relationship.sourceId)addMany(relationshipsByEndpoint,relationship.targetId,relationship);
  }
  for(const diagram of project?.diagrams||[]){
    add(diagrams,diagram.id,diagram);
    for(const node of diagram.nodes||[])addMany(presentationsByElement,node.elementId,{diagram,node});
  }
  const index={project,elements,externalElements,children,relationships,relationshipsByEndpoint,diagrams,presentationsByElement,elementCount:elements.size,relationshipCount:relationships.size,diagramCount:diagrams.size};
  cache.set(project,index);return index;
}

export function projectIndex(project){return cache.get(project)||buildProjectIndex(project)}
export function invalidateProjectIndex(project){if(project)cache.delete(project)}
export function indexedElement(project,id){if(id===undefined||id===null)return null;return projectIndex(project).elements.get(String(id))||null}
export function indexedExternalElement(project,id){if(id===undefined||id===null)return null;return projectIndex(project).externalElements.get(String(id))||null}
export function indexedRelationship(project,id){if(id===undefined||id===null)return null;return projectIndex(project).relationships.get(String(id))||null}
export function indexedDiagram(project,id){if(id===undefined||id===null)return null;return projectIndex(project).diagrams.get(String(id))||null}
export function indexedChildren(project,ownerId){return projectIndex(project).children.get(String(ownerId))||[]}
export function indexedRelationshipsFor(project,elementId){return projectIndex(project).relationshipsByEndpoint.get(String(elementId))||[]}
export function indexedPresentationsFor(project,elementId){return projectIndex(project).presentationsByElement.get(String(elementId))||[]}

export function indexStats(project){const i=projectIndex(project);return{elements:i.elementCount,relationships:i.relationshipCount,diagrams:i.diagramCount}}

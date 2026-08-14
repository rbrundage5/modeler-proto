const normalized=value=>String(value??'').trim().toLowerCase().replace(/[^a-z0-9]/g,'');

export function isDiagramArtifactElement(element,diagrams=[]){
  if(!element)return false;
  const kind=normalized(element.kind||element.metaclass||element.stereotype);
  if(kind==='diagram'||kind.endsWith('diagram'))return true;
  const identities=new Set([element.id,element.externalId].map(normalized).filter(Boolean));
  return diagrams.some(diagram=>[diagram.id,diagram.externalId].map(normalized).some(id=>id&&identities.has(id)));
}

export function modelRepositoryElements(project){
  return [project.root,...(project.elements||[])].filter(element=>!isDiagramArtifactElement(element,project.diagrams||[]));
}

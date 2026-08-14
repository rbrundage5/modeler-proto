import {dependencyClosure,descendantClosure} from './incremental-dependencies.js';
import {markElementDirty,markOwnerDirty,markRelationshipDirty,markDiagramDirty} from './dirty-set.js';

export function recordSemanticChange(project,{elementIds=[],relationshipIds=[],diagramIds=[],ownerIds=[],includeDescendants=false}={}){
  const seedElements=includeDescendants?[...descendantClosure(project,elementIds)]:elementIds;
  const closure=dependencyClosure(project,{elementIds:seedElements,relationshipIds,diagramIds,ownerIds});
  for(const id of closure.elements)markElementDirty(project,id);
  for(const id of closure.owners)markOwnerDirty(project,id);
  for(const id of closure.relationships)markRelationshipDirty(project,id);
  for(const id of closure.diagrams)markDiagramDirty(project,id);
  return closure;
}

import {indexElementAdded,indexElementMoved,indexElementRemoved,indexRelationshipAdded,indexRelationshipRemoved} from './model-index-mutations.js';
import {markElementDirty,markRelationshipDirty} from './dirty-set.js';

// Canonical mutation helpers for massive repositories. New/converted write paths should use
// these instead of mutating arrays directly so indexes and incremental processing stay coherent.
export function addElement(project,element){project.elements??=[];project.elements.push(element);indexElementAdded(project,element);markElementDirty(project,element.id,{ownerId:element.ownerId});return element}
export function removeElement(project,element){const at=(project.elements||[]).indexOf(element);if(at>=0)project.elements.splice(at,1);indexElementRemoved(project,element);markElementDirty(project,element.id,{ownerId:element.ownerId});return element}
export function moveElement(project,element,ownerId){const previousOwnerId=element.ownerId;element.ownerId=ownerId;indexElementMoved(project,element,previousOwnerId);markElementDirty(project,element.id,{ownerId});return element}
export function addRelationship(project,relationship){project.relationships??=[];project.relationships.push(relationship);indexRelationshipAdded(project,relationship);markRelationshipDirty(project,relationship.id);return relationship}
export function removeRelationship(project,relationship){const at=(project.relationships||[]).indexOf(relationship);if(at>=0)project.relationships.splice(at,1);indexRelationshipRemoved(project,relationship);markRelationshipDirty(project,relationship.id);return relationship}

import {projectIndex} from './model-index.js';

function addMany(map,key,value){if(key===undefined||key===null||key==='')return;const k=String(key);let values=map.get(k);if(!values){values=[];map.set(k,values)}if(!values.includes(value))values.push(value)}
function removeMany(map,key,value){if(key===undefined||key===null||key==='')return;const k=String(key),values=map.get(k);if(!values)return;const next=values.filter(item=>item!==value);if(next.length)map.set(k,next);else map.delete(k)}

// Mutation hooks let later PRs move write paths to incremental index maintenance without
// rebuilding repository-wide maps after every single semantic operation.
export function indexElementAdded(project,element){const i=projectIndex(project);i.elements.set(String(element.id),element);if(element.externalId)i.externalElements.set(String(element.externalId),element);addMany(i.children,element.ownerId||project.root?.id,element);i.elementCount=i.elements.size;return element}
export function indexElementRemoved(project,element){const i=projectIndex(project);i.elements.delete(String(element.id));if(element.externalId)i.externalElements.delete(String(element.externalId));removeMany(i.children,element.ownerId||project.root?.id,element);i.elementCount=i.elements.size}
export function indexElementMoved(project,element,previousOwnerId){const i=projectIndex(project);removeMany(i.children,previousOwnerId||project.root?.id,element);addMany(i.children,element.ownerId||project.root?.id,element)}
export function indexRelationshipAdded(project,relationship){const i=projectIndex(project);i.relationships.set(String(relationship.id),relationship);addMany(i.relationshipsByEndpoint,relationship.sourceId,relationship);if(relationship.targetId!==relationship.sourceId)addMany(i.relationshipsByEndpoint,relationship.targetId,relationship);i.relationshipCount=i.relationships.size;return relationship}
export function indexRelationshipRemoved(project,relationship){const i=projectIndex(project);i.relationships.delete(String(relationship.id));removeMany(i.relationshipsByEndpoint,relationship.sourceId,relationship);removeMany(i.relationshipsByEndpoint,relationship.targetId,relationship);i.relationshipCount=i.relationships.size}

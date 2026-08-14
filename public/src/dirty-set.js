// Dirty-set foundation for incremental normalization/validation.
// This PR establishes the contract; subsequent PRs move normalizers onto these sets.
const states=new WeakMap();
function state(project){let s=states.get(project);if(!s){s={elements:new Set(),relationships:new Set(),diagrams:new Set(),owners:new Set(),all:false};states.set(project,s)}return s}
export function markElementDirty(project,id,{ownerId=null}={}){const s=state(project);if(id)s.elements.add(String(id));if(ownerId)s.owners.add(String(ownerId));return s}
export function markRelationshipDirty(project,id){const s=state(project);if(id)s.relationships.add(String(id));return s}
export function markDiagramDirty(project,id){const s=state(project);if(id)s.diagrams.add(String(id));return s}
export function markProjectDirty(project){const s=state(project);s.all=true;return s}
export function dirtyState(project){return state(project)}
export function consumeDirtyState(project){const s=state(project),snapshot={all:s.all,elements:[...s.elements],relationships:[...s.relationships],diagrams:[...s.diagrams],owners:[...s.owners]};states.delete(project);return snapshot}
export function clearDirtyState(project){states.delete(project)}

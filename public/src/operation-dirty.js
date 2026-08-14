import {recordSemanticChange} from './incremental-change-set.js';

function add(set,value){if(value!==undefined&&value!==null&&value!=='')set.add(String(value))}

export function operationDirtyTargets(operation){
  const elements=new Set(),relationships=new Set(),diagrams=new Set(),owners=new Set();
  const visit=op=>{
    if(!op)return;
    if(op.type==='batch-operation'){for(const child of op.operations||[])visit(child);return}
    if(op.targetType==='element'||!op.targetType&&op.targetId)add(elements,op.targetId);
    if(op.targetType==='relationship')add(relationships,op.targetId);
    add(elements,op.elementId);add(elements,op.sourceId);add(elements,op.targetId);add(elements,op.targetOwnerId);add(elements,op.requirementId);
    add(relationships,op.relationshipId);add(diagrams,op.diagramId);add(diagrams,op.diagram?.id);add(owners,op.ownerId);
    if(op.element){add(elements,op.element.id);add(owners,op.element.ownerId)}
    if(op.relationship){add(relationships,op.relationship.id);add(elements,op.relationship.sourceId);add(elements,op.relationship.targetId);add(owners,op.relationship.ownerId)}
    if(op.node)add(elements,op.node.elementId);
  };
  visit(operation);return{elementIds:[...elements],relationshipIds:[...relationships],diagramIds:[...diagrams],ownerIds:[...owners]};
}

export function markOperationDirty(project,operation){return recordSemanticChange(project,operationDirtyTargets(operation))}

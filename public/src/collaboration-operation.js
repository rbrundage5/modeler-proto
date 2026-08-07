export const COLLABORATION_OPERATION_SCHEMA_VERSION=1;
export const OPERATION_SOURCES=['user','import','merge','automation','ai-suggestion','recovery'];
export const OPERATION_STATUSES=['pending','accepted','rejected','conflicted','reverted'];
export const GRANULAR_OPERATION_TYPES=new Set([
 'set-property','move-element','create-element','delete-element','create-relationship','delete-relationship','set-relationship-endpoint',
 'create-diagram','delete-diagram','add-presentation','remove-presentation','move-node','resize-node','set-edge-points','move-edge-label',
 'set-compartment','set-compartment-visibility','set-property-path','set-port-placement','nest-presentation','set-connector-kind','set-diagram-context',
 'add-item-flow','update-item-flow','remove-item-flow','batch-requirement-edit','create-verification-execution','delete-verification-execution',
 'create-requirement-baseline','delete-requirement-baseline','mark-suspect-link','clear-suspect-link','save-report','delete-report','record-import-decision',
 'batch-operation','bulk-import','replace-project'
]);
const clone=value=>globalThis.structuredClone?structuredClone(value):JSON.parse(JSON.stringify(value));
const id=prefix=>`${prefix}-${globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2)}`;

export function operationTargets(operation={}){
 const semanticTargetId=operation.targetId||operation.elementId||operation.relationshipId||operation.connectorId||operation.itemFlowId||operation.baselineId||operation.suspectId||null;
 const presentationTargetId=operation.nodeId||operation.edgeId||operation.node?.id||operation.edge?.id||null;
 return{semanticTargetId,presentationTargetId,targetProperty:operation.property||operation.field||operation.end||null};
}
export function createCollaborationOperation(operation,context={}){
 if(!operation?.type)throw Error('Operation type is required');const targets=operationTargets(operation);
 return{schemaVersion:COLLABORATION_OPERATION_SCHEMA_VERSION,operationId:context.operationId||id('operation'),projectId:context.projectId||'',branchId:context.branchId||'main',revisionId:context.revisionId||null,actorUserId:context.actorUserId||'',actorDisplayName:context.actorDisplayName||'',clientId:context.clientId||'',timestamp:context.timestamp||new Date().toISOString(),operationType:operation.type,...targets,previousValue:clone(context.previousValue??operation.expectedValue),nextValue:clone(context.nextValue??operation.value),expectedValue:clone(operation.expectedValue),parentRevisionId:context.parentRevisionId??null,causalDependencies:[...(context.causalDependencies||[])],undoMetadata:clone(context.undoMetadata||{}),source:context.source||'user',status:context.status||'pending',operation:clone(operation)};
}
export function migrateCollaborationOperation(record,context={}){if(record?.schemaVersion===COLLABORATION_OPERATION_SCHEMA_VERSION&&record.operation)return clone(record);const operation=record?.operation||record;return createCollaborationOperation(operation,{...context,operationId:record?.operationId||context.operationId,actorDisplayName:record?.author||context.actorDisplayName,clientId:record?.clientId||context.clientId,timestamp:record?.createdAt||context.timestamp})}
export function validateCollaborationOperation(record,{allowRecovery=true}={}){const errors=[];if(record?.schemaVersion!==COLLABORATION_OPERATION_SCHEMA_VERSION)errors.push('Unsupported operation schema version');if(!record?.operationId)errors.push('operationId is required');if(!record?.projectId)errors.push('projectId is required');if(!record?.branchId)errors.push('branchId is required');if(!record?.clientId)errors.push('clientId is required');if(!record?.timestamp||Number.isNaN(Date.parse(record.timestamp)))errors.push('timestamp must be ISO-8601');if(!GRANULAR_OPERATION_TYPES.has(record?.operationType))errors.push(`Unsupported operation type: ${record?.operationType}`);if(!OPERATION_SOURCES.includes(record?.source))errors.push(`Invalid operation source: ${record?.source}`);if(!OPERATION_STATUSES.includes(record?.status))errors.push(`Invalid operation status: ${record?.status}`);if(record?.operation?.type!==record?.operationType)errors.push('operationType does not match operation.type');if(!allowRecovery&&['replace-project','bulk-import'].includes(record?.operationType))errors.push(`${record.operationType} is reserved for import, restore, recovery, or merge`);return{ok:errors.length===0,errors}}
export function acceptedOperation(record,{revisionId,parentRevisionId,actorUserId=record.actorUserId,actorDisplayName=record.actorDisplayName,timestamp=record.timestamp}={}){return{...clone(record),revisionId,parentRevisionId,actorUserId,actorDisplayName,timestamp,status:'accepted'}}

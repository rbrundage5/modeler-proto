import {SUPPORTED_TYPE_INVENTORY} from './supported-type-inventory.js';
export const QUALIFICATION_STATES=Object.freeze(['qualified','automated-unverified','manual-only','blocked','failed','unsupported']);
const complete=SUPPORTED_TYPE_INVENTORY.filter(item=>item.supportStatus==='complete');
export const QUALIFICATION_MATRIX=Object.freeze(complete.flatMap(item=>item.diagramTypes.map(diagramType=>Object.freeze({
 semanticType:item.canonicalType,diagramType,creationMethod:item.creationWorkflow,renderer:item.rendererKey,propertyEditor:item.propertySchema,supportedRelationships:item.relationshipRoles,persistencePath:item.serialization,importReimportPath:item.importMapping,undoRedoPath:item.undoRedo,deterministicTests:item.testCoverage,browserTests:item.browserTests||[],manualVisualStatus:item.manualVisualStatus||'not-executed',qualificationStatus:'automated-unverified',knownLimitation:item.knownLimitations?.join(' ')||'Complete support has automated evidence; broader human acceptance remains.',evidenceReferences:[...(item.evidenceReferences||item.testCoverage)]
}))));
export function qualificationSummary(matrix=QUALIFICATION_MATRIX){return Object.fromEntries(QUALIFICATION_STATES.map(state=>[state,matrix.filter(item=>item.qualificationStatus===state).length]))}

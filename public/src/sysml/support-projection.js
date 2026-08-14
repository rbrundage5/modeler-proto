import {CAPABILITY_KERNEL,capabilityKernelEntry} from './capability-kernel.js';

export const SUPPORT_STATES=Object.freeze(['complete','partial','import-only','unsupported']);
const normalize=status=>status==='complete'?'complete':status==='import-only'?'import-only':status==='unsupported'?'unsupported':'partial';
const freeze=value=>Object.freeze(value);

function capabilityEvidence(entry){
 return freeze((entry?.capabilities||[]).map(item=>freeze({diagramType:item.diagramType,maturity:item.maturity,testFixtureId:item.testFixtureId||null})));
}

export function supportProjectionEntry(kind,recordKind='element'){
 const entry=capabilityKernelEntry(kind,recordKind);if(!entry)return null;
 const status=normalize(entry.supportStatus);
 if(recordKind==='diagram')return freeze({recordKind,canonicalType:kind,supportStatus:status,maturity:entry.maturity,diagramTypes:[kind],contextKinds:[...entry.contextKinds],testFixtureId:entry.testFixtureId||null,knownLimitations:[...entry.knownLimitations]});
 if(recordKind==='relationship')return freeze({recordKind,canonicalType:kind,supportStatus:status,maturity:entry.maturity,diagramTypes:[...entry.diagramTypes],source:entry.source,target:entry.target,evidence:capabilityEvidence(entry),knownLimitations:[...entry.knownLimitations]});
 return freeze({recordKind:'element',canonicalType:kind,supportStatus:status,maturity:entry.maturity,presentationMode:entry.presentationMode,diagramTypes:[...entry.diagramTypes],ownerKinds:[...entry.ownerKinds],compartments:[...entry.compartments],evidence:capabilityEvidence(entry),knownLimitations:[...entry.knownLimitations]});
}

export const SUPPORT_PROJECTION=freeze({
 schemaVersion:1,kernelSchemaVersion:CAPABILITY_KERNEL.schemaVersion,
 diagrams:freeze(Object.fromEntries(Object.keys(CAPABILITY_KERNEL.diagrams).map(kind=>[kind,supportProjectionEntry(kind,'diagram')]))),
 elements:freeze(Object.fromEntries(Object.keys(CAPABILITY_KERNEL.elements).map(kind=>[kind,supportProjectionEntry(kind,'element')]))),
 relationships:freeze(Object.fromEntries(Object.keys(CAPABILITY_KERNEL.relationships).map(kind=>[kind,supportProjectionEntry(kind,'relationship')]))
});

export function supportProjectionForDiagram(diagramType,recordKind='element'){
 const records=recordKind==='relationship'?SUPPORT_PROJECTION.relationships:SUPPORT_PROJECTION.elements;
 return Object.values(records).filter(item=>item.diagramTypes.includes(diagramType));
}

export function supportProjectionSummary(){
 const summarize=records=>Object.values(records).reduce((out,item)=>{out[item.supportStatus]=(out[item.supportStatus]||0)+1;return out},{});
 return freeze({diagrams:summarize(SUPPORT_PROJECTION.diagrams),elements:summarize(SUPPORT_PROJECTION.elements),relationships:summarize(SUPPORT_PROJECTION.relationships)});
}

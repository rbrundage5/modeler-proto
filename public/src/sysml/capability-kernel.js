import {DIAGRAMS,ELEMENTS,RELATIONSHIPS,SYSML_VERSION} from '../sysml-profile.js';
import {diagramCapability,elementCapabilityFor,relationshipCapabilityFor} from './conformance-registry.js';

const STATUS_FROM_MATURITY=Object.freeze({working:'complete',partial:'partial',broken:'broken',missing:'unsupported','not-tested':'partial','not-applicable':'unsupported'});
const freeze=value=>Object.freeze(value);

function supportStatus(maturity,{presentable=true}={}){
  if(!presentable)return 'import-only';
  return STATUS_FROM_MATURITY[maturity]||'partial';
}

function allDiagramTypesForElement(kind){return Object.entries(DIAGRAMS).filter(([,profile])=>(profile.elements||[]).includes(kind)).map(([name])=>name)}
function allDiagramTypesForRelationship(kind){return Object.entries(DIAGRAMS).filter(([,profile])=>(profile.relationships||[]).includes(kind)).map(([name])=>name)}

export function diagramKernelEntry(diagramType){
  const profile=DIAGRAMS[diagramType];
  if(!profile)return null;
  const qualified=diagramCapability(diagramType);
  const maturity=qualified?.maturity||'not-tested';
  return freeze({
    recordKind:'diagram',canonicalType:diagramType,profile:`SysML ${SYSML_VERSION} application profile`,
    abbreviation:profile.abbreviation||'',contextKinds:freeze([...(profile.contextKinds||['Model','Package','ModelLibrary'])]),
    elements:freeze([...(profile.elements||[])]),relationships:freeze([...(profile.relationships||[])]),
    renderer:qualified?.renderer||'svg-diagram-renderer',interactionController:qualified?.interactionController||'diagram-interaction-controller',
    requiredEditingOperations:freeze([...(qualified?.requiredEditingOperations||[])]),testFixtureId:qualified?.testFixtureId||null,
    maturity,supportStatus:supportStatus(maturity),knownLimitations:freeze([...(qualified?.knownLimitations||['No diagram-wide qualification fixture exists.'])])
  });
}

export function elementKernelEntry(kind){
  const semantic=ELEMENTS[kind];if(!semantic)return null;
  const diagramTypes=allDiagramTypesForElement(kind);
  const capabilities=diagramTypes.map(type=>({diagramType:type,capability:elementCapabilityFor(type,kind)}));
  const qualified=capabilities.filter(item=>item.capability);
  const working=qualified.length>0&&qualified.every(item=>item.capability.maturity==='working');
  const partial=qualified.some(item=>item.capability?.maturity==='partial');
  const maturity=working?'working':partial||qualified.length?'partial':'not-tested';
  const explicitOwnerKinds=semantic.ownerKinds||[];
  const presentationMode=diagramTypes.length?'direct':explicitOwnerKinds.length?'owned':'none';
  return freeze({
    recordKind:'element',canonicalType:kind,metaclass:semantic.metaclass||kind,stereotype:semantic.stereotype||'',
    ownerKinds:freeze([...(semantic.ownerKinds||['Model','Package','ModelLibrary'])]),compartments:freeze([...(semantic.compartments||[])]),presentationMode,
    diagramTypes:freeze(diagramTypes),capabilities:freeze(capabilities.map(({diagramType,capability})=>freeze({diagramType,maturity:capability?.maturity||'not-tested',presentationType:capability?.presentationType||null,placementMode:capability?.placementMode||null,testFixtureId:capability?.testFixtureId||null}))),
    maturity,supportStatus:supportStatus(maturity,{presentable:presentationMode!=='none'}),
    knownLimitations:freeze([...new Set(qualified.flatMap(item=>item.capability.knownLimitations||[]))])
  });
}

export function relationshipKernelEntry(kind){
  const semantic=RELATIONSHIPS[kind];if(!semantic)return null;
  const diagramTypes=allDiagramTypesForRelationship(kind);
  const capabilities=diagramTypes.map(type=>({diagramType:type,capability:relationshipCapabilityFor(type,kind)}));
  const qualified=capabilities.filter(item=>item.capability);
  const working=qualified.length>0&&qualified.every(item=>item.capability.maturity==='working');
  const partial=qualified.some(item=>item.capability?.maturity==='partial');
  const maturity=working?'working':partial||qualified.length?'partial':'not-tested';
  return freeze({
    recordKind:'relationship',canonicalType:kind,metaclass:semantic.metaclass||kind,stereotype:semantic.stereotype||'',source:semantic.source,target:semantic.target,
    diagramTypes:freeze(diagramTypes),capabilities:freeze(capabilities.map(({diagramType,capability})=>freeze({diagramType,maturity:capability?.maturity||'not-tested',testFixtureId:capability?.testFixtureId||null}))),
    maturity,supportStatus:supportStatus(maturity,{presentable:diagramTypes.length>0}),knownLimitations:freeze([...new Set(qualified.flatMap(item=>item.capability.knownLimitations||[]))])
  });
}

export const CAPABILITY_KERNEL=freeze({
  schemaVersion:2,sysmlVersion:SYSML_VERSION,
  diagrams:freeze(Object.fromEntries(Object.keys(DIAGRAMS).map(type=>[type,diagramKernelEntry(type)]))),
  elements:freeze(Object.fromEntries(Object.keys(ELEMENTS).map(kind=>[kind,elementKernelEntry(kind)]))),
  relationships:freeze(Object.fromEntries(Object.keys(RELATIONSHIPS).map(kind=>[kind,relationshipKernelEntry(kind)])))
});

export function capabilityKernelEntry(kind,recordKind='element'){
  if(recordKind==='diagram')return CAPABILITY_KERNEL.diagrams[kind]||null;
  if(recordKind==='relationship')return CAPABILITY_KERNEL.relationships[kind]||null;
  return CAPABILITY_KERNEL.elements[kind]||null;
}

export function capabilityKernelSummary(){
  const summarize=records=>Object.values(records).reduce((out,item)=>{out[item.supportStatus]=(out[item.supportStatus]||0)+1;return out},{});
  return freeze({diagrams:summarize(CAPABILITY_KERNEL.diagrams),elements:summarize(CAPABILITY_KERNEL.elements),relationships:summarize(CAPABILITY_KERNEL.relationships)});
}

import {ELEMENTS,RELATIONSHIPS,DIAGRAMS} from "./sysml-profile.js";
import {synchronizeSemanticModel} from './semantic-core.js';
export const DIAGRAM_TYPES=Object.keys(DIAGRAMS);
export function uid(prefix="id"){return `${prefix}-${crypto.randomUUID()}`}
export function createProject(name="New Systems Model"){
  const rootId=uid("model");
  const now=new Date().toISOString();
  return {
    schemaVersion:"3.0",
    sysmlVersion:"1.6",
    id:uid("project"),
    name,
    revision:0,
    branch:"main",
    root:{
      id:rootId,
      externalId:rootId,
      name,
      kind:"Model",
      metaclass:"Model",
      stereotype:"",
      ownerId:null,
      documentation:"",
      tags:{}
    },
    elements:[],
    relationships:[],
    diagrams:[],
    activeDiagramId:null,
    commits:[],
    metadata:{
      createdAt:now,
      updatedAt:now,
      projectTemplate:"blank",
      seededPackages:false
    }
  };
}
export function allElements(p){return[p.root,...p.elements]}
export function findElement(p,id){return allElements(p).find(e=>e.id===id)||null}
export function findRelationship(p,id){return(p.relationships||[]).find(r=>r.id===id)||null}
export function qualifiedName(p,id){
  const parts=[];let e=findElement(p,id),seen=new Set();
  while(e&&!seen.has(e.id)){seen.add(e.id);parts.unshift(e.name||e.id);e=findElement(p,e.ownerId)}
  return parts.join("::");
}
export function refreshQualifiedNames(p){for(const e of allElements(p))e.qualifiedNameString=qualifiedName(p,e.id)}
export function defaultElement(kind,ownerId){
  const d=ELEMENTS[kind]||{metaclass:kind};
  return {id:uid(kind.toLowerCase()),externalId:uid("EXT").toUpperCase(),name:kind,kind,
    metaclass:d.metaclass||kind,stereotype:d.stereotype||"",ownerId,documentation:"",
    multiplicity:"1",multiplicityLower:"1",multiplicityUpper:"1",typeRef:"",direction:"inout",requirementId:"",requirementText:"",
    associationEnds:[],navigable:true,redefinedPropertyIds:[],subsettedPropertyIds:[],isConjugated:false,providedInterfaceIds:[],requiredInterfaceIds:[],nestedPropertyPath:[],partWithPortPath:[],connectorTypeRef:"",connectorKind:"assembly",conveyedIds:[],
    lifecycleStatus:"Draft",priority:"Medium",risk:"Medium",rationale:"",source:"",requirementOwner:"",verificationMethod:"Analysis",approvalStatus:"Unapproved",approvedBy:"",approvedAt:"",baselineIds:[],suspect:false,
    constraintExpression:"",dimension:"",
    defaultValue:"",unitRef:"",quantityKindRef:"",isAbstract:false,isReadOnly:false,
    compartments:{parts:[],references:[],values:[],flowProperties:[],ports:[],operations:[],constraints:[],parameters:[],providedInterfaces:[],requiredInterfaces:[],literals:[],slots:[]},
    compartmentVisibility:{parts:true,references:true,values:true,flowProperties:true,ports:true,operations:false,constraints:true,parameters:true,providedInterfaces:true,requiredInterfaces:true,literals:true,slots:true},
    tags:{}};
}
export function defaultRelationship(kind,sourceId,targetId,ownerId){
  const d=RELATIONSHIPS[kind]||{};
  return {id:uid("rel"),externalId:uid("EXT").toUpperCase(),name:"",kind,
    metaclass:kind,stereotype:d.stereotype||"",sourceId,targetId,ownerId,
    sourceRole:"",targetRole:"",sourceMultiplicity:"1",targetMultiplicity:"1",sourceNavigable:true,targetNavigable:true,sourceAggregation:"none",targetAggregation:kind==="Composition"?"composite":kind==="Aggregation"?"shared":"none",sourceEndOwned:false,targetEndOwned:["Association","Composition","Aggregation"].includes(kind),
    sourceEndId:uid("end"),targetEndId:uid("end"),sourcePartWithPortPath:[],targetPartWithPortPath:[],connectorTypeRef:"",connectorKind:"assembly",conveyedIds:[],guard:"",weight:"1",triggerId:"",eventId:"",effect:"",messageSort:"synchronous",sequenceOrder:0,documentation:"",tags:{}};
}
export function relationshipStyle(kind){
  const n=RELATIONSHIPS[kind]?.notation||"solid";
  return {dashed:n.startsWith("dashed"),marker:n.includes("triangle")?"triangle":n.includes("filled-diamond")?"diamondFilled":n.includes("diamond")?"diamond":n.includes("open")?"open":"none"};
}
export function multiplicityFromBounds(lower="1",upper="1"){const lo=String(lower??"1").trim()||"0",hi=String(upper??lo).trim()||lo;return lo===hi?lo:`${lo}..${hi}`}
export function normalizeProject(p){
  p.relationships=p.relationships||[];p.commits=p.commits||[];p.branch=p.branch||"main";p.requirementBaselines=p.requirementBaselines||[];p.analysisRuns=p.analysisRuns||[];p.savedViews=p.savedViews||[];p.savedQueries=p.savedQueries||[];p.libraries=p.libraries||[];p.profiles=p.profiles||[];p.importHistory=p.importHistory||[];p.attachments=p.attachments||[];p.configurations=p.configurations||[];
  for(const e of allElements(p)){e.compartments=e.compartments||{};e.compartmentVisibility=e.compartmentVisibility||{};if(e.multiplicityLower==null||e.multiplicityUpper==null){const m=String(e.multiplicity||"1").trim();if(m.includes("..")){const [lo,hi]=m.split("..",2);e.multiplicityLower=lo||"0";e.multiplicityUpper=hi||"*"}else{e.multiplicityLower=m||"1";e.multiplicityUpper=m||"1"}}e.multiplicity=multiplicityFromBounds(e.multiplicityLower,e.multiplicityUpper)}
  for(const d of p.diagrams||[]){d.nodes=d.nodes||[];d.edges=d.edges||[]}
  synchronizeSemanticModel(p);refreshQualifiedNames(p);return p;
}

import {DIAGRAMS,ELEMENTS,RELATIONSHIPS} from './sysml-profile.js';
import {nodeNotation,relationshipNotation} from './notation-rules.js';

const DEFAULT_SIZE=Object.freeze({width:190,height:110,minWidth:120,minHeight:54});
const SHAPE_SIZE=Object.freeze({
 actor:{width:100,height:120,minWidth:70,minHeight:100},'use-case':{width:180,height:90,minWidth:120,minHeight:60},
 initial:{width:40,height:40,minWidth:24,minHeight:24},final:{width:40,height:40,minWidth:28,minHeight:28},'flow-final':{width:40,height:40,minWidth:28,minHeight:28},
 diamond:{width:40,height:40,minWidth:28,minHeight:28},junction:{width:40,height:40,minWidth:20,minHeight:20},history:{width:40,height:40,minWidth:28,minHeight:28},'deep-history':{width:40,height:40,minWidth:28,minHeight:28},
 bar:{width:100,height:20,minWidth:60,minHeight:12},'proxy-port':{width:18,height:18,minWidth:14,minHeight:14},'full-port':{width:18,height:18,minWidth:14,minHeight:14},
 action:{width:190,height:110,minWidth:120,minHeight:54},state:{width:190,height:110,minWidth:120,minHeight:60}
});

const diagramsFor=(kind,key)=>Object.entries(DIAGRAMS).filter(([,definition])=>definition[key].includes(kind)).map(([diagramType])=>diagramType);

export const ELEMENT_NOTATION=Object.freeze(Object.fromEntries(Object.entries(ELEMENTS).map(([kind,definition])=>{
  const shape=nodeNotation(kind),size=SHAPE_SIZE[shape]||DEFAULT_SIZE;
  return [kind,Object.freeze({kind,metaclass:definition.metaclass,shape,keyword:definition.stereotype||'',allowedDiagramTypes:Object.freeze(diagramsFor(kind,'elements')),compartments:Object.freeze([...(definition.compartments||[])]),boundaryAttached:['ProxyPort','FullPort','InputPin','OutputPin'].includes(kind),...size})];
})));

export const RELATIONSHIP_NOTATION=Object.freeze(Object.fromEntries(Object.keys(RELATIONSHIPS).map(kind=>{
  const presentation=relationshipNotation({kind});
  return [kind,Object.freeze({kind,allowedDiagramTypes:Object.freeze(diagramsFor(kind,'relationships')),...presentation})];
})));

export const DIAGRAM_NOTATION=Object.freeze(Object.fromEntries(Object.entries(DIAGRAMS).map(([diagramType,definition])=>[diagramType,Object.freeze({diagramType,abbreviation:definition.abbreviation,contextKinds:Object.freeze([...(definition.contextKinds||[])]),frame:true})])));

export function notationForElement(kind,diagramType){const entry=ELEMENT_NOTATION[kind];return entry&&(!diagramType||entry.allowedDiagramTypes.includes(diagramType))?entry:null}
export function notationForRelationship(relationship,diagramType){const entry=RELATIONSHIP_NOTATION[relationship?.kind||relationship];if(!entry||diagramType&&!entry.allowedDiagramTypes.includes(diagramType))return null;return Object.freeze({...entry,...relationshipNotation(typeof relationship==='string'?{kind:relationship}:relationship)})}
export function notationCoverageIssues(){const issues=[];for(const [diagramType,definition] of Object.entries(DIAGRAMS)){for(const kind of definition.elements)if(!notationForElement(kind,diagramType))issues.push(`${diagramType}: missing ${kind} element notation`);for(const kind of definition.relationships)if(!notationForRelationship(kind,diagramType))issues.push(`${diagramType}: missing ${kind} relationship notation`)}return issues}

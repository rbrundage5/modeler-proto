import {ELEMENTS} from './sysml-profile.js';
import {inheritedFeatures} from './semantic-core.js';

export const COMPARTMENT_DEFINITIONS = Object.freeze({
  parts:{label:'parts',kinds:['PartProperty']},
  references:{label:'references',kinds:['ReferenceProperty']},
  values:{label:'values',kinds:['ValueProperty']},
  flowProperties:{label:'flow properties',kinds:['FlowProperty']},
  ports:{label:'ports',kinds:['ProxyPort','FullPort']},
  operations:{label:'operations',kinds:['Operation','Reception']},
  constraints:{label:'constraints',kinds:['ConstraintProperty']},
  parameters:{label:'parameters',kinds:['Parameter']},
  providedInterfaces:{label:'provided interfaces',kinds:[]},
  requiredInterfaces:{label:'required interfaces',kinds:[]},
  literals:{label:'literals',kinds:['EnumerationLiteral']},
  slots:{label:'slots',kinds:['Slot']}
});

const DEFAULT_VISIBILITY={
  parts:true,references:true,values:true,flowProperties:true,ports:true,
  operations:false,constraints:true,parameters:true,providedInterfaces:true,
  requiredInterfaces:true,literals:true,slots:true
};

export function compartmentNames(element){
  return [...(ELEMENTS[element?.kind]?.compartments||[])];
}

export function supportsCompartments(element){return compartmentNames(element).length>0}

export function ensureCompartmentState(element){
  const names=compartmentNames(element);
  element.compartments=element.compartments||{};
  element.compartmentVisibility=element.compartmentVisibility||{};
  for(const name of names){
    if(!Array.isArray(element.compartments[name]))element.compartments[name]=[];
    if(typeof element.compartmentVisibility[name]!=='boolean')element.compartmentVisibility[name]=DEFAULT_VISIBILITY[name]!==false;
  }
  return names;
}

function typeName(project,id){return project.elements.find(e=>e.id===id)?.name||id||''}
function multiplicityText(e){return e.multiplicity&&e.multiplicity!=='1'?` [${e.multiplicity}]`:''}
function directionText(e){return e.kind==='FlowProperty'&&e.direction?`${e.direction} `:''}
function defaultText(e){return e.defaultValue!==''&&e.defaultValue!==undefined?` = ${e.defaultValue}`:''}

export function formatFeature(project,e){
  if(typeof e==='string')return e;
  if(!e)return '';
  if(e.kind==='Operation')return `${e.name}()`;
  if(e.kind==='Reception')return `«signal» ${e.name}`;
  if(e.kind==='EnumerationLiteral')return e.name;
  if(e.kind==='Slot')return `${e.name}${defaultText(e)}`;
  const type=e.typeRef?`: ${typeName(project,e.typeRef)}`:'';
  const conjugated=e.isConjugated?' ~':'';
  const inheritance=e.isInherited?'^ ':'';
  return `${inheritance}${directionText(e)}${e.name}${conjugated}${type}${multiplicityText(e)}${defaultText(e)}`.trim();
}

export function getCompartmentRows(project,element,name){
  ensureCompartmentState(element);
  if(name==='providedInterfaces')return (element.providedInterfaceIds||[]).map(id=>typeName(project,id)).filter(Boolean);
  if(name==='requiredInterfaces')return (element.requiredInterfaceIds||[]).map(id=>typeName(project,id)).filter(Boolean);
  const kinds=COMPARTMENT_DEFINITIONS[name]?.kinds||[];
  const semantic=kinds.length?[...project.elements.filter(e=>e.ownerId===element.id&&kinds.includes(e.kind)),...inheritedFeatures(project,element.id).filter(e=>kinds.includes(e.kind))]:[];
  const legacy=(element.compartments?.[name]||[]).filter(item=>{
    const value=formatFeature(project,item);
    return value&&!semantic.some(e=>formatFeature(project,e)===value);
  });
  return [...semantic,...legacy];
}

export function visibleCompartments(project,element){
  return ensureCompartmentState(element)
    .filter(name=>element.compartmentVisibility[name])
    .map(name=>({name,label:COMPARTMENT_DEFINITIONS[name]?.label||name,rows:getCompartmentRows(project,element,name)}))
    .filter(c=>c.rows.length>0);
}

export function minimumNodeHeight(project,element,headerBottom=42){
  const compartments=visibleCompartments(project,element);
  if(!compartments.length)return Math.max(54,headerBottom+12);
  return Math.max(72,headerBottom+compartments.reduce((sum,c)=>sum+23+Math.max(1,c.rows.length)*16,0)+5);
}

export function compartmentAddKind(name){return COMPARTMENT_DEFINITIONS[name]?.kinds?.[0]||null}

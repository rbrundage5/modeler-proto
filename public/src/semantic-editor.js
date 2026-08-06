import {allElements,findElement,qualifiedName,multiplicityFromBounds} from './model.js';

const PROPERTY_KINDS=new Set(['PartProperty','ReferenceProperty','ValueProperty','FlowProperty','ConstraintProperty']);
const PORT_KINDS=new Set(['ProxyPort','FullPort']);
const PARAMETER_KINDS=new Set(['Parameter','ActivityParameterNode','InputPin','OutputPin']);

export function isTypedFeature(e){return PROPERTY_KINDS.has(e?.kind)||PORT_KINDS.has(e?.kind)||PARAMETER_KINDS.has(e?.kind)}
export function supportsDirection(e){return ['FlowProperty','Parameter','ActivityParameterNode','InputPin','OutputPin'].includes(e?.kind)}
export function supportsDefault(e){return ['ValueProperty','FlowProperty','Parameter','Slot'].includes(e?.kind)}
export function supportsConjugation(e){return e?.kind==='ProxyPort'}

export function validTypeKinds(kind){
  if(kind==='PartProperty')return ['Block','AssociationBlock'];
  if(kind==='ReferenceProperty')return ['Block','AssociationBlock','InterfaceBlock','DataType','ValueType'];
  if(kind==='ValueProperty')return ['ValueType','DataType','Enumeration','Unit','QuantityKind'];
  if(kind==='FlowProperty')return ['ValueType','DataType','Enumeration','Signal','Block'];
  if(kind==='ConstraintProperty')return ['ConstraintBlock'];
  if(kind==='ProxyPort')return ['InterfaceBlock'];
  if(kind==='FullPort')return ['Block','InterfaceBlock','Signal'];
  if(PARAMETER_KINDS.has(kind))return ['ValueType','DataType','Enumeration','Block','Signal'];
  return ['Block','InterfaceBlock','ValueType','DataType','ConstraintBlock','Enumeration','Signal'];
}
export function typeOptions(project,feature){
  const kinds=validTypeKinds(feature.kind);
  return allElements(project).filter(e=>e.id!==feature.id&&kinds.includes(e.kind)).sort((a,b)=>qualifiedName(project,a.id).localeCompare(qualifiedName(project,b.id))).map(e=>[e.id,`${qualifiedName(project,e.id)} — ${e.kind}`]);
}
export function normalizeBound(value,isUpper=false){
  const v=String(value??'').trim();
  if(isUpper&&v==='*')return '*';
  if(!/^\d+$/.test(v))return null;
  return String(Number(v));
}
export function setMultiplicity(feature,lower,upper){
  const lo=normalizeBound(lower,false),hi=normalizeBound(upper,true);
  if(lo==null||hi==null)return {ok:false,message:'Multiplicity bounds must be non-negative integers; upper may also be *.'};
  if(hi!=='*'&&Number(lo)>Number(hi))return {ok:false,message:'Lower multiplicity cannot be greater than upper multiplicity.'};
  feature.multiplicityLower=lo;feature.multiplicityUpper=hi;feature.multiplicity=multiplicityFromBounds(lo,hi);
  return {ok:true,value:feature.multiplicity};
}
export function semanticIssues(project,e){
  const issues=[];
  if(isTypedFeature(e)&&!e.typeRef)issues.push({severity:'error',message:'A semantic classifier is required.'});
  if(e.typeRef){const t=findElement(project,e.typeRef),valid=validTypeKinds(e.kind);if(!t)issues.push({severity:'error',message:'The selected type cannot be resolved.'});else if(!valid.includes(t.kind))issues.push({severity:'error',message:`${e.kind} cannot be typed by ${t.kind}.`})}
  const lo=normalizeBound(e.multiplicityLower??String(e.multiplicity||'1').split('..')[0]),hi=normalizeBound(e.multiplicityUpper??(String(e.multiplicity||'1').split('..')[1]||String(e.multiplicity||'1').split('..')[0]),true);
  if(lo==null||hi==null)issues.push({severity:'error',message:'Multiplicity is invalid.'});else if(hi!=='*'&&Number(lo)>Number(hi))issues.push({severity:'error',message:'Multiplicity lower bound exceeds upper bound.'});
  if(supportsDirection(e)&&!['in','out','inout'].includes(e.direction))issues.push({severity:'error',message:'Direction must be in, out, or inout.'});
  if(e.kind==='ProxyPort'&&e.typeRef&&findElement(project,e.typeRef)?.kind!=='InterfaceBlock')issues.push({severity:'error',message:'A Proxy Port must be typed by an Interface Block.'});
  return issues;
}

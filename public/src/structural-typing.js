import {defaultElement,findElement,normalizeProject,refreshQualifiedNames} from './model.js';
import {showElementOnDiagram} from './diagram-presentations.js';
import {setMultiplicity,validTypeKinds} from './semantic-editor.js';

export const STRUCTURAL_TYPING_KINDS=Object.freeze(['DataType','ValueType','ValueProperty']);
const DEFINITION_OWNERS=new Set(['Model','Package','ModelLibrary']);
const PROPERTY_OWNERS=new Set(['Block','AssociationBlock','InterfaceBlock','ConstraintBlock','SiteContext']);
const clone=value=>globalThis.structuredClone?structuredClone(value):JSON.parse(JSON.stringify(value));

export function structuralTypingIssues(project,element){
  const issues=[],issue=(field,code,message)=>issues.push({severity:'error',field,code,message,id:element?.id});
  if(!STRUCTURAL_TYPING_KINDS.includes(element?.kind))return issues;
  const owner=findElement(project,element.ownerId);
  if(['DataType','ValueType'].includes(element.kind)&&!DEFINITION_OWNERS.has(owner?.kind))issue('ownerId','STRUCTURAL_TYPE_OWNER_INVALID',`${element.kind} owner must be a Model, Package, or Model Library.`);
  if(element.kind==='ValueProperty'&&!PROPERTY_OWNERS.has(owner?.kind))issue('ownerId','VALUE_PROPERTY_OWNER_INVALID','ValueProperty owner must be a supported classifier.');
  if(element.kind==='ValueProperty'){
    const type=findElement(project,element.typeRef);
    if(!element.typeRef)issue('typeRef','VALUE_PROPERTY_TYPE_REQUIRED','ValueProperty requires a semantic type.');
    else if(!type)issue('typeRef','VALUE_PROPERTY_TYPE_UNRESOLVED','ValueProperty type reference cannot be resolved.');
    else if(!validTypeKinds('ValueProperty').includes(type.kind))issue('typeRef','VALUE_PROPERTY_TYPE_INCOMPATIBLE',`ValueProperty cannot be typed by ${type.kind}.`);
    const copy=clone(element),multiplicity=setMultiplicity(copy,element.multiplicityLower??'1',element.multiplicityUpper??'1');
    if(!multiplicity.ok)issue('multiplicity', 'VALUE_PROPERTY_MULTIPLICITY_INVALID',multiplicity.message);
  }
  if(element.kind==='ValueType')for(const [field,kind,label] of [['unitRef','Unit','Unit'],['quantityKindRef','QuantityKind','Quantity kind']])if(element[field]){
    const target=findElement(project,element[field]);
    if(!target)issue(field,`VALUE_TYPE_${field.toUpperCase()}_UNRESOLVED`,`${label} reference cannot be resolved.`);
    else if(target.kind!==kind)issue(field,`VALUE_TYPE_${field.toUpperCase()}_INCOMPATIBLE`,`${label} must reference a ${kind}.`);
  }
  return issues;
}

export function createStructuralTypingElement(project,kind,values={}){
  if(!STRUCTURAL_TYPING_KINDS.includes(kind))throw Error(`${kind} is not part of the structural typing path.`);
  if(values.id&&findElement(project,values.id))throw Error(`Duplicate semantic ID: ${values.id}`);
  const element=Object.assign(defaultElement(kind,values.ownerId||project.root.id),values,{kind});
  if(kind==='DataType')Object.assign(element,{metaclass:'DataType',stereotype:'',semanticRole:'Definition'});
  if(kind==='ValueType')Object.assign(element,{metaclass:'DataType',stereotype:'valueType',semanticRole:'Definition'});
  if(kind==='ValueProperty')Object.assign(element,{metaclass:'Property',stereotype:'value',semanticRole:'Usage',definitionId:values.typeRef||'',composition:'none',aggregation:'none'});
  const issues=structuralTypingIssues(project,element);if(issues.length)throw Object.assign(Error(issues[0].message),{issues});
  project.elements.push(element);refreshQualifiedNames(project);return element;
}

function resolveStable(project,id,kind,field,index){
  if(!id)return null;const target=findElement(project,id);
  if(!target)throw Object.assign(Error(`${field} cannot be resolved by stable semantic identity: ${id}`),{field,index,code:'STRUCTURAL_IMPORT_REFERENCE_UNRESOLVED'});
  if(kind&&!kind.includes(target.kind))throw Object.assign(Error(`${field} resolves to incompatible ${target.kind}.`),{field,index,code:'STRUCTURAL_IMPORT_REFERENCE_INCOMPATIBLE'});
  return target;
}

/** Transactional, stable-ID-only import for the completed structural typing path. */
export function importStructuralTyping(project,payload,{source='structural-typing-import'}={}){
  const working=normalizeProject(clone(project)),created=[],updated=[],presented=[];
  try{
    const records=payload.elements||[];
    for(const [index,record] of records.entries()){
      if(!STRUCTURAL_TYPING_KINDS.includes(record.kind))throw Object.assign(Error(`Unsupported structural typing kind: ${record.kind}`),{field:'kind',index});
      if(!record.id)throw Object.assign(Error('A stable semantic ID is required.'),{field:'id',index});
      const existing=findElement(working,record.id);
      if(existing&&existing.kind!==record.kind)throw Object.assign(Error(`Stable ID ${record.id} resolves to ${existing.kind}, not ${record.kind}.`),{field:'id',index});
      const owner=resolveStable(working,record.ownerId,null,'ownerId',index);
      if(record.kind==='ValueProperty')resolveStable(working,record.typeRef,validTypeKinds('ValueProperty'),'typeRef',index);
      if(record.kind==='ValueType'){
        if(record.unitRef)resolveStable(working,record.unitRef,['Unit'],'unitRef',index);
        if(record.quantityKindRef)resolveStable(working,record.quantityKindRef,['QuantityKind'],'quantityKindRef',index);
      }
      let element=existing;
      if(element){Object.assign(element,clone(record),{id:existing.id,kind:existing.kind,ownerId:owner.id});updated.push(element.id)}
      else{element=createStructuralTypingElement(working,record.kind,{...clone(record),ownerId:owner.id});created.push(element.id)}
      element.provenance={source,stableId:record.id};
      const issues=structuralTypingIssues(working,element);if(issues.length)throw Object.assign(Error(issues[0].message),{issues,field:issues[0].field,index});
    }
    for(const [index,presentation] of (payload.presentations||[]).entries()){
      const element=resolveStable(working,presentation.elementId,STRUCTURAL_TYPING_KINDS,'elementId',index),diagram=(working.diagrams||[]).find(item=>item.id===presentation.diagramId);
      if(!diagram)throw Object.assign(Error(`diagramId cannot be resolved: ${presentation.diagramId}`),{field:'diagramId',index});
      const existing=diagram.nodes.find(node=>node.id===presentation.id||node.elementId===element.id);
      if(existing){Object.assign(existing,{x:presentation.x??existing.x,y:presentation.y??existing.y,width:presentation.width??existing.width,height:presentation.height??existing.height});presented.push(existing.id);continue}
      const result=showElementOnDiagram(working,element.id,diagram.id,{x:presentation.x??80,y:presentation.y??80},{presentationId:presentation.id,source:'import'});
      if(!result.created)throw Object.assign(Error(result.message),{field:'elementId',index});presented.push(result.node.id);
    }
    normalizeProject(working);Object.keys(project).forEach(key=>delete project[key]);Object.assign(project,working);
    return{applied:true,created,updated,presented,duplicates:0};
  }catch(error){return{applied:false,created:[],updated:[],presented:[],error,field:error.field||error.issues?.[0]?.field||null}}
}

export function normalizeStructuralTyping(project){
  for(const element of project.elements||[]){
    if(element.kind==='DataType')Object.assign(element,{metaclass:'DataType',stereotype:'',semanticRole:'Definition'});
    if(element.kind==='ValueType')Object.assign(element,{metaclass:'DataType',stereotype:'valueType',semanticRole:'Definition',unitRef:element.unitRef||'',quantityKindRef:element.quantityKindRef||''});
    if(element.kind==='ValueProperty')Object.assign(element,{metaclass:'Property',stereotype:'value',semanticRole:'Usage',definitionId:element.typeRef||element.definitionId||'',composition:'none',aggregation:'none'});
  }
  return project;
}

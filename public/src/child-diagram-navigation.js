import './repository-diagram-interactions.js';
import {DIAGRAMS,ELEMENTS} from './sysml-profile.js';
const SVG_NS='http://www.w3.org/2000/svg';
const $=id=>document.getElementById(id);
const clone=value=>typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));

function api(){return globalThis.SystemsModelerAPI}
function project(){return api()?.getProject?.()||null}
function activeDiagram(p=project()){return p?.diagrams?.find(d=>d.id===p.activeDiagramId)||p?.diagrams?.[0]||null}
function semanticElement(p,id){return [p?.root,...(p?.elements||[])].find(item=>item?.id===id)||null}
function uid(prefix){return`${prefix}_${globalThis.crypto?.randomUUID?.()||`${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`}`}

const EXPLICIT_CHILD_TYPES=Object.freeze({
  Model:['Block Definition Diagram','Requirement Diagram','Use Case Diagram','Package Diagram','Allocation Diagram','Instance Diagram'],
  Package:['Block Definition Diagram','Requirement Diagram','Use Case Diagram','Package Diagram','Allocation Diagram','Instance Diagram'],
  ModelLibrary:['Block Definition Diagram','Requirement Diagram','Package Diagram','Allocation Diagram'],
  Profile:['Package Diagram','Block Definition Diagram'],
  View:['Package Diagram','Requirement Diagram'],
  Block:['Block Definition Diagram','Internal Block Diagram','Requirement Diagram','Use Case Diagram','State Machine Diagram','Sequence Diagram','Parametric Diagram','Allocation Diagram'],
  AssociationBlock:['Block Definition Diagram','Requirement Diagram','Allocation Diagram'],
  InterfaceBlock:['Block Definition Diagram','Requirement Diagram','Allocation Diagram'],
  ConstraintBlock:['Block Definition Diagram','Parametric Diagram','Requirement Diagram'],
  Requirement:['Requirement Diagram'],
  TestCase:['Requirement Diagram'],
  UseCase:['Use Case Diagram','Sequence Diagram','Requirement Diagram'],
  Activity:['Activity Diagram','Requirement Diagram','Allocation Diagram'],
  StateMachine:['State Machine Diagram'],
  Interaction:['Sequence Diagram'],
  InstanceSpecification:['Instance Diagram'],
  Configuration:['Instance Diagram']
});
const PREFERRED={Block:'Internal Block Diagram',Activity:'Activity Diagram',StateMachine:'State Machine Diagram',Interaction:'Sequence Diagram',ConstraintBlock:'Parametric Diagram',UseCase:'Sequence Diagram',Requirement:'Requirement Diagram',InstanceSpecification:'Instance Diagram',Configuration:'Instance Diagram'};

export function childDiagramTypesForKind(kind){const result=new Set(EXPLICIT_CHILD_TYPES[kind]||[]);for(const[type,definition]of Object.entries(DIAGRAMS))if((definition.contextKinds||[]).includes(kind))result.add(type);return[...result].filter(type=>Boolean(DIAGRAMS[type])).sort((a,b)=>a.localeCompare(b))}
export function canOwnChildDiagram(kind,diagramType){return childDiagramTypesForKind(kind).includes(diagramType)}

export function childDiagramsFor(p,elementId){
  if(!p||!elementId)return[];
  const element=semanticElement(p,elementId),byId=new Map((p.diagrams||[]).map(diagram=>[diagram.id,diagram])),result=[],seen=new Set();
  const add=diagram=>{if(diagram&&!seen.has(diagram.id)){seen.add(diagram.id);result.push(diagram)}};
  if(element?.primaryChildDiagramId)add(byId.get(element.primaryChildDiagramId));
  for(const id of element?.childDiagramIds||[])add(byId.get(id));
  for(const diagram of p.diagrams||[])if(diagram.contextId===elementId||diagram.ownerId===elementId)add(diagram);
  return result;
}

export function preferredChildDiagram(p,elementId){
  const children=childDiagramsFor(p,elementId);if(!children.length)return null;
  const element=semanticElement(p,elementId),preferred=PREFERRED[element?.kind]||childDiagramTypesForKind(element?.kind)[0];
  return children.find(diagram=>diagram.id===element?.primaryChildDiagramId)||children.find(diagram=>diagram.isPrimary===true)||children.find(diagram=>preferred&&diagram.diagramType===preferred)||children.slice().sort((a,b)=>String(a.name||a.id).localeCompare(String(b.name||b.id)))[0];
}

export function normalizeDiagramContainment(p){
  if(!p)return false;let changed=false;const known=new Set([p.root?.id,...(p.elements||[]).map(item=>item.id)]);
  for(const diagram of p.diagrams||[]){
    const context=semanticElement(p,diagram.contextId),owner=semanticElement(p,diagram.ownerId);
    if(context&&canOwnChildDiagram(context.kind,diagram.diagramType)&&diagram.ownerId!==context.id){diagram.ownerId=context.id;changed=true}
    else if(!owner&&context){diagram.ownerId=context.id;changed=true}
    else if(!known.has(diagram.ownerId)&&p.root?.id){diagram.ownerId=p.root.id;changed=true}
    const semanticOwner=semanticElement(p,diagram.ownerId);if(!semanticOwner)continue;
    semanticOwner.childDiagramIds=Array.isArray(semanticOwner.childDiagramIds)?semanticOwner.childDiagramIds:[];
    if(!semanticOwner.childDiagramIds.includes(diagram.id)){semanticOwner.childDiagramIds.push(diagram.id);changed=true}
    const preferred=PREFERRED[semanticOwner.kind];if(!semanticOwner.primaryChildDiagramId&&(preferred===diagram.diagramType||semanticOwner.childDiagramIds.length===1)){semanticOwner.primaryChildDiagramId=diagram.id;changed=true}
  }
  return changed;
}

export function createChildDiagram(elementId,diagramType){
  const service=api(),current=service?.getProject?.(),element=semanticElement(current,elementId);if(!service||!current||!element)return null;
  if(!canOwnChildDiagram(element.kind,diagramType)){service.log?.(`${element.kind} cannot own a ${diagramType}.`,'warn');return null}
  const existing=childDiagramsFor(current,elementId).find(diagram=>diagram.diagramType===diagramType);if(existing){navigateToDiagram(existing.id);return existing}
  const next=clone(current),owner=semanticElement(next,elementId),abbr=DIAGRAMS[diagramType]?.abbreviation||'diagram',diagram={id:uid('diagram'),externalId:uid('DGM').toUpperCase(),name:`${owner.name||owner.id} ${abbr}`,diagramType,ownerId:owner.id,contextId:owner.id,nodes:[],edges:[],documentation:'',isPrimary:!owner.primaryChildDiagramId};
  next.diagrams??=[];next.diagrams.push(diagram);owner.childDiagramIds=Array.isArray(owner.childDiagramIds)?owner.childDiagramIds:[];owner.childDiagramIds.push(diagram.id);if(!owner.primaryChildDiagramId||PREFERRED[owner.kind]===diagramType)owner.primaryChildDiagramId=diagram.id;next.activeDiagramId=diagram.id;service.setProject(next);service.log?.(`Created ${diagramType} under ${owner.name||owner.id}.`,'ok');return diagram;
}

function navigateToDiagram(diagramId){
  const service=api();if(!service||!diagramId)return false;
  const current=service.getProject?.();if(!current||(current.diagrams||[]).every(diagram=>diagram.id!==diagramId))return false;
  if(current.activeDiagramId===diagramId)return true;
  const next=clone(current),previous=next.activeDiagramId;
  next.uiState??={};next.uiState.diagramNavigationBack=Array.isArray(next.uiState.diagramNavigationBack)?next.uiState.diagramNavigationBack:[];next.uiState.diagramNavigationForward=[];
  if(previous&&previous!==diagramId){next.uiState.diagramNavigationBack.push(previous);if(next.uiState.diagramNavigationBack.length>100)next.uiState.diagramNavigationBack.shift()}
  next.activeDiagramId=diagramId;service.setProject(next);const select=$('diagramSelect');if(select)select.value=diagramId;globalThis.dispatchEvent(new CustomEvent('systems-modeler-diagram-navigated',{detail:{from:previous,to:diagramId}}));return true;
}

function diagramsPresentingElement(p,elementId){return(p?.diagrams||[]).filter(diagram=>(diagram.nodes||[]).some(node=>node.elementId===elementId))}
function revealElementFromTree(elementId){const p=project();if(!p||!elementId)return false;const candidates=diagramsPresentingElement(p,elementId);if(!candidates.length){api()?.log?.('This element has no diagram presentation to reveal.','warn');return false}const current=candidates.find(diagram=>diagram.id===p.activeDiagramId),target=current||candidates.find(diagram=>diagram.isPrimary===true)||candidates.slice().sort((a,b)=>String(a.name||a.id).localeCompare(String(b.name||b.id)))[0];navigateToDiagram(target.id);requestAnimationFrame(()=>requestAnimationFrame(()=>{const group=$('canvas')?.querySelector(`g.node[data-semantic-id="${CSS.escape(elementId)}"]`);if(!group)return;group.classList.add('tree-reveal-target');try{group.scrollIntoView({block:'center',inline:'center',behavior:'smooth'})}catch{group.scrollIntoView?.()}setTimeout(()=>group.classList.remove('tree-reveal-target'),1800)}));return true}

function svgElement(name,attrs={}){const node=document.createElementNS(SVG_NS,name);for(const[key,value]of Object.entries(attrs))node.setAttribute(key,String(value));return node}
function glyphFor(nodeGroup,node,diagram,count){const size=22,pad=5,x=Math.max(3,(Number(node.width)||120)-size-pad),y=Math.max(3,(Number(node.height)||70)-size-pad),g=svgElement('g',{class:'child-diagram-glyph',transform:`translate(${x} ${y})`,role:'button',tabindex:'0','aria-label':`Open child diagram ${diagram.name||diagram.id}`,'data-child-diagram-id':diagram.id,'data-child-diagram-count':count});g.style.cursor='pointer';g.append(svgElement('rect',{x:0,y:0,width:size,height:size,rx:2,fill:'#fff',stroke:'#263746','stroke-width':1.4}));g.append(svgElement('path',{d:'M11 4 V9 M5 9 H17 M5 9 V16 M17 9 V16 M11 9 V16',fill:'none',stroke:'#263746','stroke-width':1.5,'stroke-linecap':'round','stroke-linejoin':'round'}));for(const cx of[5,11,17])g.append(svgElement('rect',{x:cx-2,y:15,width:4,height:4,fill:'#fff',stroke:'#263746','stroke-width':1}));if(count>1){const badge=svgElement('text',{x:18,y:6,'text-anchor':'middle','font-size':'7','font-weight':'700',fill:'#263746'});badge.textContent=String(count);g.append(badge)}const open=event=>{event.preventDefault();event.stopImmediatePropagation?.();event.stopPropagation();navigateToDiagram(diagram.id)};g.addEventListener('click',open);g.addEventListener('dblclick',open);g.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ')open(event)});nodeGroup.append(g)}

export function renderChildDiagramGlyphs(){const p=project(),diagram=activeDiagram(p),canvas=$('canvas');if(!p||!diagram||!canvas)return;canvas.querySelectorAll('.child-diagram-glyph').forEach(node=>node.remove());const presentations=new Map((diagram.nodes||[]).map(node=>[node.id,node]));for(const group of canvas.querySelectorAll('g.node[data-semantic-id]')){const elementId=group.getAttribute('data-semantic-id'),presentationId=group.getAttribute('data-presentation-id'),node=presentations.get(presentationId),children=childDiagramsFor(p,elementId),child=preferredChildDiagram(p,elementId);if(node&&child)glyphFor(group,node,child,children.length)}}

function selectedElementId(){return document.querySelector('#tree .tree-row.selected[data-type="element"]')?.dataset.id||document.querySelector('#canvas g.node.selected[data-semantic-id]')?.getAttribute('data-semantic-id')||null}
function renderChildDiagramPanel(){const p=project(),properties=$('properties');if(!p||!properties)return;properties.querySelector('#childDiagramCapabilities')?.remove();const elementId=selectedElementId(),element=semanticElement(p,elementId);if(!element)return;const types=childDiagramTypesForKind(element.kind),children=childDiagramsFor(p,element.id);if(!types.length&&!children.length)return;const section=document.createElement('section');section.id='childDiagramCapabilities';const heading=document.createElement('h3');heading.textContent='Child diagrams';section.append(heading);for(const diagram of children){const button=document.createElement('button');button.type='button';button.textContent=`Open ${diagram.name} — ${diagram.diagramType}`;button.onclick=()=>navigateToDiagram(diagram.id);section.append(button)}if(types.length){const controls=document.createElement('div');controls.className='field';const label=document.createElement('span');label.textContent='Create/open child diagram';const select=document.createElement('select');for(const type of types)select.add(new Option(type,type));select.value=PREFERRED[element.kind]||types[0];const create=document.createElement('button');create.type='button';create.textContent='Create / Open';create.onclick=()=>createChildDiagram(element.id,select.value);controls.append(label,select,create);section.append(controls)}properties.append(section)}

function handleCanvasDoubleClick(event){const group=event.target?.closest?.('g.node[data-semantic-id]');if(!group||event.target?.closest?.('.child-diagram-glyph'))return;const p=project(),elementId=group.getAttribute('data-semantic-id'),child=preferredChildDiagram(p,elementId);if(!child)return;event.preventDefault();event.stopImmediatePropagation();event.stopPropagation();navigateToDiagram(child.id)}
function handleTreeDoubleClick(event){const row=event.target?.closest?.('.tree-row[data-type="element"]');if(!row||event.target?.closest?.('.tree-disclosure'))return;const elementId=row.dataset.id;if(!elementId)return;const p=project(),child=preferredChildDiagram(p,elementId);if(!child)return;event.preventDefault();event.stopImmediatePropagation();event.stopPropagation();navigateToDiagram(child.id)}
function preserveDiagramTabSelection(event){const row=event.target?.closest?.('.tree-row[data-type="diagram"]');if(!row||!$('diagramTab')?.classList.contains('active'))return;queueMicrotask(()=>{if(!$('diagramTab')?.classList.contains('active'))$('diagramTab')?.click()})}

let observer=null,propertyObserver=null,queued=false,normalizing=false;
function observeCanvas(){const canvas=$('canvas');if(canvas&&observer)observer.observe(canvas,{childList:true,subtree:true,attributes:true,attributeFilter:['transform']})}
function queueRender(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;observer?.disconnect();propertyObserver?.disconnect();try{const p=project();if(p&&!normalizing&&normalizeDiagramContainment(p)){normalizing=true;api()?.setProject?.(clone(p));normalizing=false;return}renderChildDiagramGlyphs();renderChildDiagramPanel()}finally{observeCanvas();observeProperties()}})}
function observeProperties(){const properties=$('properties');if(properties&&propertyObserver)propertyObserver.observe(properties,{childList:true,subtree:false})}
function bind(){const canvas=$('canvas'),tree=$('tree');if(!canvas||!tree)return false;canvas.removeEventListener('dblclick',handleCanvasDoubleClick,true);canvas.addEventListener('dblclick',handleCanvasDoubleClick,true);tree.removeEventListener('dblclick',handleTreeDoubleClick,true);tree.addEventListener('dblclick',handleTreeDoubleClick,true);tree.removeEventListener('click',preserveDiagramTabSelection);tree.addEventListener('click',preserveDiagramTabSelection);observer?.disconnect();observer=new MutationObserver(queueRender);propertyObserver?.disconnect();propertyObserver=new MutationObserver(queueRender);observeCanvas();observeProperties();const select=$('diagramSelect');if(select){select.removeEventListener('change',queueRender);select.addEventListener('change',queueRender)}document.addEventListener('click',event=>{if(event.target?.closest?.('#tree,#canvas'))queueRender()},true);queueRender();return true}
function boot(){if(bind())return;let attempts=0;const timer=setInterval(()=>{attempts+=1;if(bind()||attempts>100)clearInterval(timer)},50)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();window.addEventListener('systems-modeler-ready',boot);

globalThis.SystemsModelerChildDiagrams={childDiagramsFor,preferredChildDiagram,childDiagramTypesForKind,canOwnChildDiagram,createChildDiagram,normalizeDiagramContainment,render:renderChildDiagramGlyphs,navigate:navigateToDiagram,revealElement:revealElementFromTree};

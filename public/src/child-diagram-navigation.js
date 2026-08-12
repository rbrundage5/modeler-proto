const SVG_NS='http://www.w3.org/2000/svg';
const $=id=>document.getElementById(id);
const clone=value=>typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));

function api(){return globalThis.SystemsModelerAPI}
function project(){return api()?.getProject?.()||null}
function activeDiagram(p=project()){return p?.diagrams?.find(d=>d.id===p.activeDiagramId)||p?.diagrams?.[0]||null}
function semanticElement(p,id){return [p?.root,...(p?.elements||[])].find(item=>item?.id===id)||null}

const preferredChildType={
  Block:'Internal Block Diagram',
  Activity:'Activity Diagram',
  StateMachine:'State Machine Diagram',
  Interaction:'Sequence Diagram'
};

export function childDiagramsFor(p,elementId){
  if(!p||!elementId)return[];
  const element=semanticElement(p,elementId),byId=new Map((p.diagrams||[]).map(diagram=>[diagram.id,diagram])),result=[],seen=new Set();
  const add=diagram=>{if(diagram&&!seen.has(diagram.id)){seen.add(diagram.id);result.push(diagram)}};
  if(element?.primaryChildDiagramId)add(byId.get(element.primaryChildDiagramId));
  for(const id of element?.childDiagramIds||[])add(byId.get(id));
  for(const diagram of p.diagrams||[])if(diagram.contextId===elementId)add(diagram);
  return result;
}

export function preferredChildDiagram(p,elementId){
  const children=childDiagramsFor(p,elementId);
  if(!children.length)return null;
  const element=semanticElement(p,elementId),preferred=preferredChildType[element?.kind];
  return children.find(diagram=>diagram.id===element?.primaryChildDiagramId)
    ||children.find(diagram=>diagram.isPrimary===true)
    ||children.find(diagram=>preferred&&diagram.diagramType===preferred)
    ||children.slice().sort((a,b)=>String(a.name||a.id).localeCompare(String(b.name||b.id)))[0];
}

function navigateToDiagram(diagramId){
  const service=api();if(!service||!diagramId)return false;
  const current=service.getProject?.();if(!current||(current.diagrams||[]).every(diagram=>diagram.id!==diagramId))return false;
  if(current.activeDiagramId===diagramId)return true;
  const next=clone(current),previous=next.activeDiagramId;
  next.uiState??={};next.uiState.diagramNavigationBack=Array.isArray(next.uiState.diagramNavigationBack)?next.uiState.diagramNavigationBack:[];
  next.uiState.diagramNavigationForward=[];
  if(previous&&previous!==diagramId){next.uiState.diagramNavigationBack.push(previous);if(next.uiState.diagramNavigationBack.length>100)next.uiState.diagramNavigationBack.shift()}
  next.activeDiagramId=diagramId;
  service.setProject(next);
  const select=$('diagramSelect');if(select)select.value=diagramId;
  globalThis.dispatchEvent(new CustomEvent('systems-modeler-diagram-navigated',{detail:{from:previous,to:diagramId}}));
  return true;
}

function svgElement(name,attrs={}){const node=document.createElementNS(SVG_NS,name);for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));return node}

function glyphFor(nodeGroup,node,diagram,count){
  const size=22,pad=5,x=Math.max(3,(Number(node.width)||120)-size-pad),y=Math.max(3,(Number(node.height)||70)-size-pad);
  const g=svgElement('g',{class:'child-diagram-glyph',transform:`translate(${x} ${y})`,role:'button',tabindex:'0','aria-label':`Open child diagram ${diagram.name||diagram.id}`,'data-child-diagram-id':diagram.id,'data-child-diagram-count':count});
  g.style.cursor='pointer';
  g.append(svgElement('rect',{x:0,y:0,width:size,height:size,rx:2,fill:'#fff',stroke:'#263746','stroke-width':1.4}));
  g.append(svgElement('path',{d:'M11 4 V9 M5 9 H17 M5 9 V16 M17 9 V16 M11 9 V16',fill:'none',stroke:'#263746','stroke-width':1.5,'stroke-linecap':'round','stroke-linejoin':'round'}));
  for(const cx of [5,11,17])g.append(svgElement('rect',{x:cx-2,y:15,width:4,height:4,fill:'#fff',stroke:'#263746','stroke-width':1}));
  if(count>1){const badge=svgElement('text',{x:18,y:6,'text-anchor':'middle','font-size':'7','font-weight':'700',fill:'#263746'});badge.textContent=String(count);g.append(badge)}
  const open=event=>{event.preventDefault();event.stopImmediatePropagation?.();event.stopPropagation();navigateToDiagram(diagram.id)};
  g.addEventListener('click',open);g.addEventListener('dblclick',open);g.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){open(event)}});nodeGroup.append(g);
}

export function renderChildDiagramGlyphs(){
  const p=project(),diagram=activeDiagram(p),canvas=$('canvas');if(!p||!diagram||!canvas)return;
  canvas.querySelectorAll('.child-diagram-glyph').forEach(node=>node.remove());
  const presentations=new Map((diagram.nodes||[]).map(node=>[node.id,node]));
  for(const group of canvas.querySelectorAll('g.node[data-semantic-id]')){
    const elementId=group.getAttribute('data-semantic-id'),presentationId=group.getAttribute('data-presentation-id'),node=presentations.get(presentationId),children=childDiagramsFor(p,elementId),child=preferredChildDiagram(p,elementId);
    if(node&&child)glyphFor(group,node,child,children.length);
  }
}

function handleCanvasDoubleClick(event){
  const group=event.target?.closest?.('g.node[data-semantic-id]');if(!group||event.target?.closest?.('.child-diagram-glyph'))return;
  const p=project(),elementId=group.getAttribute('data-semantic-id'),child=preferredChildDiagram(p,elementId);if(!child)return;
  event.preventDefault();event.stopImmediatePropagation();event.stopPropagation();navigateToDiagram(child.id);
}

let observer=null,queued=false;
function observeCanvas(){const canvas=$('canvas');if(canvas&&observer)observer.observe(canvas,{childList:true,subtree:true,attributes:true,attributeFilter:['transform']})}
function queueRender(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;observer?.disconnect();try{renderChildDiagramGlyphs()}finally{observeCanvas()}})}
function bind(){const canvas=$('canvas');if(!canvas)return false;canvas.removeEventListener('dblclick',handleCanvasDoubleClick,true);canvas.addEventListener('dblclick',handleCanvasDoubleClick,true);observer?.disconnect();observer=new MutationObserver(queueRender);observeCanvas();const select=$('diagramSelect');if(select){select.removeEventListener('change',queueRender);select.addEventListener('change',queueRender)}queueRender();return true}
function boot(){if(bind())return;let attempts=0;const timer=setInterval(()=>{attempts+=1;if(bind()||attempts>100)clearInterval(timer)},50)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();window.addEventListener('systems-modeler-ready',boot);

globalThis.SystemsModelerChildDiagrams={childDiagramsFor,preferredChildDiagram,render:renderChildDiagramGlyphs,navigate:navigateToDiagram};

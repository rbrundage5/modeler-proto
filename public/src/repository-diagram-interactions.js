import './diagram-containment-tree.js';
import './owned-semantic-content.js';
const $=id=>document.getElementById(id);
const clone=value=>typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));
let lastCanvasClick={elementId:null,presentationId:null,at:0};
let lastTreeClick={elementId:null,at:0};
const DOUBLE_CLICK_MS=500;

function api(){return globalThis.SystemsModelerAPI}
function project(){return api()?.getProject?.()||null}
function diagramsTabActive(){return Boolean($('diagramTab')?.classList.contains('active'))}

function selectDiagramWithoutChangingRepositoryTab(diagramId){
  const service=api(),current=service?.getProject?.();
  if(!service?.setProject||!current||(current.diagrams||[]).every(diagram=>diagram.id!==diagramId))return false;
  const next=clone(current);next.activeDiagramId=diagramId;service.setProject(next);
  queueMicrotask(()=>{
    $('diagramTab')?.classList.add('active');$('modelTab')?.classList.remove('active');$('xrefTab')?.classList.remove('active');
    const row=$('tree')?.querySelector(`.tree-row[data-type="diagram"][data-id="${CSS.escape(diagramId)}"]`);row?.classList.add('selected');
  });
  return true;
}

function childFor(elementId){
  const p=project();if(!p||!elementId)return null;
  const helper=globalThis.SystemsModelerChildDiagrams;
  if(helper?.preferredChildDiagram)return helper.preferredChildDiagram(p,elementId)||null;
  const element=[p.root,...(p.elements||[])].find(item=>item?.id===elementId),byId=new Map((p.diagrams||[]).map(diagram=>[diagram.id,diagram]));
  if(element?.primaryChildDiagramId&&byId.has(element.primaryChildDiagramId))return byId.get(element.primaryChildDiagramId);
  for(const id of element?.childDiagramIds||[])if(byId.has(id))return byId.get(id);
  return (p.diagrams||[]).find(diagram=>diagram.contextId===elementId||diagram.ownerId===elementId)||null;
}

function navigateChild(elementId){
  const child=childFor(elementId);if(!child)return false;
  const helper=globalThis.SystemsModelerChildDiagrams;if(helper?.navigate)return Boolean(helper.navigate(child.id));
  const service=api(),current=service?.getProject?.();if(!service?.setProject||!current)return false;
  const next=clone(current);next.activeDiagramId=child.id;service.setProject(next);return true;
}

function handleCanvasPointerDownCapture(event){
  if(event.button!==0)return;
  const group=event.target?.closest?.('g.node[data-semantic-id]');if(!group||event.target?.closest?.('.child-diagram-glyph'))return;
  const elementId=group.getAttribute('data-semantic-id'),presentationId=group.getAttribute('data-presentation-id')||'';if(!elementId)return;
  const now=performance.now(),same=lastCanvasClick.elementId===elementId&&lastCanvasClick.presentationId===presentationId,rapid=now-lastCanvasClick.at<=DOUBLE_CLICK_MS;
  if(same&&rapid&&childFor(elementId)){
    lastCanvasClick={elementId:null,presentationId:null,at:0};
    event.preventDefault();event.stopImmediatePropagation();event.stopPropagation();
    navigateChild(elementId);return;
  }
  lastCanvasClick={elementId,presentationId,at:now};
}

function handleTreePointerDownCapture(event){
  if(event.button!==0||diagramsTabActive())return;
  const row=event.target?.closest?.('.tree-row[data-type="element"]');if(!row||event.target?.closest?.('.tree-disclosure'))return;
  const elementId=row.dataset.id;if(!elementId)return;
  const now=performance.now(),same=lastTreeClick.elementId===elementId,rapid=now-lastTreeClick.at<=DOUBLE_CLICK_MS;
  if(same&&rapid){
    lastTreeClick={elementId:null,at:0};
    if(childFor(elementId)){event.preventDefault();event.stopImmediatePropagation();event.stopPropagation();navigateChild(elementId);return}
    if(globalThis.SystemsModelerChildDiagrams?.revealElement){event.preventDefault();event.stopImmediatePropagation();event.stopPropagation();globalThis.SystemsModelerChildDiagrams.revealElement(elementId);return}
  }
  lastTreeClick={elementId,at:now};
}

function bind(){
  const tree=$('tree'),canvas=$('canvas');if(!tree||!canvas)return false;
  tree.removeEventListener('click',handleTreeClickCapture,true);tree.addEventListener('click',handleTreeClickCapture,true);
  tree.removeEventListener('pointerdown',handleTreePointerDownCapture,true);tree.addEventListener('pointerdown',handleTreePointerDownCapture,true);
  canvas.removeEventListener('pointerdown',handleCanvasPointerDownCapture,true);canvas.addEventListener('pointerdown',handleCanvasPointerDownCapture,true);
  return true;
}
function boot(){if(bind())return;let attempts=0;const timer=setInterval(()=>{attempts+=1;if(bind()||attempts>100)clearInterval(timer)},50)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.addEventListener('systems-modeler-ready',boot);

globalThis.SystemsModelerRepositoryDiagramInteractions={selectDiagramWithoutChangingRepositoryTab,navigateChild};

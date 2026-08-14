const $=id=>document.getElementById(id);
const api=()=>globalThis.SystemsModelerAPI;
const MAX_HISTORY=100;
let backStack=[],forwardStack=[],currentId=null,pendingNavigation=null,observer=null,scheduled=false;

function project(){return api()?.getProject?.()||null}
function activeDiagramId(){const p=project();return p?.activeDiagramId||(p?.diagrams||[])[0]?.id||null}
function diagramName(id){return(project()?.diagrams||[]).find(d=>d.id===id)?.name||id||'diagram'}
function validDiagram(id){return Boolean(id&&(project()?.diagrams||[]).some(d=>d.id===id))}
function trim(stack){if(stack.length>MAX_HISTORY)stack.splice(0,stack.length-MAX_HISTORY);return stack}
function pushHistory(stack,id){if(!validDiagram(id))return stack;if(stack.at(-1)!==id)stack.push(id);return trim(stack)}
function prune(stack,current){return stack.filter(id=>validDiagram(id)&&id!==current)}
function popValid(stack,current){while(stack.length){const id=stack.pop();if(validDiagram(id)&&id!==current)return id}return null}

function ensureControls(){
  const select=$('diagramSelect'),actions=select?.closest('.diagram-actions');if(!select||!actions)return null;
  let back=$('diagramBack'),forward=$('diagramForward');
  if(!back){back=document.createElement('button');back.id='diagramBack';back.type='button';back.textContent='◀ Back';back.setAttribute('aria-label','Previous diagram');actions.insertBefore(back,select);back.addEventListener('click',goBack)}
  if(!forward){forward=document.createElement('button');forward.id='diagramForward';forward.type='button';forward.textContent='Forward ▶';forward.setAttribute('aria-label','Next diagram');actions.insertBefore(forward,select.nextSibling);forward.addEventListener('click',goForward)}
  return{back,forward};
}
function updateButtons(){
  const controls=ensureControls(),current=activeDiagramId();if(!controls)return;
  backStack=prune(backStack,current);forwardStack=prune(forwardStack,current);
  controls.back.disabled=!backStack.length;controls.forward.disabled=!forwardStack.length;
  controls.back.title=backStack.length?`Back to ${diagramName(backStack.at(-1))}`:'No previous diagram';
  controls.forward.title=forwardStack.length?`Forward to ${diagramName(forwardStack.at(-1))}`:'No next diagram';
}
function observeNavigation(){
  const next=activeDiagramId();
  if(!next){currentId=null;pendingNavigation=null;updateButtons();return}
  if(currentId===null){currentId=next;pendingNavigation=null;updateButtons();return}
  if(next===currentId){if(pendingNavigation?.target===next)pendingNavigation=null;updateButtons();return}
  if(pendingNavigation?.target===next){currentId=next;pendingNavigation=null;updateButtons();return}
  pushHistory(backStack,currentId);forwardStack=[];currentId=next;updateButtons();
}
function navigateTo(id,direction){
  if(!validDiagram(id)||id===activeDiagramId())return false;
  const service=api();if(!service)return false;
  const next=structuredClone(service.getProject());next.activeDiagramId=id;
  pendingNavigation={target:id,direction};service.setProject(next);currentId=id;queue();return true;
}
function goBack(){
  const present=activeDiagramId(),target=popValid(backStack,present);if(!target){updateButtons();return}
  if(present)pushHistory(forwardStack,present);
  if(!navigateTo(target,'back')){popValid(forwardStack,target);pushHistory(backStack,target);updateButtons()}
}
function goForward(){
  const present=activeDiagramId(),target=popValid(forwardStack,present);if(!target){updateButtons();return}
  if(present)pushHistory(backStack,present);
  if(!navigateTo(target,'forward')){popValid(backStack,target);pushHistory(forwardStack,target);updateButtons()}
}
function queue(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;observeNavigation()})}
function boot(){
  ensureControls();currentId=activeDiagramId();updateButtons();observer?.disconnect();observer=new MutationObserver(queue);
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','value']});
  document.addEventListener('change',event=>{if(event.target?.id==='diagramSelect')queue()},true);
  document.addEventListener('pointerup',queue,true);window.addEventListener('systems-modeler-ready',queue);queue();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

export function previousDiagram(){goBack()}
export function nextDiagram(){goForward()}
export function diagramNavigationState(){return{currentId,back:[...backStack],forward:[...forwardStack],pending:pendingNavigation?{...pendingNavigation}:null}}
export function resetDiagramNavigationHistory(){backStack=[];forwardStack=[];currentId=activeDiagramId();pendingNavigation=null;updateButtons()}
globalThis.SystemsModelerDiagramNavigation={back:goBack,forward:goForward,state:diagramNavigationState,reset:resetDiagramNavigationHistory};

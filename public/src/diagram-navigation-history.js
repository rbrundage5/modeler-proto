const $=id=>document.getElementById(id);
const api=()=>globalThis.SystemsModelerAPI;
let backStack=[],forwardStack=[],currentId=null,suppress=false,observer=null,scheduled=false;

function activeDiagramId(){const project=api()?.getProject?.();return project?.activeDiagramId||(project?.diagrams||[])[0]?.id||null}
function diagramName(id){const project=api()?.getProject?.();return(project?.diagrams||[]).find(d=>d.id===id)?.name||id||'diagram'}
function validDiagram(id){const project=api()?.getProject?.();return Boolean(id&&(project?.diagrams||[]).some(d=>d.id===id))}
function clean(stack){return stack.filter((id,index)=>validDiagram(id)&&stack.indexOf(id)===index)}

function ensureControls(){
  const select=$('diagramSelect'),actions=select?.closest('.diagram-actions');if(!select||!actions)return null;
  let back=$('diagramBack'),forward=$('diagramForward');
  if(!back){back=document.createElement('button');back.id='diagramBack';back.type='button';back.textContent='◀ Back';back.setAttribute('aria-label','Previous diagram');actions.insertBefore(back,select);back.addEventListener('click',goBack)}
  if(!forward){forward=document.createElement('button');forward.id='diagramForward';forward.type='button';forward.textContent='Forward ▶';forward.setAttribute('aria-label','Next diagram');actions.insertBefore(forward,select.nextSibling);forward.addEventListener('click',goForward)}
  return{back,forward};
}
function updateButtons(){const controls=ensureControls();if(!controls)return;backStack=clean(backStack);forwardStack=clean(forwardStack);controls.back.disabled=!backStack.length;controls.forward.disabled=!forwardStack.length;controls.back.title=backStack.length?`Back to ${diagramName(backStack.at(-1))}`:'No previous diagram';controls.forward.title=forwardStack.length?`Forward to ${diagramName(forwardStack.at(-1))}`:'No next diagram'}
function observeNavigation(){const next=activeDiagramId();if(!next){currentId=null;updateButtons();return}if(currentId===null){currentId=next;updateButtons();return}if(next!==currentId){if(!suppress){backStack.push(currentId);forwardStack=[]}currentId=next;suppress=false;updateButtons()}}
function navigateTo(id){if(!validDiagram(id))return false;const service=api();if(!service)return false;const project=structuredClone(service.getProject());project.activeDiagramId=id;suppress=true;service.setProject(project);currentId=id;queue();return true}
function goBack(){if(!backStack.length)return;const target=backStack.pop(),present=activeDiagramId();if(present)forwardStack.push(present);if(!navigateTo(target)){forwardStack.pop();updateButtons()}}
function goForward(){if(!forwardStack.length)return;const target=forwardStack.pop(),present=activeDiagramId();if(present)backStack.push(present);if(!navigateTo(target)){backStack.pop();updateButtons()}}
function queue(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;observeNavigation()})}
function boot(){ensureControls();currentId=activeDiagramId();updateButtons();observer?.disconnect();observer=new MutationObserver(queue);observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','value']});document.addEventListener('change',event=>{if(event.target?.id==='diagramSelect')queue()},true);document.addEventListener('pointerup',queue,true);window.addEventListener('systems-modeler-ready',queue);queue()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

export function previousDiagram(){goBack()}
export function nextDiagram(){goForward()}
export function diagramNavigationState(){return{currentId,back:[...backStack],forward:[...forwardStack]}}
globalThis.SystemsModelerDiagramNavigation={back:goBack,forward:goForward,state:diagramNavigationState};

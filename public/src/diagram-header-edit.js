const api=()=>window.SystemsModelerAPI;
const clone=value=>typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));
const activeDiagram=project=>(project?.diagrams||[]).find(d=>d.id===project.activeDiagramId)||project?.diagrams?.[0]||null;
let editor=null;

function log(message,kind='ok'){const host=document.getElementById('log');if(!host)return;const row=document.createElement('div');row.className=`log-entry ${kind}`;row.textContent=`${new Date().toLocaleTimeString()} ${message}`;host.prepend(row)}
function qualifiedName(project,id){const byId=value=>project.root?.id===value?project.root:(project.elements||[]).find(e=>e.id===value);const parts=[],seen=new Set();let item=byId(id);while(item&&!seen.has(item.id)){seen.add(item.id);parts.unshift(item.name||item.id);item=byId(item.ownerId)}return parts.join('::')}
function generatedHeader(project,diagram){const abbreviations={'Block Definition Diagram':'bdd','Internal Block Diagram':'ibd','Requirement Diagram':'req','Use Case Diagram':'uc','Activity Diagram':'act','State Machine Diagram':'stm','Sequence Diagram':'seq','Parametric Diagram':'par','Package Diagram':'pkg','Instance Diagram':'instance'};return`${abbreviations[diagram.diagramType]||'diagram'} [${diagram.ownerId?qualifiedName(project,diagram.ownerId):project.name}] ${diagram.name}`}
function removeEditor(){if(!editor)return;editor.input.removeEventListener('blur',editor.onBlur);editor.host.remove();editor=null}
function commit(diagramId,value){const service=api();if(!service)return;const next=clone(service.getProject()),diagram=(next.diagrams||[]).find(d=>d.id===diagramId);if(!diagram)return;diagram.headerText=value.trim();service.setProject(next);log(diagram.headerText?'Diagram header updated.':'Diagram header reset to generated text.');}
function cancel(){removeEditor()}
function finish(save){if(!editor)return;const {diagramId,input}=editor,value=input.value;removeEditor();if(save)commit(diagramId,value)}

export function openDiagramHeaderEditor(target){
  const service=api();if(!service)return false;const project=service.getProject(),diagram=activeDiagram(project);if(!diagram)return false;
  const header=target?.closest?.('#canvas .diagram-frame-header')||document.querySelector('#canvas .diagram-frame-header');if(!header)return false;
  removeEditor();const rect=header.getBoundingClientRect();if(!rect.width||!rect.height)return false;
  const host=document.createElement('div');host.className='diagram-header-html-editor';host.dataset.diagramId=diagram.id;host.style.cssText=`position:fixed;left:${Math.max(0,rect.left+8)}px;top:${Math.max(0,rect.top+5)}px;width:${Math.max(260,Math.min(620,rect.width-20))}px;height:${Math.max(30,rect.height-8)}px;z-index:2147483647;pointer-events:auto;`;
  const input=document.createElement('input');input.type='text';input.value=diagram.headerText?.trim()||generatedHeader(project,diagram);input.setAttribute('aria-label','Diagram header text');input.setAttribute('data-diagram-header-input','true');input.style.cssText='box-sizing:border-box;width:100%;height:100%;padding:2px 8px;border:2px solid #2563eb;border-radius:3px;background:#fff;color:#111827;font:600 13px system-ui, sans-serif;outline:none;box-shadow:0 1px 4px rgba(0,0,0,.25);';host.append(input);document.body.append(host);
  const stop=e=>e.stopPropagation();for(const type of ['pointerdown','mousedown','click','dblclick'])host.addEventListener(type,stop);
  const onBlur=()=>finish(true);input.addEventListener('blur',onBlur);input.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Enter'){event.preventDefault();finish(true)}else if(event.key==='Escape'){event.preventDefault();finish(false)}});
  editor={host,input,diagramId:diagram.id,onBlur};requestAnimationFrame(()=>{input.focus();input.select()});return true;
}

function intercept(event){if(event.target.closest?.('.diagram-header-html-editor'))return;const header=event.target.closest?.('#canvas .diagram-frame-header');if(!header)return;event.preventDefault();event.stopImmediatePropagation();event.stopPropagation();openDiagramHeaderEditor(header)}
document.addEventListener('pointerdown',intercept,true);
document.addEventListener('mousedown',intercept,true);
document.addEventListener('click',event=>{if(event.target.closest?.('.diagram-header-html-editor'))return;if(event.target.closest?.('#canvas .diagram-frame-header')){event.preventDefault();event.stopImmediatePropagation();event.stopPropagation();openDiagramHeaderEditor(event.target)}},true);
window.addEventListener('resize',()=>{if(editor)finish(false)});
window.addEventListener('scroll',()=>{if(editor)finish(false)},true);

export function isDiagramHeaderEditorOpen(){return Boolean(editor)}

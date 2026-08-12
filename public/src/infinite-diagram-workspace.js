import {diagramWorkspaceExtent} from './diagram-workspace-extent.js';

const api=()=>globalThis.SystemsModelerAPI;
let observer=null,scheduled=false,lastDiagramId=null,lastWidth=0,lastHeight=0;

function activeDiagram(){
  const project=api()?.getProject?.();
  if(!project)return null;
  return(project.diagrams||[]).find(diagram=>diagram.id===project.activeDiagramId)||project.diagrams?.[0]||null;
}

export function applyInfiniteWorkspace(){
  const canvas=document.getElementById('canvas'),diagram=activeDiagram();
  if(!canvas||!diagram)return null;
  const extent=diagramWorkspaceExtent(diagram);
  const changed=diagram.id!==lastDiagramId||extent.width!==lastWidth||extent.height!==lastHeight;
  canvas.setAttribute('width',String(extent.width));
  canvas.setAttribute('height',String(extent.height));
  canvas.setAttribute('viewBox',`0 0 ${extent.width} ${extent.height}`);
  canvas.style.width=`${extent.width}px`;
  canvas.style.height=`${extent.height}px`;
  const frame=canvas.querySelector('.diagram-frame');
  if(frame){
    frame.setAttribute('width',String(Math.max(0,extent.width-16)));
    frame.setAttribute('height',String(Math.max(0,extent.height-16)));
  }
  canvas.dataset.workspaceWidth=String(extent.width);
  canvas.dataset.workspaceHeight=String(extent.height);
  canvas.dataset.workspaceAutoExpanded=String(extent.width>3200||extent.height>2200);
  lastDiagramId=diagram.id;lastWidth=extent.width;lastHeight=extent.height;
  if(changed)canvas.dispatchEvent(new CustomEvent('diagram-workspace-resized',{detail:{diagramId:diagram.id,...extent}}));
  return extent;
}

function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;applyInfiniteWorkspace()});
}

function bind(){
  const canvas=document.getElementById('canvas');
  if(!canvas)return false;
  observer?.disconnect();
  observer=new MutationObserver(schedule);
  observer.observe(canvas,{childList:true,subtree:true});
  document.getElementById('diagramSelect')?.addEventListener('change',schedule);
  document.getElementById('zoomIn')?.addEventListener('click',schedule);
  document.getElementById('zoomOut')?.addEventListener('click',schedule);
  document.getElementById('zoomReset')?.addEventListener('click',schedule);
  window.addEventListener('systems-modeler-ready',schedule);
  window.addEventListener('resize',schedule);
  document.addEventListener('pointerup',schedule,true);
  schedule();
  return true;
}

function boot(){
  if(bind())return;
  let attempts=0;
  const timer=setInterval(()=>{attempts++;if(bind()||attempts>100)clearInterval(timer)},50);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

globalThis.SystemsModelerInfiniteWorkspace={apply:applyInfiniteWorkspace,extent:diagramWorkspaceExtent};

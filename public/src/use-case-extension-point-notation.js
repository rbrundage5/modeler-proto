const SVG='http://www.w3.org/2000/svg';
const api=()=>globalThis.SystemsModelerAPI;
let observer=null,scheduled=false,working=false;

function project(){return api()?.getProject?.()||null}
function activeDiagram(p){return(p?.diagrams||[]).find(d=>d.id===p.activeDiagramId)||(p?.diagrams||[])[0]||null}
function svgText(text,x,y,className){const node=document.createElementNS(SVG,'text');node.setAttribute('x',String(x));node.setAttribute('y',String(y));node.setAttribute('text-anchor','middle');node.setAttribute('class',className);node.textContent=text;return node}

export function renderUseCaseExtensionPoints(){
  if(working)return;const p=project(),diagram=activeDiagram(p),canvas=document.getElementById('canvas');if(!p||!diagram||diagram.diagramType!=='Use Case Diagram'||!canvas)return;
  working=true;
  try{
    for(const group of canvas.querySelectorAll('g.node[data-semantic-kind="UseCase"]')){
      group.querySelectorAll('.uml-extension-points').forEach(node=>node.remove());
      const useCaseId=group.getAttribute('data-semantic-id'),points=(p.elements||[]).filter(item=>item.kind==='ExtensionPoint'&&item.ownerId===useCaseId);
      if(!points.length)continue;
      const shape=group.querySelector('ellipse.shape');if(!shape)continue;
      const width=Number(shape.getAttribute('cx'))*2||180,height=Number(shape.getAttribute('cy'))*2||90,section=document.createElementNS(SVG,'g');section.setAttribute('class','uml-extension-points');
      const y=Math.max(44,height*.57),line=document.createElementNS(SVG,'line');line.setAttribute('x1',String(width*.16));line.setAttribute('x2',String(width*.84));line.setAttribute('y1',String(y));line.setAttribute('y2',String(y));line.setAttribute('stroke','#555');line.setAttribute('stroke-width','1');section.append(line,svgText('extension points',width/2,y+13,'compartment-title'));
      const maxRows=Math.max(1,Math.floor((height-y-17)/13));points.slice(0,maxRows).forEach((point,index)=>section.append(svgText(point.name||point.id,width/2,y+27+index*13,'compartment-row')));
      group.append(section);
    }
  }finally{working=false}
}
function queue(){if(scheduled||working)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;renderUseCaseExtensionPoints()})}
function boot(){const canvas=document.getElementById('canvas');if(!canvas)return false;observer?.disconnect();observer=new MutationObserver(queue);observer.observe(canvas,{childList:true,subtree:true});document.addEventListener('pointerup',queue,true);document.addEventListener('change',queue,true);window.addEventListener('systems-modeler-ready',queue);queue();return true}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(!boot()){const timer=setInterval(()=>boot()&&clearInterval(timer),50)}},{once:true});else if(!boot()){const timer=setInterval(()=>boot()&&clearInterval(timer),50)}

globalThis.SystemsModelerUseCaseExtensionPointNotation={render:renderUseCaseExtensionPoints};

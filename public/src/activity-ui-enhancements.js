import {ACTIVITY_RELATIONSHIP_KINDS,validateBehaviorConnection} from './behavior-model.js';

const svgNS='http://www.w3.org/2000/svg';
const api=()=>window.SystemsModelerAPI;
const activeDiagram=project=>(project.diagrams||[]).find(d=>d.id===project.activeDiagramId)||project.diagrams?.[0]||null;
const clone=value=>typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));
function log(message,kind='warn'){const host=document.getElementById('log');if(!host)return;const entry=document.createElement('div');entry.className=`log-entry ${kind}`;entry.textContent=`${new Date().toLocaleTimeString()} ${message}`;host.prepend(entry)}

function beginDiagramHeaderEdit(){
  const service=api();if(!service)return;
  const project=service.getProject(),diagram=activeDiagram(project),header=document.querySelector('#canvas .diagram-frame-header'),label=header?.querySelector('.diagram-frame-title');
  if(!diagram||!header||!label||header.querySelector('.diagram-header-editor'))return;
  const original=label.textContent||'',foreign=document.createElementNS(svgNS,'foreignObject');foreign.setAttribute('x','16');foreign.setAttribute('y','9');foreign.setAttribute('width','510');foreign.setAttribute('height','31');foreign.classList.add('diagram-header-editor');
  const input=document.createElement('input');input.setAttribute('xmlns','http://www.w3.org/1999/xhtml');input.type='text';input.value=diagram.headerText?.trim()||original;input.setAttribute('aria-label','Diagram header text');input.style.cssText='box-sizing:border-box;width:100%;height:28px;border:1px solid #4b7bec;border-radius:3px;padding:2px 7px;font:600 13px system-ui;background:#fff;color:#15232d;outline:none;';foreign.append(input);label.style.visibility='hidden';header.append(foreign);
  let finished=false;const finish=(commit=true)=>{if(finished)return;finished=true;const value=input.value.trim();if(commit){const next=service.getProject(),target=(next.diagrams||[]).find(d=>d.id===diagram.id);if(target){target.headerText=value;service.setProject(next);log(value?'Diagram header updated.':'Diagram header reset to generated text.','ok');return}}foreign.remove();label.style.visibility='';};
  input.addEventListener('pointerdown',e=>e.stopPropagation());input.addEventListener('click',e=>e.stopPropagation());input.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();finish(true)}else if(e.key==='Escape'){e.preventDefault();finish(false)}});input.addEventListener('blur',()=>finish(true));requestAnimationFrame(()=>{input.focus();input.select()});
}

document.addEventListener('click',event=>{if(!event.target.closest?.('#canvas .diagram-frame-header')||event.target.closest?.('.diagram-header-editor'))return;setTimeout(beginDiagramHeaderEdit,0)},true);
document.addEventListener('dblclick',event=>{if(event.target.closest?.('#canvas .diagram-frame-header'))event.stopPropagation()},true);

let reconnectSnapshot=null,reconnectRelationshipId=null;
function selectedRelationshipId(){return document.querySelector('#canvas path.edge.selected[data-semantic-id]')?.getAttribute('data-semantic-id')||null}
function rememberReconnect(){const service=api(),id=selectedRelationshipId();if(!service||!id)return;const rel=service.getProject().relationships?.find(r=>r.id===id);if(!rel||!ACTIVITY_RELATIONSHIP_KINDS.includes(rel.kind))return;reconnectSnapshot=clone(service.getProject());reconnectRelationshipId=id;}
function verifyReconnect(){if(!reconnectSnapshot||!reconnectRelationshipId)return;const service=api(),project=service?.getProject(),rel=project?.relationships?.find(r=>r.id===reconnectRelationshipId),snapshot=reconnectSnapshot;reconnectSnapshot=null;reconnectRelationshipId=null;if(!service||!rel)return;const verdict=validateBehaviorConnection(project,rel.kind,rel.sourceId,rel.targetId,{ignoreRelationshipId:rel.id});if(verdict.valid)return;service.setProject(snapshot);log(`Activity relationship reconnection rejected: ${verdict.message}`,'error');}
document.addEventListener('pointerdown',event=>{if(event.target.closest?.('#canvas .edge-endpoint'))rememberReconnect()},true);
document.addEventListener('pointerup',()=>{if(reconnectSnapshot)setTimeout(verifyReconnect,0)},true);
document.addEventListener('keydown',event=>{if(event.target.closest?.('#canvas .edge-endpoint'))rememberReconnect()},true);
document.addEventListener('keyup',()=>{if(reconnectSnapshot)setTimeout(verifyReconnect,0)},true);

function ensureActivityWeightEditor(){
  const service=api(),properties=document.getElementById('properties'),relId=selectedRelationshipId();if(!service||!properties||!relId||properties.querySelector('[data-activity-weight-editor]'))return;
  const project=service.getProject(),relationship=project.relationships?.find(r=>r.id===relId);if(!relationship||!ACTIVITY_RELATIONSHIP_KINDS.includes(relationship.kind))return;
  const section=document.createElement('div');section.className='section';section.dataset.activityWeightEditor='true';const heading=document.createElement('h3');heading.textContent='Activity Edge';const label=document.createElement('label');label.className='field';const span=document.createElement('span');span.textContent='Weight';const input=document.createElement('input');input.value=String(relationship.weight??'1');input.setAttribute('aria-label','Weight');label.append(span,input);section.append(heading,label);properties.append(section);
  input.addEventListener('change',()=>{const next=service.getProject(),target=next.relationships?.find(r=>r.id===relId);if(!target)return;target.weight=input.value.trim()||'1';service.setProject(next)});
}

function rectExitPoint(rect,from,to){const dx=to.x-from.x,dy=to.y-from.y,candidates=[];if(dx>0)candidates.push((rect.x+rect.width-from.x)/dx);else if(dx<0)candidates.push((rect.x-from.x)/dx);if(dy>0)candidates.push((rect.y+rect.height-from.y)/dy);else if(dy<0)candidates.push((rect.y-from.y)/dy);const t=Math.min(...candidates.filter(v=>Number.isFinite(v)&&v>=0));return Number.isFinite(t)?{x:from.x+dx*t,y:from.y+dy*t}:from;}
function interruptibleRegion(project,sourceId){let current=project.elements?.find(e=>e.id===sourceId),guard=0;while(current&&guard++<100){if(current.kind==='InterruptibleActivityRegion')return current;current=project.elements?.find(e=>e.id===current.ownerId)}return null}
function decorateActivityNotation(){
  const service=api(),canvas=document.getElementById('canvas');if(!service||!canvas)return;
  canvas.querySelectorAll('[data-semantic-kind="InterruptibleActivityRegion"] .shape').forEach(shape=>{shape.setAttribute('stroke-dasharray','8 5');shape.setAttribute('fill','none')});
  const project=service.getProject(),diagram=activeDiagram(project);if(!diagram||diagram.diagramType!=='Activity Diagram')return;
  for(const relationship of project.relationships||[]){if(relationship.kind!=='InterruptingEdge'||canvas.querySelector(`.interrupting-edge-glyph[data-relationship-id="${CSS.escape(relationship.id)}"]`))continue;const edge=(diagram.edges||[]).find(e=>e.relationshipId===relationship.id),sourceNode=(diagram.nodes||[]).find(n=>n.id===edge?.sourceNodeId)||(diagram.nodes||[]).find(n=>n.elementId===relationship.sourceId),targetNode=(diagram.nodes||[]).find(n=>n.id===edge?.targetNodeId)||(diagram.nodes||[]).find(n=>n.elementId===relationship.targetId),region=interruptibleRegion(project,relationship.sourceId),regionNode=region&&(diagram.nodes||[]).find(n=>n.elementId===region.id);if(!sourceNode||!targetNode||!regionNode)continue;const from={x:sourceNode.x+sourceNode.width/2,y:sourceNode.y+sourceNode.height/2},to={x:targetNode.x+targetNode.width/2,y:targetNode.y+targetNode.height/2},pt=rectExitPoint(regionNode,from,to),glyph=document.createElementNS(svgNS,'path');glyph.classList.add('interrupting-edge-glyph');glyph.dataset.relationshipId=relationship.id;glyph.setAttribute('d',`M${pt.x-8} ${pt.y-10} l6 7 -5 5 10 0 -5 5 6 7`);glyph.setAttribute('fill','none');glyph.setAttribute('stroke','#15232d');glyph.setAttribute('stroke-width','2');glyph.setAttribute('stroke-linecap','round');glyph.setAttribute('stroke-linejoin','round');glyph.setAttribute('pointer-events','none');canvas.append(glyph);}
}

let scheduled=false;function refresh(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;ensureActivityWeightEditor();decorateActivityNotation()})}
new MutationObserver(refresh).observe(document.documentElement,{subtree:true,childList:true});window.addEventListener('load',refresh);refresh();

export {beginDiagramHeaderEdit,decorateActivityNotation,ensureActivityWeightEditor,verifyReconnect};

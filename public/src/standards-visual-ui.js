import {normalizeStandardRelationship,relationshipStandardStyle,setAggregateEnd} from './uml-sysml-standards.js';

let applying=false,rerenderPending=false;
const api=()=>globalThis.SystemsModelerAPI;

function normalizeLiveRelationships(){
  const service=api();if(!service)return false;const project=service.getProject();let changed=false;
  for(const relationship of project.relationships||[]){const before=JSON.stringify({stereotype:relationship.stereotype,sourceAggregation:relationship.sourceAggregation,targetAggregation:relationship.targetAggregation,aggregateEnd:relationship.aggregateEnd});normalizeStandardRelationship(relationship);const after=JSON.stringify({stereotype:relationship.stereotype,sourceAggregation:relationship.sourceAggregation,targetAggregation:relationship.targetAggregation,aggregateEnd:relationship.aggregateEnd});if(before!==after)changed=true}
  if(changed)service.save?.();return changed;
}

function applyMarker(path,attribute,marker){if(marker&&marker!=='none')path.setAttribute(attribute,`url(#${marker})`);else path.removeAttribute(attribute)}
function elementName(project,id){return project.root?.id===id?project.root.name:(project.elements||[]).find(e=>e.id===id)?.name||id||'Unresolved'}
function selectedAggregateRelationship(project,canvas){const selected=canvas.querySelector('path.edge.selected[data-semantic-id]');if(!selected)return null;const relationship=(project.relationships||[]).find(r=>r.id===selected.dataset.semanticId);return relationship&&['Composition','Aggregation'].includes(relationship.kind)?relationship:null}
function installAggregateEndEditor(project,canvas){
  const properties=document.getElementById('properties');if(!properties)return;
  properties.querySelector('.uml-aggregate-end-editor')?.remove();
  const relationship=selectedAggregateRelationship(project,canvas);if(!relationship)return;
  const field=document.createElement('label');field.className='field uml-aggregate-end-editor';
  const title=document.createElement('span');title.textContent=relationship.kind==='Composition'?'Composite / whole end':'Shared aggregate / whole end';
  const select=document.createElement('select');select.setAttribute('aria-label',title.textContent);
  const source=document.createElement('option');source.value='source';source.textContent=`First endpoint — ${elementName(project,relationship.sourceId)}`;
  const target=document.createElement('option');target.value='target';target.textContent=`Second endpoint — ${elementName(project,relationship.targetId)}`;
  select.append(source,target);select.value=relationship.aggregateEnd||(relationship.sourceAggregation!=='none'?'source':'target');
  const help=document.createElement('small');help.textContent='UML diamond is rendered on this whole/aggregate member end. New relationships use part/child first, whole/owner second.';
  select.onchange=()=>{setAggregateEnd(relationship,select.value);api()?.save?.();api()?.render?.();requestAnimationFrame(applyEdgeStandards)};
  field.append(title,select,help);properties.append(field);
}
function installPaletteGuidance(){for(const kind of ['Composition','Aggregation']){const button=document.querySelector(`#palette button[data-tool="${kind}"]`);if(!button)continue;const guidance=`${kind}: click the part/child first, then click the whole/owner. The diamond is placed on the whole/owner end.`;button.dataset.endpointGuidance=guidance;button.title=`${guidance}\n${button.title||''}`;button.setAttribute('aria-description',guidance)}}
function applyEdgeStandards(){
  if(applying)return;const service=api(),canvas=document.getElementById('canvas');if(!service||!canvas)return;applying=true;
  try{
    const project=service.getProject();
    for(const path of canvas.querySelectorAll('path.edge[data-semantic-id]')){
      if(path.classList.contains('sequence-message'))continue;
      const relationship=(project.relationships||[]).find(r=>r.id===path.dataset.semanticId);if(!relationship)continue;
      const style=relationshipStandardStyle(relationship);path.classList.toggle('dashed',style.dashed);applyMarker(path,'marker-start',style.sourceMarker);applyMarker(path,'marker-end',style.targetMarker);path.dataset.standardDirection=style.direction;path.dataset.aggregateEnd=relationship.aggregateEnd||'';
    }
    for(const overlay of canvas.querySelectorAll('line.marker-overlay'))overlay.style.display='none';
    installAggregateEndEditor(project,canvas);installPaletteGuidance();
  }finally{applying=false}
}
function synchronize(){const changed=normalizeLiveRelationships();if(changed&&!rerenderPending){rerenderPending=true;requestAnimationFrame(()=>{rerenderPending=false;api()?.render?.()})}requestAnimationFrame(applyEdgeStandards)}
function start(){const canvas=document.getElementById('canvas');if(!canvas||!api())return;const observer=new MutationObserver(synchronize);observer.observe(canvas,{childList:true,subtree:true,attributes:false});synchronize();globalThis.addEventListener('resize',applyEdgeStandards);globalThis.SystemsModelerStandardsUI={apply:applyEdgeStandards,synchronize,observer,setAggregateEnd}}
if(api())start();else globalThis.addEventListener('systems-modeler-ready',start,{once:true});

import {normalizeStandardRelationship,relationshipStandardStyle} from './uml-sysml-standards.js';

let applying=false,rerenderPending=false;
const api=()=>globalThis.SystemsModelerAPI;

function normalizeLiveRelationships(){
  const service=api();if(!service)return false;const project=service.getProject();let changed=false;
  for(const relationship of project.relationships||[]){const before=JSON.stringify({stereotype:relationship.stereotype,sourceAggregation:relationship.sourceAggregation,targetAggregation:relationship.targetAggregation});normalizeStandardRelationship(relationship);const after=JSON.stringify({stereotype:relationship.stereotype,sourceAggregation:relationship.sourceAggregation,targetAggregation:relationship.targetAggregation});if(before!==after)changed=true}
  if(changed)service.save?.();return changed;
}

function applyMarker(path,attribute,marker){if(marker&&marker!=='none')path.setAttribute(attribute,`url(#${marker})`);else path.removeAttribute(attribute)}
function applyEdgeStandards(){
  if(applying)return;const service=api(),canvas=document.getElementById('canvas');if(!service||!canvas)return;applying=true;
  try{
    const project=service.getProject();
    for(const path of canvas.querySelectorAll('path.edge[data-semantic-id]')){
      if(path.classList.contains('sequence-message'))continue;
      const relationship=(project.relationships||[]).find(r=>r.id===path.dataset.semanticId);if(!relationship)continue;
      const style=relationshipStandardStyle(relationship);path.classList.toggle('dashed',style.dashed);applyMarker(path,'marker-start',style.sourceMarker);applyMarker(path,'marker-end',style.targetMarker);path.dataset.standardDirection=style.direction;
    }
    for(const overlay of canvas.querySelectorAll('line.marker-overlay'))overlay.style.display='none';
  }finally{applying=false}
}
function synchronize(){const changed=normalizeLiveRelationships();if(changed&&!rerenderPending){rerenderPending=true;requestAnimationFrame(()=>{rerenderPending=false;api()?.render?.()})}requestAnimationFrame(applyEdgeStandards)}
function start(){const canvas=document.getElementById('canvas');if(!canvas||!api())return;const observer=new MutationObserver(synchronize);observer.observe(canvas,{childList:true,subtree:true,attributes:false});synchronize();globalThis.addEventListener('resize',applyEdgeStandards);globalThis.SystemsModelerStandardsUI={apply:applyEdgeStandards,synchronize,observer}}
if(api())start();else globalThis.addEventListener('systems-modeler-ready',start,{once:true});

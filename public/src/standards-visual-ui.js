import {normalizeStandardRelationship,relationshipStandardStyle,setAggregateEnd} from './uml-sysml-standards.js';

let applying=false,rerenderPending=false;
const api=()=>globalThis.SystemsModelerAPI;

function elementName(project,id){return project.root?.id===id?project.root.name:(project.elements||[]).find(e=>e.id===id)?.name||id||'Unresolved'}
function syncEdgeToRelationship(project,relationship,before){
  if(!before||before.sourceId===relationship.sourceId&&before.targetId===relationship.targetId)return;
  for(const diagram of project.diagrams||[]){
    for(const edge of diagram.edges||[]){
      if(edge.relationshipId!==relationship.id)continue;
      const wasReversed=edge.sourceId===before.sourceId&&edge.targetId===before.targetId;
      edge.sourceId=relationship.sourceId;edge.targetId=relationship.targetId;
      const sourceNode=(diagram.nodes||[]).find(n=>n.elementId===relationship.sourceId),targetNode=(diagram.nodes||[]).find(n=>n.elementId===relationship.targetId);
      if(sourceNode)edge.sourceNodeId=sourceNode.id;if(targetNode)edge.targetNodeId=targetNode.id;
      if(wasReversed&&Array.isArray(edge.points))edge.points=[...edge.points].reverse();
    }
  }
}
function normalizeLiveRelationships(){
  const service=api();if(!service)return false;const project=service.getProject();let changed=false;
  for(const relationship of project.relationships||[]){
    const before={sourceId:relationship.sourceId,targetId:relationship.targetId,state:JSON.stringify({stereotype:relationship.stereotype,sourceAggregation:relationship.sourceAggregation,targetAggregation:relationship.targetAggregation,aggregateEnd:relationship.aggregateEnd,ownerEnd:relationship.ownerEnd})};
    normalizeStandardRelationship(relationship);syncEdgeToRelationship(project,relationship,before);
    const after=JSON.stringify({stereotype:relationship.stereotype,sourceAggregation:relationship.sourceAggregation,targetAggregation:relationship.targetAggregation,aggregateEnd:relationship.aggregateEnd,ownerEnd:relationship.ownerEnd});
    if(before.state!==after||before.sourceId!==relationship.sourceId||before.targetId!==relationship.targetId)changed=true;
  }
  if(changed)service.save?.();return changed;
}

function applyMarker(path,attribute,marker){if(marker&&marker!=='none')path.setAttribute(attribute,`url(#${marker})`);else path.removeAttribute(attribute)}
function selectedAggregateRelationship(project,canvas){const selected=canvas.querySelector('path.edge.selected[data-semantic-id]');if(!selected)return null;const relationship=(project.relationships||[]).find(r=>r.id===selected.dataset.semanticId);return relationship&&['Composition','Aggregation'].includes(relationship.kind)?relationship:null}
function installAggregateEndEditor(project,canvas){
  const properties=document.getElementById('properties');if(!properties)return;
  properties.querySelector('.uml-aggregate-end-editor')?.remove();
  const relationship=selectedAggregateRelationship(project,canvas);if(!relationship)return;
  const field=document.createElement('div');field.className='field uml-aggregate-end-editor';
  const title=document.createElement('span');title.textContent=relationship.kind==='Composition'?'Composition ownership':'Shared aggregation ownership';
  const summary=document.createElement('strong');summary.textContent=`Owner/source: ${elementName(project,relationship.sourceId)} → Child/target: ${elementName(project,relationship.targetId)}`;
  const help=document.createElement('small');help.textContent=relationship.kind==='Composition'?'UML/SysML composition uses a filled diamond on the whole/owner source end.':'UML/SysML shared aggregation uses a hollow diamond on the aggregate/whole source end.';
  const reverse=document.createElement('button');reverse.type='button';reverse.textContent='Swap owner and child';reverse.title='Reverse the semantic endpoints, then keep the aggregate diamond on source/owner.';
  reverse.onclick=()=>{const before={sourceId:relationship.sourceId,targetId:relationship.targetId};setAggregateEnd(relationship,'target');syncEdgeToRelationship(project,relationship,before);api()?.save?.();api()?.render?.();requestAnimationFrame(applyEdgeStandards)};
  field.append(title,summary,help,reverse);properties.append(field);
}
function installPaletteGuidance(){for(const kind of ['Composition','Aggregation']){const button=document.querySelector(`#palette button[data-tool="${kind}"]`);if(!button)continue;const guidance=`${kind}: click the whole/owner first, then click the part/child. The diamond is always on the owner/source end.`;button.dataset.endpointGuidance=guidance;button.title=`${guidance}\n${button.title||''}`;button.setAttribute('aria-description',guidance)}}
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

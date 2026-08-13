import {valueFor} from './profiles/catia-cameo.js';
const text=v=>String(v??'').trim();
const mapOf=items=>{const m=new Map();for(const x of items||[])for(const v of [x.id,x.externalId,x.name,x.qualifiedNameString])if(text(v)){m.set(text(v),x);m.set(text(v).toLowerCase(),x)}return m};
const get=(m,v)=>m.get(text(v))||m.get(text(v).toLowerCase())||null;
const dup=(items,label)=>{const seen=new Set(),out=[];for(const x of items||[]){if(!x?.id)out.push(`${label} has no stable ID.`);else if(seen.has(x.id))out.push(`Duplicate ${label} ID ${x.id}.`);else seen.add(x.id)}return out};
export function normalizeImportedPresentations(project,parsed){
 const issues=[],dm=mapOf(project.diagrams),rm=mapOf(project.relationships),em=mapOf([project.root,...(project.elements||[])]),ids=new Set();
 for(const sheet of parsed?.sheets||[]){
  if(sheet.definition?.role==='diagrams')for(const row of sheet.rows||[]){const d=get(dm,valueFor(row,'diagramId')||valueFor(row,'externalId'));if(d)ids.add(d.id)}
  if(sheet.definition?.role!=='diagramEdges')continue;
  for(const row of sheet.rows||[]){
   const d=get(dm,valueFor(row,'diagramId')),r=get(rm,valueFor(row,'semanticEdge')||valueFor(row,'relationshipId')||valueFor(row,'externalId'));
   if(!d||!r){issues.push(`${sheet.name} row ${row.__rowNumber}: unresolved diagram or relationship.`);continue}
   ids.add(d.id);const edgeId=text(valueFor(row,'edgePresentationId')),edge=(d.edges||[]).find(e=>e.id===edgeId||e.relationshipId===r.id);
   if(!edge){issues.push(`${d.name}: missing edge presentation ${edgeId||r.id}.`);continue}
   const sp=text(valueFor(row,'sourcePresentation')),tp=text(valueFor(row,'targetPresentation')),se=get(em,valueFor(row,'source'))||get(em,r.sourceId),te=get(em,valueFor(row,'target'))||get(em,r.targetId);
   const sn=sp?(d.nodes||[]).find(n=>n.id===sp):(d.nodes||[]).find(n=>n.elementId===se?.id),tn=tp?(d.nodes||[]).find(n=>n.id===tp):(d.nodes||[]).find(n=>n.elementId===te?.id);
   const found=r.kind==='Message'&&r.messageSort==='found',lost=r.kind==='Message'&&r.messageSort==='lost';
   if(!sn&&!found)issues.push(`${d.name}: edge ${edge.id} cannot resolve source presentation ${sp||r.sourceId}.`);
   if(!tn&&!lost)issues.push(`${d.name}: edge ${edge.id} cannot resolve target presentation ${tp||r.targetId}.`);
   Object.assign(edge,{sourceNodeId:sn?.id||null,targetNodeId:tn?.id||null,sourcePresentationId:sn?.id||null,targetPresentationId:tn?.id||null,sourceSemanticId:r.sourceId||se?.id||null,targetSemanticId:r.targetId||te?.id||null,sourceId:r.sourceId||se?.id||null,targetId:r.targetId||te?.id||null});
   if(r.kind==='Message'){const y=Number(row['Occurrence Y']??row['Message Y']??row['Label Y']);if(Number.isFinite(y))edge.occurrenceY=y;edge.messageSort=r.messageSort;edge.sequenceOrder=r.sequenceOrder}
  }
 }
 for(const id of ids){const d=project.diagrams.find(x=>x.id===id);if(d&&!(d.nodes||[]).length&&!(d.edges||[]).length)issues.push(`Imported diagram ${d.name} is blank.`)}
 return{issues,importedDiagramIds:[...ids]};
}
export function validateImportedPresentations(project,{diagramIds=null}={}){
 const issues=[...dup(project.elements,'element'),...dup(project.relationships,'relationship'),...dup(project.diagrams,'diagram')],scope=diagramIds?new Set(diagramIds):null;
 for(const d of project.diagrams||[]){if(scope&&!scope.has(d.id))continue;issues.push(...dup(d.nodes,`${d.name} presentation`),...dup(d.edges,`${d.name} edge`));const nodes=new Set((d.nodes||[]).map(n=>n.id));
  for(const n of d.nodes||[])if(!((project.elements||[]).some(e=>e.id===n.elementId)||project.root?.id===n.elementId))issues.push(`${d.name}: presentation ${n.id} references missing element ${n.elementId}.`);
  for(const e of d.edges||[]){const r=(project.relationships||[]).find(x=>x.id===e.relationshipId);if(!r){issues.push(`${d.name}: edge ${e.id} references missing relationship ${e.relationshipId}.`);continue}const found=r.kind==='Message'&&r.messageSort==='found',lost=r.kind==='Message'&&r.messageSort==='lost';if(!found&&(!e.sourceNodeId||!nodes.has(e.sourceNodeId)))issues.push(`${d.name}: edge ${e.id} has unresolved graphical source.`);if(!lost&&(!e.targetNodeId||!nodes.has(e.targetNodeId)))issues.push(`${d.name}: edge ${e.id} has unresolved graphical target.`)}
 }
 return issues;
}

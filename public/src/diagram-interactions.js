const applyRelationshipTreePolicy=()=>{const modelTab=document.getElementById('modelTab');if(!modelTab?.classList.contains('active'))return;for(const row of document.querySelectorAll('#tree .tree-row[data-type="relationship"]'))row.hidden=true};
let relationshipTreePolicyScheduled=false;
const queueRelationshipTreePolicy=()=>{if(relationshipTreePolicyScheduled)return;relationshipTreePolicyScheduled=true;requestAnimationFrame(()=>{relationshipTreePolicyScheduled=false;applyRelationshipTreePolicy()})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{const tree=document.getElementById('tree');if(tree)new MutationObserver(queueRelationshipTreePolicy).observe(tree,{childList:true});document.getElementById('modelTab')?.addEventListener('click',queueRelationshipTreePolicy);queueRelationshipTreePolicy()},{once:true});else{const tree=document.getElementById('tree');if(tree)new MutationObserver(queueRelationshipTreePolicy).observe(tree,{childList:true});document.getElementById('modelTab')?.addEventListener('click',queueRelationshipTreePolicy);queueRelationshipTreePolicy()}

/** Shared, notation-neutral diagram selection and movement helpers. */
export function pointToSegmentDistance(point,start,end){
  const dx=end.x-start.x,dy=end.y-start.y,lengthSquared=dx*dx+dy*dy;
  if(!lengthSquared)return Math.hypot(point.x-start.x,point.y-start.y);
  const t=Math.max(0,Math.min(1,((point.x-start.x)*dx+(point.y-start.y)*dy)/lengthSquared));
  return Math.hypot(point.x-(start.x+t*dx),point.y-(start.y+t*dy));
}
export function hitTestPresentations({nodes=[],edges=[]},point,{edgeTolerance=8,includeNonVisual=false}={}){
  const hits=[];
  for(let index=0;index<edges.length;index++){
    const edge=edges[index],path=edge.visiblePath||edge.path||edge.points||[];
    const distance=path.length>1?Math.min(...path.slice(0,-1).map((start,i)=>pointToSegmentDistance(point,start,path[i+1]))):Infinity;
    if(distance<=edgeTolerance)hits.push({type:'edge',id:edge.id,distance,zOrder:edge.zOrder??index});
  }
  for(let index=0;index<nodes.length;index++){
    const node=nodes[index];if(!includeNonVisual&&(node.nonVisualContext||node.isContextBoundary))continue;
    if(point.x>=node.x&&point.x<=node.x+node.width&&point.y>=node.y&&point.y<=node.y+node.height)hits.push({type:'node',id:node.id,distance:0,zOrder:node.zOrder??index});
  }
  return hits.sort((left,right)=>right.zOrder-left.zOrder||left.distance-right.distance);
}
export function nodesInSelectionBox(nodes,start,end,{intersect=false}={}){
  const box={left:Math.min(start.x,end.x),top:Math.min(start.y,end.y),right:Math.max(start.x,end.x),bottom:Math.max(start.y,end.y)};
  return nodes.filter(node=>{if(node.nonVisualContext||node.isContextBoundary)return false;const right=node.x+node.width,bottom=node.y+node.height;return intersect?right>=box.left&&node.x<=box.right&&bottom>=box.top&&node.y<=box.bottom:node.x>=box.left&&node.y>=box.top&&right<=box.right&&bottom<=box.bottom}).map(node=>node.id);
}
export function updateSelection(current,id,{additive=false,toggle=true,preserveSelectedGroup=true}={}){
  const alreadySelected=current.has(id);
  if(!additive&&preserveSelectedGroup&&alreadySelected&&current.size>1)return new Set(current);
  const next=new Set(additive?current:[]);
  if(additive&&toggle&&next.has(id))next.delete(id);else next.add(id);
  return next;
}
export function captureGroupGeometry(nodes,selectedIds){return nodes.filter(node=>selectedIds.has(node.id)).map(node=>({id:node.id,x:node.x,y:node.y}))}
export function moveGroup(nodes,starts,dx,dy){const byId=new Map(nodes.map(node=>[node.id,node]));for(const start of starts){const node=byId.get(start.id);if(node){node.x=start.x+dx;node.y=start.y+dy}}return nodes}

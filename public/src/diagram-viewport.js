import {DiagramSpatialIndex} from './diagram-spatial-index.js';

const cache=new WeakMap();
function cachedIndex(diagram){let entry=cache.get(diagram);const signature=`${diagram?.nodes?.length||0}:${diagram?.edges?.length||0}:${diagram?.revision||diagram?.modifiedAt||''}`;if(!entry||entry.signature!==signature){entry={signature,index:new DiagramSpatialIndex(diagram)};cache.set(diagram,entry)}return entry.index}
export function invalidateDiagramViewport(diagram){if(diagram)cache.delete(diagram)}
export function diagramViewportRect({scrollLeft=0,scrollTop=0,clientWidth=0,clientHeight=0,zoom=1}={}){const z=Math.max(.01,Number(zoom)||1);return{x:scrollLeft/z,y:scrollTop/z,width:clientWidth/z,height:clientHeight/z}}
export function diagramRenderSet(diagram,viewport,{margin=200,selectedNodeIds=[],selectedEdgeIds=[]}={}){
  const index=cachedIndex(diagram),visible=index.query(viewport,{margin}),nodeMap=new Map(visible.nodes.map(node=>[node.id,node])),edgeMap=new Map(visible.edges.map(edge=>[edge.id,edge]));
  for(const id of selectedNodeIds||[]){const node=index.nodesById.get(id);if(node)nodeMap.set(id,node)}
  for(const id of selectedEdgeIds||[]){const edge=index.edgesById.get(id);if(edge)edgeMap.set(id,edge)}
  // Preserve endpoints for every visible relationship so edge geometry remains resolvable.
  for(const edge of edgeMap.values()){for(const id of [edge.sourceNodeId,edge.targetNodeId]){const node=index.nodesById.get(id);if(node)nodeMap.set(id,node)}}
  return{nodes:[...nodeMap.values()],edges:[...edgeMap.values()],viewport,queryBox:visible.box,totalNodes:index.nodesById.size,totalEdges:index.edgesById.size,renderedNodes:nodeMap.size,renderedEdges:edgeMap.size,index};
}
export function updateDiagramViewportNode(diagram,node){const index=cachedIndex(diagram);index.updateNode(node);return index}
export function updateDiagramViewportEdge(diagram,edge){const index=cachedIndex(diagram);index.updateEdge(edge);return index}

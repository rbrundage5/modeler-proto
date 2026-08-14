import {DiagramSpatialIndex} from './diagram-spatial-index.js';

const cache=new WeakMap();
function cachedIndex(diagram){let entry=cache.get(diagram);const signature=`${diagram?.nodes?.length||0}:${diagram?.edges?.length||0}:${diagram?.revision||diagram?.modifiedAt||''}`;if(!entry||entry.signature!==signature){entry={signature,index:new DiagramSpatialIndex(diagram)};cache.set(diagram,entry)}return entry.index}
export function invalidateDiagramViewport(diagram){if(diagram)cache.delete(diagram)}
export function diagramViewportRect({scrollLeft=0,scrollTop=0,clientWidth=0,clientHeight=0,zoom=1}={}){const z=Math.max(.01,Number(zoom)||1);return{x:scrollLeft/z,y:scrollTop/z,width:clientWidth/z,height:clientHeight/z}}
export function diagramRenderSet(diagram,viewport,{margin=200,overscan=margin,selectedNodeIds=[],selectedEdgeIds=[]}={}){
  const index=cachedIndex(diagram),visible=index.query(viewport,{margin:overscan}),nodeMap=new Map(visible.nodes.map(node=>[node.id,node])),edgeMap=new Map(visible.edges.map(edge=>[edge.id,edge]));
  for(const id of selectedNodeIds||[]){const node=index.nodesById.get(id);if(node)nodeMap.set(id,node)}
  for(const id of selectedEdgeIds||[]){const edge=index.edgesById.get(id);if(edge)edgeMap.set(id,edge)}
  for(const edge of edgeMap.values()){for(const id of [edge.sourceNodeId,edge.targetNodeId]){const node=index.nodesById.get(id);if(node)nodeMap.set(id,node)}}
  return{nodes:[...nodeMap.values()],edges:[...edgeMap.values()],viewport,queryBox:visible.box,totalNodes:index.nodesById.size,totalEdges:index.edgesById.size,renderedNodes:nodeMap.size,renderedEdges:edgeMap.size,index};
}
export function diagramHitTest(diagram,point,{radius=6}={}){const index=cachedIndex(diagram),rect={x:point.x-radius,y:point.y-radius,width:radius*2,height:radius*2},nodes=index.nodeIndex.query(rect).map(item=>item.value);if(nodes.length){nodes.sort((a,b)=>(b.zIndex||0)-(a.zIndex||0));return{type:'node',node:nodes[0]}}const edges=index.edgeIndex.query(rect).map(item=>item.value);return edges.length?{type:'edge',edge:edges[0]}:null}
export function updateDiagramViewportNode(diagram,node){const index=cachedIndex(diagram);index.updateNode(node);return index}
export function updateDiagramViewportEdge(diagram,edge){const index=cachedIndex(diagram);index.updateEdge(edge);return index}

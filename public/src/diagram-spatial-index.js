import {SpatialIndex} from './spatial-index.js';

function nodeBox(node){return{x:Number(node.x)||0,y:Number(node.y)||0,width:Math.max(1,Number(node.width)||1),height:Math.max(1,Number(node.height)||1)}}
function edgePoints(edge,nodesById){
  const points=(edge.points||edge.waypoints||[]).map(p=>({x:Number(p.x)||0,y:Number(p.y)||0}));
  if(points.length)return points;
  const source=nodesById.get(edge.sourceNodeId),target=nodesById.get(edge.targetNodeId);
  const center=n=>({x:(Number(n?.x)||0)+(Number(n?.width)||0)/2,y:(Number(n?.y)||0)+(Number(n?.height)||0)/2});
  return source&&target?[center(source),center(target)]:[];
}
function pointsBox(points,padding=8){if(!points.length)return null;let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;for(const p of points){minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y)}return{x:minX-padding,y:minY-padding,width:Math.max(1,maxX-minX+padding*2),height:Math.max(1,maxY-minY+padding*2)}}

export class DiagramSpatialIndex{
  constructor(diagram,{cellSize=320}={}){this.cellSize=cellSize;this.nodeIndex=new SpatialIndex({cellSize});this.edgeIndex=new SpatialIndex({cellSize});this.nodesById=new Map();this.edgesById=new Map();this.rebuild(diagram)}
  rebuild(diagram){this.diagram=diagram;this.nodeIndex.clear();this.edgeIndex.clear();this.nodesById.clear();this.edgesById.clear();for(const node of diagram?.nodes||[]){this.nodesById.set(node.id,node);this.nodeIndex.insert(node.id,nodeBox(node),node)}for(const edge of diagram?.edges||[]){this.edgesById.set(edge.id,edge);const box=pointsBox(edgePoints(edge,this.nodesById));if(box)this.edgeIndex.insert(edge.id,box,edge)}return this}
  updateNode(node){this.nodesById.set(node.id,node);this.nodeIndex.insert(node.id,nodeBox(node),node);for(const edge of this.diagram?.edges||[])if(edge.sourceNodeId===node.id||edge.targetNodeId===node.id)this.updateEdge(edge);return node}
  removeNode(id){this.nodesById.delete(id);this.nodeIndex.remove(id)}
  updateEdge(edge){this.edgesById.set(edge.id,edge);const box=pointsBox(edgePoints(edge,this.nodesById));if(box)this.edgeIndex.insert(edge.id,box,edge);else this.edgeIndex.remove(edge.id);return edge}
  removeEdge(id){this.edgesById.delete(id);this.edgeIndex.remove(id)}
  query(rect,{margin=160}={}){const box={x:rect.x-margin,y:rect.y-margin,width:rect.width+margin*2,height:rect.height+margin*2};return{nodes:this.nodeIndex.query(box).map(item=>item.value),edges:this.edgeIndex.query(box).map(item=>item.value),box}}
  stats(){return{nodes:this.nodesById.size,edges:this.edgesById.size,nodeCells:this.nodeIndex.cells.size,edgeCells:this.edgeIndex.cells.size}}
}

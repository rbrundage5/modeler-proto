const VIRTUAL_IMPORT="import {diagramRenderSet,diagramViewportRect} from '/src/diagram-viewport.js';\n";

const VIRTUAL_RENDER=`function renderCanvas(){const svg=$('canvas');svg.replaceChildren();defs(svg);svg.style.transform=\`scale(\${zoom})\`;const d=activeDiagram();if(!d)return;drawDiagramFrame(svg,d);if(isIBD(d))synchronizeIBDPresentations(project,d);const wrap=$('canvasWrap'),viewport=diagramViewportRect({scrollLeft:wrap?.scrollLeft||0,scrollTop:wrap?.scrollTop||0,clientWidth:wrap?.clientWidth||3200,clientHeight:wrap?.clientHeight||2200,zoom}),renderSet=diagramRenderSet(d,viewport,{margin:260,selectedNodeIds:[...selectedNodeIds,...(selected.nodeId?[selected.nodeId]:[])],selectedEdgeIds:selected.edgeId?[selected.edgeId]:[]}),renderDiagram={...d,nodes:renderSet.nodes,edges:renderSet.edges};svg.dataset.totalNodes=String(renderSet.totalNodes);svg.dataset.totalEdges=String(renderSet.totalEdges);svg.dataset.renderedNodes=String(renderSet.renderedNodes);svg.dataset.renderedEdges=String(renderSet.renderedEdges);if(d.diagramType==='Sequence Diagram')renderSequence(svg,renderDiagram);else{const visibleNodes=isIBD(d)?visibleIBDNodes(renderDiagram):renderSet.nodes,visibleIds=new Set(visibleNodes.map(n=>n.id)),visibleEdges=renderSet.edges.filter(e=>visibleIds.has(e.sourceNodeId)&&visibleIds.has(e.targetNodeId));for(const e of visibleEdges)drawEdge(svg,d,e);for(const n of visibleNodes)drawNode(svg,d,n);for(const e of visibleEdges)drawEdgeMarker(svg,d,e);for(const e of visibleEdges)drawEdgeEditOverlay(svg,d,e)}drawSelectionBounds(svg,renderDiagram);attachCanvasSelection(svg,d);attachEdgeCanvasEvents(svg,d)}`;

function absoluteImports(source){
  return source.replace(/from\s+(['"])\.\//g,"from $1/src/").replace(/import\s+(['"])\.\//g,"import $1/src/");
}

export function transformAppSource(source){
  if(typeof source!=='string'||!source.includes('function renderCanvas(){'))throw new Error('APP_RENDER_CANVAS_NOT_FOUND');
  const start=source.indexOf('function renderCanvas(){');
  const end=source.indexOf('function diagramHeaderLabel',start);
  if(end<0)throw new Error('APP_RENDER_CANVAS_BOUNDARY_NOT_FOUND');
  const rewritten=source.slice(0,start)+VIRTUAL_RENDER+'\n'+source.slice(end);
  return VIRTUAL_IMPORT+absoluteImports(rewritten);
}

export function renderTransformContract(){return{virtualized:true,createsOffscreenPresentations:false,sourceBoundary:'renderCanvas',renderSet:'diagramRenderSet'}}

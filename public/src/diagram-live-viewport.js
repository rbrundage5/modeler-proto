import {diagramRenderSet,diagramHitTest} from './diagram-viewport.js';

const READY='systems-modeler-ready';
const SVG_NS='http://www.w3.org/2000/svg';
const byId=id=>document.getElementById(id);

function whenReady(){return window.SystemsModelerAPI?Promise.resolve(window.SystemsModelerAPI):new Promise(resolve=>window.addEventListener(READY,()=>resolve(window.SystemsModelerAPI),{once:true}))}

export class LiveDiagramViewport{
  constructor(api,{overscan=320,maxNodes=2500,maxEdges=5000}={}){
    this.api=api;this.wrap=byId('canvasWrap');this.svg=byId('canvas');this.overscan=overscan;this.maxNodes=maxNodes;this.maxEdges=maxEdges;this.raf=0;this.lastDiagramId=null;this.lastRevision=-1;this.stats={logicalNodes:0,logicalEdges:0,visibleNodes:0,visibleEdges:0};
    this.bind();this.schedule();
  }
  bind(){
    this.wrap?.addEventListener('scroll',()=>this.schedule(),{passive:true});
    this.wrap?.addEventListener('wheel',()=>this.schedule(),{passive:true});
    window.addEventListener('resize',()=>this.schedule());
    const revision=byId('revisionStatus');if(revision)new MutationObserver(()=>this.schedule()).observe(revision,{childList:true,subtree:true,characterData:true});
    if(this.svg)new MutationObserver(()=>this.schedule()).observe(this.svg,{childList:true,subtree:false});
    this.wrap?.addEventListener('pointerdown',event=>this.onPointerDown(event),{capture:true});
  }
  schedule(){if(this.raf)return;this.raf=requestAnimationFrame(()=>{this.raf=0;this.update()})}
  viewport(){const zoom=this.currentZoom(),wrap=this.wrap;return{x:(wrap?.scrollLeft||0)/zoom,y:(wrap?.scrollTop||0)/zoom,width:(wrap?.clientWidth||1200)/zoom,height:(wrap?.clientHeight||800)/zoom}}
  currentZoom(){const transform=this.svg?.style?.transform||'';const match=/scale\(([^)]+)\)/.exec(transform);return Math.max(.01,Number(match?.[1]||1)||1)}
  activeDiagram(){return this.api.activeDiagram?.()||null}
  update(){
    const diagram=this.activeDiagram();if(!diagram||!this.svg)return;
    const selected=this.api.getSelection?.()||{};
    const renderSet=diagramRenderSet(diagram,this.viewport(),{overscan:this.overscan,selectedNodeIds:selected.nodeId?[selected.nodeId]:[],selectedEdgeIds:selected.edgeId?[selected.edgeId]:[]});
    this.lastDiagramId=diagram.id;this.lastRevision=this.api.getProject()?.revision||0;
    this.stats={logicalNodes:diagram.nodes?.length||0,logicalEdges:diagram.edges?.length||0,visibleNodes:renderSet.nodes.length,visibleEdges:renderSet.edges.length};
    this.svg.dataset.logicalNodes=String(this.stats.logicalNodes);this.svg.dataset.logicalEdges=String(this.stats.logicalEdges);this.svg.dataset.viewportNodes=String(this.stats.visibleNodes);this.svg.dataset.viewportEdges=String(this.stats.visibleEdges);
    const keepNodeIds=new Set(renderSet.nodes.slice(0,this.maxNodes).map(node=>String(node.id))),keepEdgeIds=new Set(renderSet.edges.slice(0,this.maxEdges).map(edge=>String(edge.id)));
    for(const element of [...this.svg.querySelectorAll('[data-presentation-id]')]){
      const id=String(element.getAttribute('data-presentation-id')||'');
      if(!id)continue;
      const semanticKind=element.getAttribute('data-semantic-kind');
      const isEdge=element.classList.contains('edge')||semanticKind&&keepEdgeIds.has(id);
      const keep=isEdge?keepEdgeIds.has(id):keepNodeIds.has(id);
      if(!keep)element.remove();
    }
    this.svg.dataset.retainedPresentations=String(this.svg.querySelectorAll('[data-presentation-id]').length);
  }
  onPointerDown(event){
    if(event.target!==this.svg)return;const diagram=this.activeDiagram();if(!diagram)return;
    const rect=this.svg.getBoundingClientRect(),zoom=this.currentZoom(),point={x:(event.clientX-rect.left)/zoom,y:(event.clientY-rect.top)/zoom};
    const hit=diagramHitTest(diagram,point,{radius:8});
    if(!hit)return;
    if(hit.type==='node')this.api.selectElement?.(hit.node.elementId);
  }
  diagnostics(){return{...this.stats,overscan:this.overscan,maxNodes:this.maxNodes,maxEdges:this.maxEdges}}
}

whenReady().then(api=>{const viewport=new LiveDiagramViewport(api);window.SystemsModelerDiagramViewport=viewport;});

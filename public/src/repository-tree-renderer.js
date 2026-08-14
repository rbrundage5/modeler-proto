import {RepositoryViewport} from './repository-viewport.js';
import {VirtualRepositoryDom} from './repository-virtual-dom.js';

export class RepositoryTreeRenderer{
  constructor(container,project,{collapsed=new Set(),rowHeight=28,overscan=8,maxRows=200,renderRow}={}){if(!container)throw new Error('Repository container is required');if(typeof renderRow!=='function')throw new Error('Repository row renderer is required');this.container=container;this.viewport=new RepositoryViewport(project,{collapsed,rowHeight,overscan,maxRows});this.dom=new VirtualRepositoryDom(container,{rowHeight,renderRow});this.onScroll=()=>this.render();container.addEventListener('scroll',this.onScroll,{passive:true})}
  render(){const view=this.viewport.window({scrollTop:this.container.scrollTop,viewportHeight:this.container.clientHeight});this.dom.render(view);return view}
  setProject(project,collapsed=this.viewport.index.collapsed){this.viewport.setProject(project,collapsed);return this.render()}
  setCollapsed(collapsed){this.viewport.setCollapsed(collapsed);return this.render()}
  reveal(id){const next=this.viewport.reveal(id,{scrollTop:this.container.scrollTop,viewportHeight:this.container.clientHeight});if(next!==this.container.scrollTop)this.container.scrollTop=next;return this.render()}
  destroy(){this.container.removeEventListener('scroll',this.onScroll);this.container.replaceChildren()}
  stats(){return{...this.viewport.stats(),domRows:this.dom.rowCount()}}
}

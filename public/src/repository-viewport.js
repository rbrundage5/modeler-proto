import {RepositoryVisibleIndex} from './repository-visible-index.js';
import {virtualRange} from './virtual-list.js';

export class RepositoryViewport{
  constructor(project,{collapsed=new Set(),rowHeight=28,overscan=8,maxRows=200}={}){this.rowHeight=rowHeight;this.overscan=overscan;this.maxRows=maxRows;this.index=new RepositoryVisibleIndex(project,{collapsed})}
  setProject(project,collapsed=this.index?.collapsed||new Set()){this.index=new RepositoryVisibleIndex(project,{collapsed});return this}
  setCollapsed(collapsed){this.index.setCollapsed(collapsed);return this}
  window({scrollTop=0,viewportHeight=0}={}){const total=this.index.total(),range=virtualRange({scrollTop,viewportHeight,rowHeight:this.rowHeight,count:total,overscan:this.overscan}),end=Math.min(range.end,range.start+this.maxRows),rows=this.index.window(range.start,end-range.start);return{...range,end,rows,rendered:rows.length,totalRows:total}}
  reveal(id,{scrollTop=0,viewportHeight=0}={}){const index=this.index.indexOf(id);if(index<0)return scrollTop;const top=index*this.rowHeight,bottom=top+this.rowHeight;if(top<scrollTop)return top;if(bottom>scrollTop+viewportHeight)return Math.max(0,bottom-viewportHeight);return scrollTop}
  stats(){return{totalRows:this.index.total(),maxDomRows:this.maxRows,rowHeight:this.rowHeight}}
}

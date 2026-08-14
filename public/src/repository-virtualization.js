import {projectIndex,indexedChildren} from './model-index.js';
import {virtualRange} from './virtual-list.js';

const defaultCompare=(a,b)=>a.kind==='Requirement'&&b.kind==='Requirement'?(a.requirementOrder??0)-(b.requirementOrder??0)||String(a.name||'').localeCompare(String(b.name||'')):String(a.name||'').localeCompare(String(b.name||''));

export function flattenVisibleRepository(project,{collapsed=new Set(),sort=defaultCompare,root=project.root}={}){
  if(!root)return[];
  projectIndex(project);
  const rows=[],stack=[{element:root,depth:0}];
  while(stack.length){
    const current=stack.pop(),children=[...indexedChildren(project,current.element.id)].sort(sort),hasChildren=children.length>0,isCollapsed=hasChildren&&collapsed.has(current.element.id);
    rows.push({id:current.element.id,element:current.element,depth:current.depth,hasChildren,isCollapsed});
    if(!isCollapsed)for(let i=children.length-1;i>=0;i--)stack.push({element:children[i],depth:current.depth+1});
  }
  return rows;
}

export function repositoryWindow(rows,{scrollTop=0,viewportHeight=0,rowHeight=28,overscan=8,maxRows=200}={}){
  const range=virtualRange({scrollTop,viewportHeight,rowHeight,count:rows.length,overscan});
  const end=Math.min(range.end,range.start+Math.max(1,maxRows));
  return{...range,end,rows:rows.slice(range.start,end),rendered:end-range.start};
}

export function scrollTopForRepositoryRow(rows,id,{rowHeight=28,viewportHeight=0,currentScrollTop=0}={}){
  const index=rows.findIndex(row=>row.id===id);if(index<0)return currentScrollTop;
  const top=index*rowHeight,bottom=top+rowHeight,viewBottom=currentScrollTop+viewportHeight;
  if(top<currentScrollTop)return top;
  if(bottom>viewBottom)return Math.max(0,bottom-viewportHeight);
  return currentScrollTop;
}

export class RepositoryVirtualizer{
  constructor({rowHeight=28,overscan=8,maxRows=200}={}){this.rowHeight=rowHeight;this.overscan=overscan;this.maxRows=maxRows;this.project=null;this.collapsed=new Set();this.rows=[];this.version=0}
  setProject(project){this.project=project;return this.rebuild()}
  setCollapsed(ids){this.collapsed=ids instanceof Set?new Set(ids):new Set(ids||[]);return this.rebuild()}
  toggle(id){if(this.collapsed.has(id))this.collapsed.delete(id);else this.collapsed.add(id);return this.rebuild()}
  rebuild(){this.rows=this.project?flattenVisibleRepository(this.project,{collapsed:this.collapsed}):[];this.version++;return this.rows}
  window(options={}){return repositoryWindow(this.rows,{rowHeight:this.rowHeight,overscan:this.overscan,maxRows:this.maxRows,...options})}
  reveal(id,options={}){return scrollTopForRepositoryRow(this.rows,id,{rowHeight:this.rowHeight,...options})}
  stats(){return{visibleSemanticRows:this.rows.length,version:this.version,maxDomRows:this.maxRows}}
}

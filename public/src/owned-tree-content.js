import './infinite-diagram-workspace.js';
const $=id=>document.getElementById(id);
const api=()=>globalThis.SystemsModelerAPI;
let observer=null,scheduled=false,working=false;

function project(){return api()?.getProject?.()||null}
function byId(p,id){if(!p||!id)return null;if(p.root?.id===id)return p.root;return(p.elements||[]).find(e=>e.id===id)||null}
function depthOf(p,id){let depth=0,current=byId(p,id),seen=new Set();while(current?.ownerId&&!seen.has(current.id)){seen.add(current.id);depth++;current=byId(p,current.ownerId)}return depth}
function hiddenByCollapse(p,ownerId){const collapsed=new Set(p?.uiState?.collapsedTreeIds||[]);let current=byId(p,ownerId),seen=new Set();while(current&&!seen.has(current.id)){seen.add(current.id);if(collapsed.has(current.id))return true;current=byId(p,current.ownerId)}return false}
function ownerRow(tree,ownerId){return[...tree.querySelectorAll('.tree-row[data-type="element"]')].find(row=>row.dataset.id===ownerId)||null}
function nextOwnerBoundary(owner,ownerDepth){let cursor=owner.nextElementSibling;while(cursor){if(cursor.matches?.('.tree-row[data-type="element"]')){const px=parseFloat(cursor.style.paddingLeft||'6'),depth=Math.max(0,Math.round((px-6)/16));if(depth<=ownerDepth)return cursor}cursor=cursor.nextElementSibling}return null}
function setIndent(row,depth){row.style.paddingLeft=`${6+depth*16}px`}
function markInvalid(row,message){row.hidden=false;row.classList.add('invalid-owner');row.title=message;row.dataset.ownerStatus='invalid';row.style.paddingLeft='22px'}
function clearInvalid(row){row.classList.remove('invalid-owner');row.removeAttribute('title');row.dataset.ownerStatus='valid'}

function placeRowsForOwner(tree,p,ownerId,rows){
  const owner=ownerRow(tree,ownerId);
  if(!owner){for(const row of rows){row.hidden=true;row.dataset.ownerStatus='owner-not-visible'}return}
  const ownerDepth=depthOf(p,ownerId),boundary=nextOwnerBoundary(owner,ownerDepth),hidden=hiddenByCollapse(p,ownerId);
  for(const row of rows){clearInvalid(row);row.hidden=hidden;setIndent(row,ownerDepth+1);row.dataset.ownerId=ownerId;if(boundary)tree.insertBefore(row,boundary);else tree.append(row)}
}

export function organizeOwnedTreeContent(){
  if(working)return;const p=project(),tree=$('tree'),modelTab=$('modelTab');if(!p||!tree||!modelTab?.classList.contains('active'))return;
  working=true;
  try{
    const relationRows=new Map([...tree.querySelectorAll('.tree-row[data-type="relationship"]')].map(row=>[row.dataset.id,row]));
    const diagramRows=new Map([...tree.querySelectorAll('.tree-row[data-type="diagram"]')].map(row=>[row.dataset.id,row]));
    const grouped=new Map();
    const add=(ownerId,row,kind)=>{if(!ownerId||!byId(p,ownerId)){markInvalid(row,`${kind} has no valid semantic owner. Fix ownerId before treating this record as contained.`);return}const key=ownerId;if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(row)};
    for(const relationship of p.relationships||[]){const row=relationRows.get(relationship.id);if(row)add(relationship.ownerId,row,'Relationship')}
    for(const diagram of p.diagrams||[]){const row=diagramRows.get(diagram.id);if(row)add(diagram.ownerId,row,'Diagram')}
    for(const [ownerId,rows] of grouped){rows.sort((a,b)=>String(a.querySelector('.tree-name')?.textContent||'').localeCompare(String(b.querySelector('.tree-name')?.textContent||'')));placeRowsForOwner(tree,p,ownerId,rows)}
  }finally{working=false}
}

function queue(){if(scheduled||working)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;organizeOwnedTreeContent()})}
function bind(){const tree=$('tree');if(!tree)return false;observer?.disconnect();observer=new MutationObserver(queue);observer.observe(tree,{childList:true,subtree:false});$('modelTab')?.addEventListener('click',queue);$('diagramTab')?.addEventListener('click',queue);window.addEventListener('systems-modeler-ready',queue);queue();return true}
function boot(){if(bind())return;let tries=0;const timer=setInterval(()=>{tries++;if(bind()||tries>100)clearInterval(timer)},50)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

globalThis.SystemsModelerOwnedTree={organize:organizeOwnedTreeContent};

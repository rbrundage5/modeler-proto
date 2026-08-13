const tree=()=>document.getElementById('tree');
const modelTab=()=>document.getElementById('modelTab');
let scheduled=false;

export function applyRelationshipTreePolicy(){
  const host=tree();
  if(!host||!modelTab()?.classList.contains('active'))return;
  for(const row of host.querySelectorAll('.tree-row[data-type="relationship"]')){
    row.hidden=true;
    row.dataset.ownerStatus='semantic-hidden';
    row.classList.remove('invalid-owner');
    row.removeAttribute('title');
  }
}

function queue(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;applyRelationshipTreePolicy()});
}

function boot(){
  const host=tree();
  if(!host)return false;
  new MutationObserver(queue).observe(host,{childList:true,subtree:false});
  modelTab()?.addEventListener('click',queue);
  document.getElementById('xrefTab')?.addEventListener('click',queue);
  queue();
  return true;
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else if(!boot()){let tries=0;const timer=setInterval(()=>{tries++;if(boot()||tries>100)clearInterval(timer)},50)}

globalThis.SystemsModelerRelationshipTreePolicy={apply:applyRelationshipTreePolicy};

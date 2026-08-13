const tree=()=>document.getElementById('tree');
const modelTab=()=>document.getElementById('modelTab');
let queued=false;
export function applyContainmentTreePolicy(){const host=tree();if(!host||!modelTab()?.classList.contains('active'))return;for(const row of host.querySelectorAll('.tree-row[data-type="relationship"]')){row.hidden=true;row.dataset.ownerStatus='semantic-hidden'}}
function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;applyContainmentTreePolicy()})}
function bind(){const host=tree();if(!host)return false;new MutationObserver(queue).observe(host,{childList:true});modelTab()?.addEventListener('click',queue);document.getElementById('xrefTab')?.addEventListener('click',queue);queue();return true}
function boot(){if(bind())return;let tries=0;const timer=setInterval(()=>{tries++;if(bind()||tries>100)clearInterval(timer)},50)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
globalThis.SystemsModelerContainmentPolicy={apply:applyContainmentTreePolicy};

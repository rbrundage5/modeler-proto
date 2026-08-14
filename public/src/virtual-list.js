// Framework-independent virtual-list math for repository/package views.
export function virtualRange({scrollTop=0,viewportHeight=0,rowHeight=28,count=0,overscan=8}={}){const safeRow=Math.max(1,rowHeight),start=Math.max(0,Math.floor(scrollTop/safeRow)-overscan),visible=Math.ceil(viewportHeight/safeRow)+overscan*2,end=Math.min(count,start+visible);return{start,end,offsetTop:start*safeRow,totalHeight:count*safeRow}}
export function virtualSlice(items,options){const range=virtualRange({...options,count:items.length});return{...range,items:items.slice(range.start,range.end)}}

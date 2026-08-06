export const RESIZE_HANDLES=Object.freeze([
  ['nw',0,0,'nwse-resize'],['n',.5,0,'ns-resize'],['ne',1,0,'nesw-resize'],
  ['e',1,.5,'ew-resize'],['se',1,1,'nwse-resize'],['s',.5,1,'ns-resize'],
  ['sw',0,1,'nesw-resize'],['w',0,.5,'ew-resize']
]);

export function resizePresentation(start,handle,dx,dy,{minWidth=80,minHeight=54,maxWidth=2800,maxHeight=2000}={}){
  let left=start.x,top=start.y,right=start.x+start.width,bottom=start.y+start.height;
  if(handle.includes('w'))left=Math.min(right-minWidth,left+dx);
  if(handle.includes('e'))right=Math.max(left+minWidth,right+dx);
  if(handle.includes('n'))top=Math.min(bottom-minHeight,top+dy);
  if(handle.includes('s'))bottom=Math.max(top+minHeight,bottom+dy);
  if(right-left>maxWidth){if(handle.includes('w'))left=right-maxWidth;else right=left+maxWidth}
  if(bottom-top>maxHeight){if(handle.includes('n'))top=bottom-maxHeight;else bottom=top+maxHeight}
  return{x:Math.round(left),y:Math.round(top),width:Math.round(right-left),height:Math.round(bottom-top)};
}

export function presentationMinimum(element,{contentHeight=54,isContextBoundary=false}={}){
  if(isContextBoundary)return{minWidth:520,minHeight:340};
  if(['ProxyPort','FullPort'].includes(element?.kind))return{minWidth:18,minHeight:18};
  if(['PartProperty','ReferenceProperty'].includes(element?.kind))return{minWidth:170,minHeight:Math.max(80,contentHeight)};
  return{minWidth:100,minHeight:Math.max(54,contentHeight)};
}

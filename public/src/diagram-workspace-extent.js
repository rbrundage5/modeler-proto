const DEFAULT_WIDTH=3200;
const DEFAULT_HEIGHT=2200;
const DEFAULT_PADDING=320;
const DEFAULT_GROWTH_STEP=640;

const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const ceilStep=(value,step)=>Math.ceil(value/step)*step;

function pointExtent(point){
  if(!point||typeof point!=='object')return null;
  const x=finite(point.x,NaN),y=finite(point.y,NaN);
  return Number.isFinite(x)&&Number.isFinite(y)?{x,y}:null;
}

export function diagramContentExtent(diagram){
  let right=0,bottom=0;
  for(const node of diagram?.nodes||[]){
    const x=finite(node.x),y=finite(node.y),width=Math.max(0,finite(node.width)),height=Math.max(0,finite(node.height));
    right=Math.max(right,x+width);
    bottom=Math.max(bottom,y+height,finite(node.timelineEndY,y+height));
  }
  for(const edge of diagram?.edges||[]){
    const points=[...(edge.points||[]),edge.lostAnchor,edge.foundAnchor,edge.labelPosition].map(pointExtent).filter(Boolean);
    for(const point of points){right=Math.max(right,point.x);bottom=Math.max(bottom,point.y)}
  }
  return{right,bottom};
}

export function diagramWorkspaceExtent(diagram,{minimumWidth=DEFAULT_WIDTH,minimumHeight=DEFAULT_HEIGHT,padding=DEFAULT_PADDING,growthStep=DEFAULT_GROWTH_STEP}={}){
  const content=diagramContentExtent(diagram),requestedWidth=Math.max(minimumWidth,finite(diagram?.canvasWidth),content.right+padding),requestedHeight=Math.max(minimumHeight,finite(diagram?.canvasHeight),content.bottom+padding);
  return{
    width:ceilStep(requestedWidth,growthStep),
    height:ceilStep(requestedHeight,growthStep),
    contentRight:content.right,
    contentBottom:content.bottom,
    padding,
  };
}

export const DIAGRAM_WORKSPACE_DEFAULTS=Object.freeze({minimumWidth:DEFAULT_WIDTH,minimumHeight:DEFAULT_HEIGHT,padding:DEFAULT_PADDING,growthStep:DEFAULT_GROWTH_STEP});

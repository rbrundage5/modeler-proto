export function centerOf(node){return{x:node.x+node.width/2,y:node.y+node.height/2}}

export function boundaryPoint(node,toward){
  const c=centerOf(node),dx=toward.x-c.x,dy=toward.y-c.y;
  if(!dx&&!dy)return c;
  const hw=Math.max(node.width/2,1),hh=Math.max(node.height/2,1);
  const scale=1/Math.max(Math.abs(dx)/hw,Math.abs(dy)/hh);
  return{x:c.x+dx*scale,y:c.y+dy*scale};
}

export function orthogonalRoute(source,target,index=0,total=1){
  const a=centerOf(source),b=centerOf(target);
  if(source.id===target.id){
    const gap=34+index*14;
    return[
      {x:source.x+source.width+gap,y:a.y},
      {x:source.x+source.width+gap,y:source.y-gap},
      {x:a.x,y:source.y-gap}
    ];
  }
  const offset=(index-(total-1)/2)*14;
  const dx=Math.abs(b.x-a.x),dy=Math.abs(b.y-a.y);
  if(dx>=dy){
    const mx=(a.x+b.x)/2+offset;
    return[{x:mx,y:a.y},{x:mx,y:b.y}];
  }
  const my=(a.y+b.y)/2+offset;
  return[{x:a.x,y:my},{x:b.x,y:my}];
}

function inflated(rect,padding){return{x:rect.x-padding,y:rect.y-padding,width:rect.width+padding*2,height:rect.height+padding*2}}
function segmentCrossesRect(a,b,rect){
  if(a.x===b.x)return a.x>rect.x&&a.x<rect.x+rect.width&&Math.max(a.y,b.y)>rect.y&&Math.min(a.y,b.y)<rect.y+rect.height;
  if(a.y===b.y)return a.y>rect.y&&a.y<rect.y+rect.height&&Math.max(a.x,b.x)>rect.x&&Math.min(a.x,b.x)<rect.x+rect.width;
  return false;
}
function routeIsClear(points,obstacles,padding){for(let index=0;index<points.length-1;index++)for(const obstacle of obstacles)if(segmentCrossesRect(points[index],points[index+1],inflated(obstacle,padding)))return false;return true}
function routeLength(points){let length=0;for(let index=0;index<points.length-1;index++)length+=Math.abs(points[index+1].x-points[index].x)+Math.abs(points[index+1].y-points[index].y);return length}

/** A dependency-free obstacle layer for the existing orthogonal router. */
export function obstacleAwareRoute(source,target,obstacles=[],options={}){
  const {padding=12,index=0,total=1}=options,a=centerOf(source),b=centerOf(target),ignored=new Set([source.id,target.id]),blocks=obstacles.filter(item=>item&&!ignored.has(item.id));
  const base=[a,...orthogonalRoute(source,target,index,total),b],offset=(index-(total-1)/2)*14,candidates=[base];
  for(const obstacle of blocks){const box=inflated(obstacle,padding),xs=[box.x,box.x+box.width],ys=[box.y,box.y+box.height];for(const x of xs)candidates.push([a,{x,y:a.y+offset},{x,y:b.y+offset},b]);for(const y of ys)candidates.push([a,{x:a.x+offset,y},{x:b.x+offset,y},b])}
  const clean=candidates.filter(points=>routeIsClear(points,blocks,padding)).sort((left,right)=>routeLength(left)-routeLength(right))[0];
  return(clean||base).slice(1,-1);
}

export function pathData(points){return points.map((p,i)=>`${i?'L':'M'}${p.x},${p.y}`).join(' ')}

export function nearestSegmentIndex(points,p){
  let best=0,bestDistance=Infinity;
  for(let i=0;i<points.length-1;i++){
    const a=points[i],b=points[i+1],dx=b.x-a.x,dy=b.y-a.y,len2=dx*dx+dy*dy||1;
    const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/len2));
    const x=a.x+t*dx,y=a.y+t*dy,d=Math.hypot(p.x-x,p.y-y);
    if(d<bestDistance){bestDistance=d;best=i}
  }
  return best;
}

export function midpointAlong(points){
  if(points.length<2)return points[0]||{x:0,y:0};
  let total=0;const lengths=[];
  for(let i=0;i<points.length-1;i++){const l=Math.hypot(points[i+1].x-points[i].x,points[i+1].y-points[i].y);lengths.push(l);total+=l}
  let remaining=total/2;
  for(let i=0;i<lengths.length;i++){
    if(remaining<=lengths[i]){const a=points[i],b=points[i+1],t=lengths[i]?remaining/lengths[i]:0;return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}}
    remaining-=lengths[i];
  }
  return points.at(-1);
}

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

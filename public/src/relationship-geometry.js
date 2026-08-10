export function setRelationshipLabel(edge,position){edge.labelPresentation=edge.labelPresentation||{id:`label-${edge.id}`};Object.assign(edge.labelPresentation,position);return edge}
export function resetRelationshipLabel(edge){return setRelationshipLabel(edge,{x:null,y:null,offsetX:0,offsetY:0})}
export function addWaypoint(edge,waypoint){edge.waypoints=edge.waypoints||[];if(edge.waypoints.some(p=>p.id===waypoint.id))return edge;edge.waypoints.push({...waypoint,order:edge.waypoints.length});edge.routingMode='manual';return edge}
export function moveWaypoint(edge,id,point){const waypoint=(edge.waypoints||[]).find(p=>p.id===id);if(!waypoint)throw Error('Waypoint not found.');Object.assign(waypoint,point);return edge}
export function removeWaypoint(edge,id){edge.waypoints=(edge.waypoints||[]).filter(p=>p.id!==id).map((p,i)=>({...p,order:i}));return edge}
export function resetRouting(edge){edge.waypoints=[];edge.points=[];edge.routingMode='auto';edge.autoRouted=true;return edge}

export function isDiagramPanGesture(event,{spacePan=false}={}){return event.button===1||(event.button===0&&(spacePan||event.ctrlKey||event.metaKey))}
export function diagramPanPosition(start,event){return{left:start.left-(event.clientX-start.x),top:start.top-(event.clientY-start.y),moved:Math.hypot(event.clientX-start.x,event.clientY-start.y)>3}}

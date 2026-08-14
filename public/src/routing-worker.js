import {routeDiagramPayload} from './worker-routing-core.js';
import {layoutDiagramPayload} from './worker-layout-core.js';
self.onmessage=event=>{const message=event.data||{};try{let result;if(message.type==='route-diagram')result=routeDiagramPayload(message.payload);else if(message.type==='layout-diagram')result=layoutDiagramPayload(message.payload);else return;self.postMessage({id:message.id,ok:true,result})}catch(error){self.postMessage({id:message.id,ok:false,error:String(error?.message||error)})}};

import {routeDiagramPayload} from './worker-routing-core.js';
self.onmessage=event=>{const message=event.data||{};if(message.type!=='route-diagram')return;try{const result=routeDiagramPayload(message.payload);self.postMessage({id:message.id,ok:true,result})}catch(error){self.postMessage({id:message.id,ok:false,error:String(error?.message||error)})}};

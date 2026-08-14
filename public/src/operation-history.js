const sizeOf=value=>{try{return JSON.stringify(value).length}catch{return Number.POSITIVE_INFINITY}};

export class OperationHistory{
  constructor({limit=2000,maxBytes=8*1024*1024}={}){this.limit=limit;this.maxBytes=maxBytes;this.undoStack=[];this.redoStack=[];this.undoBytes=0;this.redoBytes=0;this.transaction=null}
  entry(operation,inverse,metadata={}){const bytes=sizeOf(operation)+sizeOf(inverse)+sizeOf(metadata);return{operation,inverse,metadata,bytes}}
  record(operation,inverse,metadata={}){const entry=this.entry(operation,inverse,metadata);if(!Number.isFinite(entry.bytes)||entry.bytes>this.maxBytes)return false;if(this.transaction){this.transaction.entries.push(entry);return true}this.pushUndo(entry);this.clearRedo();this.trim();return true}
  begin(metadata={}){if(this.transaction)throw new Error('History transaction already active');this.transaction={metadata,entries:[]}}
  commit(){const tx=this.transaction;if(!tx)return false;this.transaction=null;if(!tx.entries.length)return false;const operation={type:'batch-operation',operations:tx.entries.map(entry=>entry.operation)},inverse={type:'batch-operation',operations:[...tx.entries].reverse().map(entry=>entry.inverse)},entry=this.entry(operation,inverse,tx.metadata);if(entry.bytes>this.maxBytes)return false;this.pushUndo(entry);this.clearRedo();this.trim();return true}
  rollback(){this.transaction=null}
  pushUndo(entry){this.undoStack.push(entry);this.undoBytes+=entry.bytes}
  pushRedo(entry){this.redoStack.push(entry);this.redoBytes+=entry.bytes}
  popUndo(){const entry=this.undoStack.pop();if(entry)this.undoBytes-=entry.bytes;return entry}
  popRedo(){const entry=this.redoStack.pop();if(entry)this.redoBytes-=entry.bytes;return entry}
  clearRedo(){this.redoStack.length=0;this.redoBytes=0}
  trim(){while(this.undoStack.length>this.limit||this.undoBytes>this.maxBytes){const removed=this.undoStack.shift();if(!removed)break;this.undoBytes-=removed.bytes}}
  undo(apply){const entry=this.popUndo();if(!entry)return false;try{apply(entry.inverse);this.pushRedo(entry);return entry}catch(error){this.pushUndo(entry);throw error}}
  redo(apply){const entry=this.popRedo();if(!entry)return false;try{apply(entry.operation);this.pushUndo(entry);this.trim();return entry}catch(error){this.pushRedo(entry);throw error}}
  clear(){this.undoStack.length=0;this.redoStack.length=0;this.undoBytes=0;this.redoBytes=0;this.transaction=null}
  stats(){return{undoEntries:this.undoStack.length,redoEntries:this.redoStack.length,undoBytes:this.undoBytes,redoBytes:this.redoBytes,maxBytes:this.maxBytes,limit:this.limit}}
  get canUndo(){return this.undoStack.length>0}
  get canRedo(){return this.redoStack.length>0}
}

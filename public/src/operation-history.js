// Bounded semantic operation history. This is the replacement foundation for complete-project
// JSON checkpoints; integration into every editor command is intentionally staged in later PRs.
export class OperationHistory{
  constructor({limit=1000}={}){this.limit=limit;this.undoStack=[];this.redoStack=[]}
  record(operation,inverse){this.undoStack.push({operation,inverse});if(this.undoStack.length>this.limit)this.undoStack.shift();this.redoStack.length=0}
  undo(apply){const entry=this.undoStack.pop();if(!entry)return false;apply(entry.inverse);this.redoStack.push(entry);return true}
  redo(apply){const entry=this.redoStack.pop();if(!entry)return false;apply(entry.operation);this.undoStack.push(entry);return true}
  clear(){this.undoStack.length=0;this.redoStack.length=0}
  get canUndo(){return this.undoStack.length>0}
  get canRedo(){return this.redoStack.length>0}
}

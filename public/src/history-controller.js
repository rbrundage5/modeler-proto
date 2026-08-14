import {OperationHistory} from './operation-history.js';
import {reversibleOperation} from './operation-inverse.js';
import {normalizeDirtyProject} from './incremental-normalization.js';
import {applyHistoryOperation} from './history-apply.js';

export class HistoryController{
  constructor(project,{history=new OperationHistory(),normalize=normalizeDirtyProject,onChange=null}={}){this.project=project;this.history=history;this.normalize=normalize;this.onChange=onChange}
  setProject(project,{clear=true}={}){this.project=project;if(clear)this.history.clear();return project}
  apply(operation,{record=true,metadata={}}={}){const reversible=record?reversibleOperation(this.project,operation):null;applyHistoryOperation(this.project,operation);const normalization=this.normalize?.(this.project);if(record&&reversible)this.history.record(reversible.operation,reversible.inverse,metadata);this.onChange?.({type:'apply',operation,recorded:Boolean(reversible),normalization});return this.project}
  undo(){let normalization=null;const entry=this.history.undo(operation=>{applyHistoryOperation(this.project,operation);normalization=this.normalize?.(this.project)});if(entry)this.onChange?.({type:'undo',entry,normalization});return Boolean(entry)}
  redo(){let normalization=null;const entry=this.history.redo(operation=>{applyHistoryOperation(this.project,operation);normalization=this.normalize?.(this.project)});if(entry)this.onChange?.({type:'redo',entry,normalization});return Boolean(entry)}
  begin(metadata={}){this.history.begin(metadata)}
  commit(){return this.history.commit()}
  rollback(){this.history.rollback()}
  stats(){return this.history.stats()}
}

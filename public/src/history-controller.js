import {applyOperation} from './operations.js';
import {OperationHistory} from './operation-history.js';
import {reversibleOperation} from './operation-inverse.js';
import {normalizeIncremental} from './incremental-normalization.js';

export class HistoryController{
  constructor(project,{history=new OperationHistory(),normalize=normalizeIncremental,onChange=null}={}){this.project=project;this.history=history;this.normalize=normalize;this.onChange=onChange}
  setProject(project,{clear=true}={}){this.project=project;if(clear)this.history.clear();return project}
  apply(operation,{record=true,metadata={}}={}){const reversible=record?reversibleOperation(this.project,operation):null;this.project=applyOperation(this.project,operation);this.normalize?.(this.project);if(record&&reversible)this.history.record(reversible.operation,reversible.inverse,metadata);this.onChange?.({type:'apply',operation,recorded:Boolean(reversible)});return this.project}
  undo(){const entry=this.history.undo(operation=>{this.project=applyOperation(this.project,operation);this.normalize?.(this.project)});if(entry)this.onChange?.({type:'undo',entry});return Boolean(entry)}
  redo(){const entry=this.history.redo(operation=>{this.project=applyOperation(this.project,operation);this.normalize?.(this.project)});if(entry)this.onChange?.({type:'redo',entry});return Boolean(entry)}
  begin(metadata={}){this.history.begin(metadata)}
  commit(){return this.history.commit()}
  rollback(){this.history.rollback()}
  stats(){return this.history.stats()}
}

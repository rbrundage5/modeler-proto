import {projectIndex} from './model-index.js';
import {descendantClosure} from './incremental-dependencies.js';

export function refreshQualifiedNamesIncremental(project,rootIds){const index=projectIndex(project),targets=descendantClosure(project,rootIds),memo=new Map();function qn(id){id=String(id);if(memo.has(id))return memo.get(id);const element=index.elements.get(id);if(!element)return'';const parent=element.ownerId?qn(element.ownerId):'';const value=parent?`${parent}::${element.name||element.id}`:(element.name||element.id);memo.set(id,value);return value}for(const id of targets){const element=index.elements.get(id);if(element)element.qualifiedNameString=qn(id)}return targets}

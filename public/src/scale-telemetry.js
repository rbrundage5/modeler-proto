import {modelScale} from './model-scale.js';
export function scaleSnapshot(project,{operation='',durationMs=0,workingSetSize=0}={}){const scale=modelScale(project);return{timestamp:Date.now(),operation,durationMs,workingSetSize,tier:scale.tier,semanticRecords:scale.semantic,elements:scale.elements,relationships:scale.relationships,diagrams:scale.diagrams}}

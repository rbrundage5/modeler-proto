import {indexStats,projectIndex} from './model-index.js';
export const SCALE_TIERS=Object.freeze({standard:10000,large:100000,massive:500000,extreme:1000000});
export function modelScale(project){const stats=indexStats(project),semantic=stats.elements+stats.relationships;const tier=semantic>=SCALE_TIERS.extreme?'extreme':semantic>=SCALE_TIERS.massive?'massive':semantic>=SCALE_TIERS.large?'large':'standard';return{tier,semantic,...stats}}
export function workingSet(project,{ownerId=null,elementId=null}={}){const index=projectIndex(project);return{children:ownerId?(index.children.get(String(ownerId))||[]):[],relationships:elementId?(index.relationshipsByEndpoint.get(String(elementId))||[]):[],presentations:elementId?(index.presentationsByElement.get(String(elementId))||[]):[]}}

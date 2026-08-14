export const PERFORMANCE_BUDGETS=Object.freeze({indexedLookupBatchMs:3000,repositoryDomRows:200,diagramDomPresentations:1500,interactiveTaskMs:50,backgroundChunkMs:16});
export function performanceBudget(name){return PERFORMANCE_BUDGETS[name]}
export function withinBudget(name,value){const budget=performanceBudget(name);return Number.isFinite(budget)&&value<=budget}

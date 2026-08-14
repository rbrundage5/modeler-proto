import {consumeDirtyState} from './dirty-set.js';
import {refreshQualifiedNamesIncremental} from './incremental-qualified-names.js';
import {assertIndexIntegrity} from './index-integrity.js';

// Processes only the changed working set. Full normalizeProject remains the required boundary
// for imports, migrations, external project loads, and recovery where arbitrary state may enter.
export function normalizeDirtyProject(project){
  const dirty=consumeDirtyState(project);
  if(dirty.all)return{mode:'full-required',dirty,qualifiedNameCount:0};
  const qnRoots=[...new Set([...dirty.elements,...dirty.owners])];
  const refreshed=qnRoots.length?refreshQualifiedNamesIncremental(project,qnRoots):new Set();
  assertIndexIntegrity(project);
  return{mode:'incremental',dirty,qualifiedNameCount:refreshed.size};
}

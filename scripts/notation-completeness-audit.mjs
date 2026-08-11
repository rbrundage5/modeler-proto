import fs from 'node:fs';
import {SUPPORTED_TYPE_INVENTORY,SUPPORT_STATES} from '../public/src/supported-type-inventory.js';
import {rendererDescriptor} from '../public/src/renderer-registry.js';
const issues=[];
for(const item of SUPPORTED_TYPE_INVENTORY){
 if(!SUPPORT_STATES.includes(item.supportStatus))issues.push(`${item.canonicalType}: invalid support status`);
 if(item.supportStatus==='complete'){
  for(const key of ['rendererKey','propertySchema','importMapping','serialization','undoRedo'])if(!item[key])issues.push(`${item.canonicalType}: complete type lacks ${key}`);
  if(!item.testCoverage.length)issues.push(`${item.canonicalType}: complete type lacks tests`);
  if(!item.paletteAvailability.length&&!item.creationWorkflow)issues.push(`${item.canonicalType}: complete type lacks palette or deliberate workflow`);
  for(const diagram of item.diagramTypes)if(item.recordKind==='element'&&item.creationWorkflow!=='owned-compartment'&&!rendererDescriptor(item.canonicalType,diagram).supported)issues.push(`${item.canonicalType}: complete type lacks renderer on ${diagram}`);
 }
 if(item.paletteAvailability.length&&!item.icon)issues.push(`${item.canonicalType}: palette tool lacks a deliberate icon`);
}
const app=fs.readFileSync('public/src/app.js','utf8');if(!app.includes('drawDiagnosticPresentation'))issues.push('Application lacks diagnostic renderer for unknown imported types.');
if(issues.length){console.error(`Notation completeness audit failed:\n- ${issues.join('\n- ')}`);process.exit(1)}
console.log(`Notation completeness audit passed: ${SUPPORTED_TYPE_INVENTORY.length} semantic records inventoried; ${SUPPORTED_TYPE_INVENTORY.filter(item=>item.supportStatus==='complete').length} complete, ${SUPPORTED_TYPE_INVENTORY.filter(item=>item.supportStatus==='partial').length} partial.`);

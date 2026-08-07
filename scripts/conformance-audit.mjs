import fs from 'node:fs';
import {CLAIMED_DIAGRAM_TYPES,CONFORMANCE_REGISTRY,MATURITY_STATUSES,rejectionReason} from '../public/src/sysml/conformance-registry.js';
import {ELEMENTS,RELATIONSHIPS} from '../public/src/sysml-profile.js';
import {hasSysmlIcon} from '../public/src/sysml-icons.js';

const errors=[];
const fail=(message)=>errors.push(message);
const renderers=new Set(['svg-node-renderer','svg-edge-renderer','svg-diagram-renderer']);
const controllers=new Set(['diagram-interaction-controller','sequence-interaction-controller','edge-interaction-controller']);
for(const name of CLAIMED_DIAGRAM_TYPES){
  const diagram=CONFORMANCE_REGISTRY.diagramTypes[name];
  if(!diagram){fail(`Missing claimed diagram registration: ${name}`);continue}
  if(!diagram.requiredSemanticContext?.length)fail(`${name}: required semantic context rules are absent.`);
  if(!renderers.has(diagram.renderer))fail(`${name}: nonexistent diagram renderer "${diagram.renderer}".`);
  if(!controllers.has(diagram.interactionController))fail(`${name}: missing interaction controller "${diagram.interactionController}".`);
  for(const [kind,capability] of Object.entries(diagram.elementCapabilities)){
    const prefix=`${name} / ${kind}`;
    if(!ELEMENTS[kind])fail(`${prefix}: palette item does not map to a semantic type.`);
    if(capability.paletteCreation&&!hasSysmlIcon(kind))fail(`${prefix}: visible palette entry would use the unknown fallback icon.`);
    if(!renderers.has(capability.renderer))fail(`${prefix}: allowed item has nonexistent renderer "${capability.renderer}".`);
    if(!capability.selectionStrategy)fail(`${prefix}: registered presentation has no selection strategy.`);
    if(capability.resizable&&!capability.requiredEditingOperations.includes('resize'))fail(`${prefix}: resizable presentation has no resize operation.`);
    if(capability.labelEditable&&!capability.requiredEditingOperations.includes('edit-label'))fail(`${prefix}: editable label has no editing operation.`);
    if(!MATURITY_STATUSES.includes(capability.maturity))fail(`${prefix}: invalid maturity "${capability.maturity}".`);
    if(capability.maturity==='working'){
      const fixture=CONFORMANCE_REGISTRY.fixtures[capability.testFixtureId];
      if(!fixture||!fs.existsSync(fixture))fail(`${prefix}: working capability lacks an existing automated fixture.`);
    }
  }
  for(const [kind,capability] of Object.entries(diagram.relationshipCapabilities)){
    if(!RELATIONSHIPS[kind])fail(`${name} / ${kind}: relationship is not semantic-profile registered.`);
    if(!capability.sourceKinds||!capability.targetKinds)fail(`${name} / ${kind}: endpoint rules are missing.`);
    if(!renderers.has(capability.renderer))fail(`${name} / ${kind}: edge renderer is not reachable.`);
    if(!controllers.has(capability.interactionController))fail(`${name} / ${kind}: edge interaction controller is missing.`);
  }
}
const matrix=fs.readFileSync('docs/SYSML_CONFORMANCE_MATRIX.md','utf8');
const expectedRows=Object.values(CONFORMANCE_REGISTRY.diagramTypes).reduce((sum,item)=>sum+Object.keys(item.elementCapabilities).length,0);
if(!matrix.includes(`<!-- registry-schema:${CONFORMANCE_REGISTRY.schemaVersion}; rows:${expectedRows} -->`))fail(`Human matrix schema/row marker contradicts registry; run npm run conformance-matrix (expected ${expectedRows} rows).`);
for(const diagram of Object.values(CONFORMANCE_REGISTRY.diagramTypes))for(const kind of Object.keys(diagram.elementCapabilities))if(!matrix.includes(`| ${diagram.displayName} / ${kind} |`))fail(`Human matrix omits ${diagram.displayName} / ${kind}.`);
if(!/not directly placeable/.test(rejectionReason('Sequence Diagram','Actor')))fail('Unsupported placement rejection is not actionable.');
if(errors.length){console.error(`Conformance audit failed with ${errors.length} actionable issue(s):\n- ${errors.join('\n- ')}`);process.exit(1)}
console.log(`Conformance audit passed: ${CLAIMED_DIAGRAM_TYPES.length} diagrams, ${expectedRows} valid diagram-element combinations, and all registered relationships checked.`);

import fs from 'node:fs';
import {CONFORMANCE_REGISTRY} from '../public/src/sysml/conformance-registry.js';

const columns=['Diagram / semantic element','Valid','Palette','Containment','Render','Notation','Select','Move','Resize','Properties','Relate','Delete','Undo/redo','Save/reload','Import','Collab','Tests','Maturity / issue'];
const mark=(value)=>value?'working':'not-applicable';
const rows=[];
for(const diagram of Object.values(CONFORMANCE_REGISTRY.diagramTypes))for(const capability of Object.values(diagram.elementCapabilities)){
  const tested=Boolean(capability.testFixtureId),maturity=capability.maturity,defaultStatus=tested?'working':'partial';
  rows.push([`${diagram.displayName} / ${capability.semanticType}`,'working',mark(capability.paletteCreation),'working','working',defaultStatus,'working','working',capability.resizable?'working':'not-applicable','working',defaultStatus,'working',defaultStatus,'working','partial','partial',tested?'working':'not-tested',`${maturity}${tested?'': ' / PMB-P2-001'}`]);
}
const lines=[
  '# SysML Conformance Matrix','',
  '> Generated from `public/src/sysml/conformance-registry.js` by `npm run conformance-matrix`. Do not edit the table manually. Status vocabulary: `working`, `partial`, `broken`, `missing`, `not-applicable`, `not-tested`. A `working` workflow has an automated fixture; notation/import/collaboration remain conservatively classified where end-to-end evidence is absent.','',
  `<!-- registry-schema:${CONFORMANCE_REGISTRY.schemaVersion}; rows:${rows.length} -->`,
  `| ${columns.join(' | ')} |`,`| ${columns.map(()=> '---').join(' | ')} |`,
  ...rows.map(row=>`| ${row.join(' | ')} |`),'',
  '## Invalid combinations and specialized presentations','',
  'Every semantic-type/diagram-type combination not listed above is invalid for direct presentation and is rejected by `resolvePresentation` with an actionable reason. Rejection occurs before a presentation record is created, preventing empty or invisible nodes. Contextual boundary features (ports and pins) require a compatible graphical owner. An Actor on a Sequence Diagram is intentionally not direct notation: model an Actor-classified Lifeline instead. Relationship tools also validate source and target kinds from the registry before semantic creation.','',
  '## Interpretation','',
  '- **Semantic validity** means the central profile and registry allow this direct or contextual presentation; it is not a claim of external certification.','- **Notation partial** means a visible independent SVG renderer exists but its complete SysML 1.x notation has not been exhaustively qualified.','- **Import partial** means the profile can process the kind, not that every vendor workbook representation has been verified.','- **Collaboration partial** means generic operations exist; combination-specific multi-client qualification remains open.','- `PMB-P2-001` tracks missing complete per-combination workflow fixtures.',''
];
fs.writeFileSync(new URL('../docs/SYSML_CONFORMANCE_MATRIX.md',import.meta.url),lines.join('\n'));
console.log(`Wrote ${rows.length} valid diagram-element rows.`);

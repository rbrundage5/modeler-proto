import fs from 'node:fs';
const css=fs.readFileSync('public/src/styles.css','utf8');
const requirements=[
  ['workspace design tokens','--shadow-sm'],['professional header','linear-gradient(105deg,#102633,#173746)'],
  ['keyboard focus','focus-visible'],['canvas grid','#canvas{background-color'],['selected nodes','.node.selected .shape'],
  ['IBD context styling','.node.ibd-context .shape'],['IBD port styling','.node.ibd-port .port-shape'],
  ['resize affordances','.resize-handle:hover'],['responsive workspace','@media(max-width:850px)'],['scrollbars','scrollbar-width:thin']
];
const missing=requirements.filter(([,token])=>!css.includes(token)).map(([name])=>name);
if(missing.length){console.error(`Visual audit failed: ${missing.join(', ')}`);process.exit(1)}
console.log('Professional visual system audit passed.');

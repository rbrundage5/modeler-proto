import fs from 'node:fs';
const html=fs.readFileSync('public/index.html','utf8'),js=fs.readFileSync('public/src/environment.js','utf8');
for(const id of ['projectEnvironment','projectDashboard','environmentDialog','environmentTabs','environmentContent','archiveInput'])if(!html.includes(`id="${id}"`))throw new Error(`Missing environment UI ${id}`);
for(const feature of ['dashboard','requirements','traceability','validation','reports','governance','backup','svgExport','htmlReport','restoreArchive'])if(!js.includes(feature))throw new Error(`Missing environment feature ${feature}`);
console.log('Project environment audit passed.');

import fs from "node:fs";
const html=fs.readFileSync("public/index.html","utf8");
const app=fs.readFileSync("public/src/app.js","utf8")+"\n"+fs.readFileSync("public/src/workbench.js","utf8")+"\n"+fs.readFileSync("public/src/environment.js","utf8")+"\n"+fs.readFileSync("public/src/projects.js","utf8")+"\n"+fs.readFileSync("public/src/advanced.js","utf8");
const ids=[...html.matchAll(/<button[^>]+id="([^"]+)"/g)].map(m=>m[1]);
const ignored=new Set(["projectEnvironment","projectDashboard"]);
const missing=[];
for(const id of ids){if(ignored.has(id))continue;const patterns=[`$('${id}').onclick`,`$('${id}').onchange`,`$('${id}').onkeydown`,`$('${id}').addEventListener`,`document.getElementById('${id}').onclick`,`document.getElementById('${id}').onchange`,`data-target="${id}"`];if(!patterns.some(p=>app.includes(p))&&id!=="help")missing.push(id)}
if(missing.length){console.error("Visible buttons without handlers:",missing.join(", "));process.exit(1)}
const duplicate=ids.filter((id,i)=>ids.indexOf(id)!==i);if(duplicate.length){console.error("Duplicate button IDs:",duplicate.join(", "));process.exit(1)}
console.log(`UI audit passed: ${ids.length} visible command buttons are wired.`);

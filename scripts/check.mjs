import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";
const required=["package.json","package-lock.json","wrangler.jsonc","worker/index.js","public/index.html","public/src/app.js","public/src/model.js","public/src/importer.js","public/src/validator.js","public/src/collaboration.js","public/src/styles.css","public/src/advanced.js","public/src/environment.js","scripts/ui-audit.mjs","scripts/visual-audit.mjs","public/src/sysml-profile.js","public/src/semantic-core.js","public/src/ibd-engine.js","public/src/property-path.js","public/src/interface-compatibility.js","public/src/presentation-layout.js","public/src/operations.js"];
let failed=false;
for(const file of required){if(!fs.existsSync(path.resolve(file))){console.error(`Missing ${file}`);failed=true}}
if(failed)process.exit(1);
const sourceRoots=['public/src','worker','scripts','test'];
const sourceFiles=[];
function collect(directory){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const file=path.join(directory,entry.name);if(entry.isDirectory())collect(file);else if(/\.(?:js|mjs)$/.test(entry.name))sourceFiles.push(file)}}
for(const root of sourceRoots)collect(root);
for(const file of sourceFiles){
  const source=fs.readFileSync(file,'utf8');
  if(/^(?:<<<<<<<|=======|>>>>>>>)/m.test(source)){console.error(`Unresolved merge conflict in ${file}`);failed=true;continue}
  try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'})}catch(error){console.error(`JavaScript syntax check failed for ${file}:\n${error.stderr?.toString()||error.message}`);failed=true}
}
if(failed)process.exit(1);
console.log("Repository structure check passed.");

import fs from "node:fs";
import path from "node:path";
const required=["package.json","wrangler.jsonc","worker/index.js","public/index.html","public/src/app.js","public/src/model.js","public/src/importer.js","public/src/validator.js","public/src/collaboration.js","public/src/styles.css","public/src/advanced.js","public/src/environment.js","scripts/ui-audit.mjs","public/src/sysml-profile.js","public/src/operations.js"];
let failed=false;
for(const file of required){if(!fs.existsSync(path.resolve(file))){console.error(`Missing ${file}`);failed=true}}
if(failed)process.exit(1);
console.log("Repository structure check passed.");

import fs from "node:fs";
const raw=fs.readFileSync("wrangler.jsonc","utf8").replace(/\/\/.*$/gm,"");
const config=JSON.parse(raw);
const failures=[];
if(config.main!=="./worker/index.js")failures.push("main must point to ./worker/index.js");
if(config.assets?.directory!=="./public")failures.push("assets.directory must be ./public");
if(config.assets?.binding!=="ASSETS")failures.push("ASSETS binding is required");
if(!Array.isArray(config.assets?.run_worker_first)||!config.assets.run_worker_first.includes("/api/*"))failures.push("/api/* must run Worker-first");
if(!config.durable_objects?.bindings?.some(x=>x.name==="PROJECT_ROOMS"&&x.class_name==="ProjectRoom"))failures.push("PROJECT_ROOMS binding is missing");
if(config.exports?.ProjectRoom?.storage!=="sqlite")failures.push("ProjectRoom must be declared as SQLite Durable Object");
if(config.migrations)failures.push("Do not combine legacy migrations with declarative exports");
if(failures.length){console.error(failures.join("\n"));process.exit(1)}
console.log("Wrangler configuration audit passed.");

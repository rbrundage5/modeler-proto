import {defineConfig} from '@playwright/test';
import chromium from '@sparticuz/chromium';
import {existsSync} from 'node:fs';
const cachedChromium='/tmp/chromium';
const executablePath=process.env.PLAYWRIGHT_EXECUTABLE_PATH||(existsSync(cachedChromium)?cachedChromium:await chromium.executablePath());
export default defineConfig({testDir:'browser-tests',outputDir:'test-results/browser',fullyParallel:false,retries:0,workers:1,timeout:30000,expect:{timeout:5000},use:{baseURL:'http://127.0.0.1:8787',browserName:'chromium',headless:process.env.PWHEADED!=='1',launchOptions:{executablePath,args:chromium.args.filter(arg=>arg!=='--single-process')},trace:'retain-on-failure',screenshot:'only-on-failure',viewport:{width:1440,height:1000}},webServer:process.env.PLAYWRIGHT_EXTERNAL_SERVER?undefined:{command:'node_modules/.bin/wrangler dev --config wrangler.jsonc --local --port 8787',url:'http://127.0.0.1:8787',reuseExistingServer:false,timeout:120000,stdout:'pipe',stderr:'pipe'},reporter:[['list'],['html',{outputFolder:'test-results/playwright-report',open:'never'}]]});

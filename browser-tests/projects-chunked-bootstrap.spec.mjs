import {test,expect} from './fixtures.mjs';
test('live Projects subsystem boots in chunked IndexedDB mode',async({page})=>{await page.goto('/');await page.waitForFunction(()=>window.SystemsModelerProjectsReady===true);const mode=await page.evaluate(()=>window.SystemsModelerProjects?.storageMode);expect(mode).toBe('chunked-indexeddb')});

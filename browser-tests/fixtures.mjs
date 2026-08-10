import {test as base,expect} from '@playwright/test';
export const test=base.extend({page:async({page},use,testInfo)=>{const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));await use(page);await testInfo.attach('browser-console',{body:Buffer.from(errors.join('\n')||'No console errors.'),contentType:'text/plain'});expect(errors,'unexpected browser console errors').toEqual([])}});
export{expect};

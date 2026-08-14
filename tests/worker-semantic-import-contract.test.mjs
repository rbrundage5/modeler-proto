import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const streaming=fs.readFileSync(new URL('../public/src/import/streaming-import.js',import.meta.url),'utf8');
const worker=fs.readFileSync(new URL('../public/src/import/semantic-import-worker.js',import.meta.url),'utf8');
const appTransform=fs.readFileSync(new URL('../public/src/app-source-transform.js',import.meta.url),'utf8');

test('semantic import and full post-import validation execute in worker',()=>{
  assert.match(streaming,/semanticImportInWorker/);
  assert.doesNotMatch(streaming,/importWorkbook\(/);
  assert.match(worker,/importWorkbook\(/);
  assert.match(worker,/validate\(project\)/);
  assert.match(worker,/type:'complete',project/);
});

test('live workbook handler does not re-run full semantic work after worker success',()=>{
  assert.match(appTransform,/validatedOffThread:true/);
  assert.match(appTransform,/op\?\.validatedOffThread\?\{mode:'worker-validated'/);
  assert.doesNotMatch(appTransform,/await importWorkbookStreaming[^\n]+const issues=validate\(project\)/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {transformAppSource,renderTransformContract} from '../public/src/app-source-transform.js';

test('application canvas draw loop is replaced before execution',()=>{
  const source=fs.readFileSync(new URL('../public/src/app.js',import.meta.url),'utf8');
  const transformed=transformAppSource(source);
  assert.match(transformed,/diagramRenderSet\(d,viewport/);
  assert.match(transformed,/renderedNodes/);
  assert.match(transformed,/renderedEdges/);
  const body=transformed.slice(transformed.indexOf('function renderCanvas(){'),transformed.indexOf('function diagramHeaderLabel'));
  assert.doesNotMatch(body,/visibleNodes=isIBD\(d\)\?visibleIBDNodes\(d\):d\.nodes/);
  assert.doesNotMatch(body,/d\.edges\.filter\(/);
  assert.match(body,/renderSet\.nodes/);
  assert.match(body,/renderSet\.edges/);
});

test('blob-loaded application uses absolute module imports',()=>{
  const sample=`import {x} from './x.js';\nimport './side.js';\nfunction renderCanvas(){for(const n of d.nodes)drawNode(n)}\nfunction diagramHeaderLabel(){}`;
  const transformed=transformAppSource(sample);
  assert.match(transformed,/from '\/src\/x\.js'/);
  assert.match(transformed,/import '\/src\/side\.js'/);
  assert.doesNotMatch(transformed,/from '\.\//);
});

test('massive model render transform declares no offscreen presentation creation',()=>{
  assert.deepEqual(renderTransformContract(),{virtualized:true,createsOffscreenPresentations:false,sourceBoundary:'renderCanvas',renderSet:'diagramRenderSet'});
});

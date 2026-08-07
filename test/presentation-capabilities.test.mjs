import test from 'node:test';
import assert from 'node:assert/strict';
import {diagramInteractionMatrix,presentationCapabilities} from '../public/src/presentation-capabilities.js';
test('Sequence interactions use specialized capabilities',()=>{assert.equal(presentationCapabilities('MessagePresentation').moveMode,'vertical');assert.equal(presentationCapabilities('MessagePresentation').reconnectable,true);assert.equal(presentationCapabilities('LifelinePresentation').timelineResizable,true);assert.equal(presentationCapabilities('DiagramFrameContext').renderable,false)});
test('all nine supported diagram types are represented in the developer audit',()=>{assert.equal(new Set(diagramInteractionMatrix().map(row=>row.diagramType)).size,9);assert.ok(diagramInteractionMatrix().every(row=>row.status==='AUDITED'))});

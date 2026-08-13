import test from 'node:test';
import assert from 'node:assert/strict';
import {preserveStateBehaviors} from '../public/src/import/fidelity-state.js';
test('state entry do exit fields are preserved',()=>{const e={};preserveStateBehaviors(e,{'Entry Behavior':'entry / a()','Do Behavior':'do / b()','Exit Behavior':'exit / c()'});assert.equal(e.entryBehavior,'entry / a()');assert.equal(e.doBehavior,'do / b()');assert.equal(e.exitBehavior,'exit / c()')});

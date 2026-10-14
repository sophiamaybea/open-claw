import { test } from 'node:test';
import assert from 'node:assert/strict';
import { experiment } from '../engine.mjs';

test('deterministic replay', () => assert.deepEqual(experiment(), experiment()));
test('real money always zero', () => assert.equal(experiment().realCapital, 0));
test('both shadow portfolios exist', () => { const r=experiment(); assert.ok(r.shadow.momentum); assert.ok(r.shadow.scalper); });
test('simulated fees are recorded', () => { const r=experiment(); assert.ok(r.fees>=0); });
test('invalid capital and duration rejected', () => { assert.throws(()=>experiment({startingUSD:0})); assert.throws(()=>experiment({ticks:5})); });

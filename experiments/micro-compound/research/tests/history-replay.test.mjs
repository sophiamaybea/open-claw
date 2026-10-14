import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {benchmark} from '../backtest-v03.mjs';

const dataset=JSON.parse(readFileSync(new URL('../fixtures/coinbase-ohlcv-2026-10-14.json',import.meta.url),'utf8'));
let memo;
const result=()=>memo??=benchmark(dataset);
test('six time series contain 2100 archived original OHLCV observations',()=>{
  assert.equal(dataset.series.length,6);
  assert.equal(dataset.series.reduce((n,z)=>n+z.candles.length,0),2100);
  for(const feed of dataset.series){assert.equal(feed.candles.length,350);assert.ok(feed.candles.every((z,i)=>i===0||z.t>feed.candles[i-1].t));}
});
test('real historical replay has 11664 labelled stress configurations',()=>{
  assert.equal(result().meta.stress_replay_count,11664);
  assert.equal(result().by_method.length,6);
  assert.ok(result().meta.not_independent_trials);
});
test('historical no-decision cash benchmark stays exactly zero',()=>{
  const cash=result().by_method.find(z=>z.method==='hold');
  assert.equal(cash.mean_pct,0);
  assert.equal(cash.traded_rate_pct,0);
});
test('the risk gated adaptive system must not invent winning trades',()=>{
  const adaptive=result().by_method.find(z=>z.method==='adaptive');
  assert.equal(adaptive.model_decisions,0);
  assert.equal(adaptive.mean_pct,0);
  assert.ok(adaptive.matured_shadow_labels>0);
});
test('reported stress results reproduce documented saved snapshot',()=>{
  const saved=JSON.parse(readFileSync(new URL('../results/coinbase-historical-v03.json',import.meta.url),'utf8'));
  const computed=result();
  assert.deepEqual(computed.by_method,saved.by_method);
  assert.deepEqual(computed.by_feed,saved.by_feed);
});
test('every venue reports a loss from active taker strategies after costs',()=>{
  const b=result().by_method;
  for(const method of ['momentum','breakout','mean_reversion'])assert.ok(b.find(z=>z.method===method).mean_pct<0);
});

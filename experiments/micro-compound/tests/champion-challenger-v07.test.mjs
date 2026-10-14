import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {researchLoop} from '../research/champion-challenger-v07.mjs';

const root=join(dirname(fileURLToPath(import.meta.url)),'../research/fixtures');
function fixture(){
 const out={};
 for(const s of ['ADA','BTC','DOGE','ETH','LTC','SOL']){
  const x=JSON.parse(readFileSync(join(root,`daily-${s}-USD-2024-2026.json`),'utf8'));
  out[x.product_id]=x;
 }
 return out;
}
const data=fixture();
test('no live orders and zero user funds; shadow challenger labels only after exit',()=>{
 const out=researchLoop(data);
 assert.equal(out.metadata.realMoneyUSD,0);
 assert.equal(out.metadata.initialVirtualUSD,3);
 assert.ok(out.learning.closedShadowLabels>100);
 assert.ok(out.learning.spawned>0);
 assert.ok(out.learning.spawnedCandidates.every(x=>x.why.includes('future')));
});
test('known historical data cannot qualify as unseen validation',()=>{
 const out=researchLoop(data);
 assert.equal(out.learning.spawnedToChampion,0);
 assert.equal(out.learning.changes,0);
 assert.equal(out.results.learning.nav,out.results.fixedRotation.nav);
});
test('deterministic reproducibility',()=>{
 const a=researchLoop(data),b=researchLoop(data);
 assert.deepEqual(a.results,b.results);
 assert.deepEqual(a.learning.championHistory,b.learning.championHistory);
});
test('perturbing future prices cannot rewrite earlier decisions',()=>{
 const a=researchLoop(data),b=structuredClone(data);
 for(const f of Object.values(b))for(const p of f.candles.slice(-8)){
  p.o*=1.17;p.c*=1.17;p.h*=1.17;p.l*=1.17;
 }
 const r=researchLoop(b);
 const d=new Date(data['BTC-USD'].candles.at(-10).t*1000).toISOString().slice(0,10);
 assert.deepEqual(a.learning.championHistory.filter(x=>x.date<d),r.learning.championHistory.filter(x=>x.date<d));
 assert.deepEqual(a.learning.spawnedCandidates.filter(x=>x.date<d),r.learning.spawnedCandidates.filter(x=>x.date<d));
});

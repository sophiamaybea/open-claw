import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newState,advance,publicSummary,PAIRS} from './core.mjs';
function fixture(start,count=230){
 return Object.fromEntries(PAIRS.map((p,j)=>[p,Array.from({length:count},(_,i)=>{
   const px=(100+100*j)*(1+.00065*i+.025*Math.sin(i/11+j));
   const v=240+100*Math.sin(i/9)**2;
   return {t:start+i*60,o:px,h:px*1.003,l:px*.997,c:px*(1+.001*Math.sin(i/3)),v};
 })]));
}
const base=1792000200-1792000200%60;
test('bootstraps context without backdating any simulated orders',()=>{
 const s=newState('2026-10-14T00:00:00Z'),f=fixture(base);
 const x=advance(s,f,base+210*60+1);
 assert.equal(x.bootstrap,true);assert.equal(x.processed,0);
 assert.equal(s.agents.length,8);
 assert.ok(s.agents.every(a=>a.wallet.completed===0&&a.wallet.usd===3));
});
test('next-open processing, state persists, duplicate cycle is idempotent',()=>{
 const s=newState(),f=fixture(base);
 advance(s,f,base+211*60+1);
 const a=advance(s,f,base+230*60+1);
 assert.equal(a.processed,19);
 const b=advance(s,f,base+230*60+1);
 assert.equal(b.processed,0);
 assert.equal(s.portfolios.cash.usd,3);
 assert.equal(s.lastBar,base+229*60);
});
test('changing unseen later candle cannot affect decisions already made',()=>{
 const f=fixture(base),a=newState(),b=newState();
 advance(a,f,base+211*60+1);advance(b,f,base+211*60+1);
 const changed=structuredClone(f);
 for(const x of Object.values(changed))for(const bar of x.slice(-8)){bar.o*=1.3;bar.c*=1.3;bar.h*=1.3;bar.l*=1.3;}
 advance(a,f,base+222*60+1);advance(b,changed,base+222*60+1);
 assert.deepEqual(publicSummary(a).portfolios,publicSummary(b).portfolios);
});
test('cannot promote agent or spend real money without sufficient prospective history',()=>{
 const s=newState(),f=fixture(base);
 advance(s,f,base+211*60+1);advance(s,f,base+230*60+1);
 const out=publicSummary(s);
 assert.equal(out.champion,'CASH');assert.equal(out.promotionCount,0);
 assert.equal(out.mode,'PAPER ONLY — NO MONEY');
});
test('source does not include trading, transfer or signing calls',()=>{
 const code=readFileSync(new URL('./core.mjs',import.meta.url),'utf8')+
   readFileSync(new URL('./runner.mjs',import.meta.url),'utf8');
 for(const forbidden of ['coinbase_orders_create','/orders','wallet.sign','PRIVATE_KEY','sendTransaction','withdrawal','coinbase_transfer','API_SECRET'])
   assert.equal(code.includes(forbidden),false,forbidden+' must not appear');
});

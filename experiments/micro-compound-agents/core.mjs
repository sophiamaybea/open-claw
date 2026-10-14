/**
 * MICRO COMPOUND PAPER AGENTS v1.
 * Standalone, deterministic, dependency-free, zero real-money capabilities.
 * Each completed 5m candle can update eight paper agents and their learning ledgers.
 * The *next* candle open is used to simulate an order decided at prior close.
 * No wallet, account, order endpoint, key, short sale, margin, leverage, or swaps.
 */
export const PAIRS = ['BTC-USD','ETH-USD','SOL-USD'];
export const FIVE_MINUTES = 300;
export const POLICY_SEEDS = [
  {id:'rotation-24',kind:'rotation',lookback:24,holdBars:12,threshold:.011,ma:48},
  {id:'rotation-72',kind:'rotation',lookback:72,holdBars:36,threshold:.018,ma:96},
  {id:'trend-48',kind:'trend',lookback:48,holdBars:18,threshold:.016,ma:96},
  {id:'breakout-24',kind:'breakout',lookback:24,holdBars:12,threshold:.002,ma:48},
  {id:'mean-revert-48',kind:'reversion',lookback:48,holdBars:12,threshold:-1.45,ma:96},
  {id:'flush-reversal',kind:'reversal',lookback:12,holdBars:9,threshold:-.018,ma:48},
  {id:'volume-surge',kind:'volume',lookback:24,holdBars:12,threshold:2,ma:48},
  {id:'low-vol-rotation',kind:'lowvol',lookback:48,holdBars:24,threshold:.009,ma:96}
];
const FEE=.005, SLIP=.001, START_CAPITAL=3, MIN_QUOTE=1;
const round=(v,n=6)=>Number(v.toFixed(n));
function makeWallet(){return {usd:START_CAPITAL,asset:null,qty:0,entrySpend:0,entered:0,peak:START_CAPITAL,drawdown:0,paidFees:0,completed:0,wins:0,avgReward:0,events:[],curve:[],minSizeBlocks:0};}
function makePolicy(seed,born){return {...seed,born,parents:[],wallet:makeWallet(),observations:0,ewma:0};}
export function newState(now=new Date().toISOString()){
 return {schema:1, mode:'PAPER_ONLY',source:'Coinbase Exchange public, unauthenticated 5-minute candles',createdAt:now,updatedAt:now,lastBar:null,runs:0,
  history:Object.fromEntries(PAIRS.map(s=>[s,[]])),
  agents:POLICY_SEEDS.map(p=>makePolicy(p,null)),
  portfolios:{champion:makeWallet(),fixedBaseline:makeWallet(),btcBenchmark:makeWallet(),cash:makeWallet()},
  selected:'CASH',promotions:[],mutations:[],events:[],researchCycles:0,errors:[],lastError:null};
}
function pushEvent(state,event){state.events.push(event);if(state.events.length>90)state.events=state.events.slice(-90);}
function vol(cs,n){const x=cs.slice(-n-1).map(d=>d.c),returns=[];
 for(let i=1;i<x.length;i++)returns.push(Math.log(x[i]/x[i-1]));
 const mean=returns.reduce((a,b)=>a+b,0)/(returns.length||1);
 return Math.sqrt(returns.reduce((a,b)=>a+(b-mean)**2,0)/(returns.length||1));
}
function policySignal(p,h){
 const n=p.lookback, ranked=[];
 for(const sym of PAIRS){
   const cs=h[sym];if(cs.length<Math.max(n,p.ma)+1)continue;
   const now=cs.at(-1),before=cs.at(-1-n),momentum=now.c/before.c-1;
   const ma=cs.slice(-p.ma).reduce((a,b)=>a+b.c,0)/p.ma;
   const v=vol(cs,Math.min(n,24));
   const avgV=cs.slice(-n-1,-1).reduce((a,b)=>a+b.v,0)/n;
   const vRatio=avgV>0?now.v/avgV:0;
   const high=Math.max(...cs.slice(-n-1,-1).map(z=>z.h));
   const lag=cs.at(-2).c,dayChange=now.c/lag-1;
   let signal=false, score=-Infinity;
   if(p.kind==='rotation'||p.kind==='trend'){signal=momentum>p.threshold&&now.c>ma;score=momentum;}
   else if(p.kind==='lowvol'){signal=momentum>p.threshold&&now.c>ma&&v<.012;score=momentum-v;}
   else if(p.kind==='breakout'){signal=now.c>high*(1+p.threshold)&&vRatio>1;score=now.c/high-1;}
   else if(p.kind==='reversion'){const recent=cs.slice(-n).map(d=>d.c),avg=recent.reduce((a,b)=>a+b,0)/recent.length,
     sd=Math.sqrt(recent.reduce((a,x)=>a+(x-avg)**2,0)/recent.length);
     const z=(now.c-avg)/(sd||1);signal=z<p.threshold&&now.c>ma*.94;score=-z;}
   else if(p.kind==='reversal'){signal=momentum<p.threshold&&dayChange>0&&vRatio>1.05;score=-momentum;}
   else if(p.kind==='volume'){signal=vRatio>p.threshold&&momentum>.004&&now.c>ma;score=vRatio;}
   if(signal)ranked.push({sym,score});
 }
 ranked.sort((a,b)=>b.score-a.score||a.sym.localeCompare(b.sym));
 return ranked[0]?.sym??null;
}
function portfolioMark(w,bar,ts){
 const px=w.asset?bar[w.asset].c:null;
 const value=w.asset?w.usd+w.qty*px*(1-FEE)*(1-SLIP):w.usd;
 w.peak=Math.max(w.peak,value);w.drawdown=Math.max(w.drawdown,1-value/w.peak);
 if(w.curve.length===0||ts-w.curve.at(-1).t>=3600){w.curve.push({t:ts,value:round(value)});if(w.curve.length>900)w.curve=w.curve.slice(-900);}
 return value;
}
function simulateOrder(w,desired,bar,ts,holdBars,ledger){
 const elapsed=w.asset?(ts-w.entered)/FIVE_MINUTES:Infinity;
 if(w.asset && desired!==w.asset && elapsed<holdBars)desired=w.asset;
 if(w.asset && desired!==w.asset){
  const gross=w.qty*bar[w.asset].o;
  if(gross<MIN_QUOTE){w.minSizeBlocks++;desired=w.asset;}
  else{
    const net=gross*(1-SLIP)*(1-FEE);
    const reward=net/w.entrySpend-1;
    w.usd+=net;w.paidFees+=gross*FEE;w.completed++;w.wins+=Number(reward>0);
    w.avgReward=(w.avgReward*(w.completed-1)+reward)/w.completed;
    const ev={at:ts,asset:w.asset,entered:w.entered,netUsd:round(net-w.entrySpend),returnPct:round(reward*100,3)};
    w.events.push(ev);if(w.events.length>150)w.events=w.events.slice(-150);
    ledger?.push(ev);
    w.asset=null;w.qty=0;w.entrySpend=0;w.entered=0;
  }
 }
 if(!w.asset && desired){
   const price=bar[desired].o, usd=w.usd;
   if(usd>=MIN_QUOTE&&price>0){
     w.qty=usd*(1-FEE)/(price*(1+SLIP));w.paidFees+=usd*FEE;
     w.asset=desired;w.entrySpend=usd;w.usd=0;w.entered=ts;
   }else w.minSizeBlocks++;
 }
 return portfolioMark(w,bar,ts);
}
function recentRet(w,bars=72){
 const c=w.curve;if(c.length<bars+1)return null;
 const older=c.at(-bars-1).value,newer=c.at(-1).value;
 return older>0?(newer/older-1):null;
}
function evaluate(state,ts){
 state.researchCycles++;
 const contenders=state.agents.filter(a=>a.born!==null && ts-a.born>=21*86400 && a.wallet.completed>=10);
 // The two comparisons are forward paper portfolio evidence. Do not treat historically explored data as blind proof.
 const eligible=contenders.filter(a=>{
   const r=recentRet(a.wallet,336),c=recentRet(state.portfolios.cash,336)??0, btc=recentRet(state.portfolios.btcBenchmark,336)??0;
   if(r===null || a.wallet.drawdown>.15 || !(r>Math.max(c,btc)+.04))return false;
   // Extra friction stress; at least 10 paper exits that survived doubled spread/fees is required.
   return a.wallet.events.slice(-10).reduce((sum,e)=>sum+(e.returnPct/100-.012),0)>0;
 });
 eligible.sort((a,b)=>recentRet(b.wallet,336)-recentRet(a.wallet,336));
 if(state.selected==='CASH' && eligible.length){
   state.selected=eligible[0].id;state.promotions.push({at:ts,to:state.selected,reason:'>=21d fresh paper evidence, 10 exits, excess to cash/BTC, adverse fee stress'});
   pushEvent(state,{at:ts,type:'research',text:'Promoted paper champion '+state.selected+'; NO live order permission.'});
 }
 if(state.agents.length>=24)return;
 const leader=contenders.filter(a=>a.wallet.events.length>=4&&a.wallet.avgReward>0&&a.wallet.drawdown<.18)
   .sort((a,b)=>b.wallet.avgReward-a.wallet.avgReward)[0];
 if(!leader)return;
 const mutationId=state.mutations.length+1;
 const delta=mutationId%2===0?1:-1;
 const tweak={...leader,
    id:leader.id+'-child-'+mutationId,
    lookback:Math.max(8,Math.min(144,leader.lookback+delta*12)),
    threshold:leader.threshold*(1+delta*.18),
    holdBars:Math.max(6,Math.min(144,leader.holdBars+delta*6))};
 if(state.agents.some(a=>a.lookback===tweak.lookback&&a.kind===tweak.kind&&a.holdBars===tweak.holdBars&&a.threshold===tweak.threshold))return;
 const child=makePolicy(tweak,ts+FIVE_MINUTES);child.parents=[leader.id];
 state.agents.push(child);state.mutations.push({at:ts,parent:leader.id,child:child.id});
 pushEvent(state,{at:ts,type:'research',text:'Spawned '+child.id+' for FORWARD-ONLY paper testing.'});
}
function processBar(state,bar,ts) {
 const histories=state.history;
 const intent=Object.fromEntries(state.agents.filter(a=>a.born!==null && a.born<=ts).map(a=>[a.id,policySignal(a,histories)]));
 const fixed=policySignal(POLICY_SEEDS[1],histories);
 const champ=state.selected==='CASH'?null:intent[state.selected]??null;
 // Mark on next candle open; choice uses ONLY previous completed bars.
 simulateOrder(state.portfolios.champion,champ,bar,ts,24);
 simulateOrder(state.portfolios.fixedBaseline,fixed,bar,ts,POLICY_SEEDS[1].holdBars);
 simulateOrder(state.portfolios.btcBenchmark,'BTC-USD',bar,ts,1e8);
 simulateOrder(state.portfolios.cash,null,bar,ts,0);
 for(const a of state.agents){
   if(a.born===null||a.born>ts)continue;
   const before=a.wallet.completed;
   const newlyClosed=[];
   simulateOrder(a.wallet,intent[a.id]??null,bar,ts,a.holdBars,newlyClosed);
   if(a.wallet.completed>before){
     // Delayed-outcome online learner: update only when an entire trade CLOSES.
     for(const e of newlyClosed){a.observations++;a.ewma=a.ewma*.85+.15*(e.returnPct/100);}
   }
 }
 for(const sym of PAIRS){
   histories[sym].push(bar[sym]);
   if(histories[sym].length>420)histories[sym]=histories[sym].slice(-420);
 }
 state.lastBar=ts;
 if((state.runs+Math.floor(ts/FIVE_MINUTES))%288===0)evaluate(state,ts);
}
export function advance(state,feed,now=Date.now()/1000){
 const cutoff=Math.floor(now/FIVE_MINUTES)*FIVE_MINUTES;
 const clean={};
 for(const sym of PAIRS){
   const rows=feed[sym];if(!Array.isArray(rows))throw Error('Missing public market '+sym);
   clean[sym]=rows.map(z=>({t:+z.t,o:+z.o,h:+z.h,l:+z.l,c:+z.c,v:+z.v}))
     .filter(z=>Number.isInteger(z.t)&&z.t%FIVE_MINUTES===0 && z.t<cutoff && [z.o,z.h,z.l,z.c,z.v].every(Number.isFinite)
       && z.o>0&&z.c>0&&z.l>0&&z.h>=z.l&&z.v>=0)
     .sort((a,b)=>a.t-b.t);
 }
 const times=clean[PAIRS[0]].map(x=>x.t).filter(t=>PAIRS.every(s=>clean[s].some(y=>y.t===t)));
 const byTime=Object.fromEntries(PAIRS.map(s=>[s,new Map(clean[s].map(r=>[r.t,r]))]));
 if(state.lastBar===null){
   const boot=times.slice(-210);
   if(boot.length<110)throw Error('Too few valid common bars to bootstrap');
   for(const sym of PAIRS)state.history[sym]=boot.map(t=>byTime[sym].get(t));
   state.lastBar=boot.at(-1);
   for(const a of state.agents)a.born=state.lastBar+FIVE_MINUTES;
   state.updatedAt=new Date().toISOString();state.runs++;
   pushEvent(state,{at:state.lastBar,type:'bootstrap',text:'Loaded '+boot.length+' historical candles for signal context; NO retroactive paper trades.'});
   return {bootstrap:true,processed:0,lastBar:state.lastBar};
 }
 const fresh=times.filter(t=>t>state.lastBar).sort((a,b)=>a-b);
 let processed=0;
 for(const t of fresh){
   if(t-state.lastBar>FIVE_MINUTES) {
     const err='Market data gap ('+((t-state.lastBar)/60)+' minutes). Paused trading and cleared stale histories.';
     state.lastError=err;
     pushEvent(state,{at:t,type:'warning',text:err});
     for(const sym of PAIRS)state.history[sym]=clean[sym].filter(z=>z.t<=t).slice(-210);
     state.lastBar=t;continue;
   }
   processBar(state,Object.fromEntries(PAIRS.map(s=>[s,byTime[s].get(t)])),t);processed++;
 }
 state.runs++;state.updatedAt=new Date().toISOString();
 return {bootstrap:false,processed,lastBar:state.lastBar};
}
export function publicSummary(s){
 const render=w=>{const px=w.asset?s.history[w.asset].at(-1)?.c:undefined;
   const total=w.asset?w.usd+w.qty*px*(1-FEE)*(1-SLIP):w.usd;
   return {nav:round(total),roi_pct:round((total/START_CAPITAL-1)*100,3),trades:w.completed,wins:w.wins,fees_usd:round(w.paidFees),drawdown_pct:round(w.drawdown*100,2),holding:w.asset??'USD',history:w.curve.slice(-144)};};
 const agents=s.agents.map(a=>({id:a.id,kind:a.kind,lookback:a.lookback,threshold:a.threshold,holdBars:a.holdBars,parent:a.parents[0]||null,
   born:a.born,observations:a.observations,online_reward:round(a.ewma),...render(a.wallet)}))
   .sort((a,b)=>b.roi_pct-a.roi_pct);
 return {updatedAt:s.updatedAt,lastBar:s.lastBar,mode:'PAPER ONLY — NO MONEY',origin:s.source,currencies:PAIRS,
   polls:s.runs,researchCycles:s.researchCycles,champion:s.selected,mutationCount:s.mutations.length,promotionCount:s.promotions.length,
   portfolios:{champion:render(s.portfolios.champion),fixedBaseline:render(s.portfolios.fixedBaseline),
     btc:render(s.portfolios.btcBenchmark),cash:render(s.portfolios.cash)},
   agents,events:s.events.slice(-30),warnings:s.lastError,security:'No account authentication, private keys, live exchange transactions or wallet connection.'};
}

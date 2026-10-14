/* CLOUDFARE WORKERS: FULLY SELF-CONTAINED ONE-FILE DEPLOY VERSION.
 * Generated from core.mjs + cloudflare/worker.mjs, no imports, copy into Cloudflare Edit code.
 * Binds Cloudflare D1 database using the EXACT variable name DB; database migration required.
 * NO real trading/orders/payments; paper-only, public-data access only.
 * Source: https://github.com/sophiamaybea/open-claw/tree/main/experiments/micro-compound-agents/cloudflare
 */
/**
 * MICRO COMPOUND PAPER AGENTS v1.
 * Standalone, deterministic, dependency-free, zero real-money capabilities.
 * Each completed 1m candle can update eight paper agents and their learning ledgers.
 * The *next* candle open is used to simulate an order decided at prior close.
 * No wallet, account, order endpoint, key, short sale, margin, leverage, or swaps.
 */
const PAIRS = ['BTC-USD','ETH-USD','SOL-USD'];
const ONE_MINUTE = 60;
const POLICY_SEEDS = [
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
function newState(now=new Date().toISOString()){
 return {schema:2, mode:'PAPER_ONLY',source:'Coinbase Exchange public, unauthenticated 1-minute candles',createdAt:now,updatedAt:now,lastBar:null,runs:0,
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
 const elapsed=w.asset?(ts-w.entered)/ONE_MINUTE:Infinity;
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
 const contenders=state.agents.filter(a=>a.born!==null && ts-a.born>=30*86400 && a.wallet.completed>=15);
 // Require TWO non-overlapping forward paper periods, strictly after candidate birth.
 // Do not reward an attractive one-off retrospective result or profitable paper HOLD.
 function windowReturn(w,from,to){
   const rows=w.curve.filter(z=>z.t>=from&&z.t<=to);
   if(rows.length<220)return null; // 14 days of approximately hourly readings
   const start=rows[0].value,end=rows.at(-1).value;
   return start>0?end/start-1:null;
 }
 const windowA=[ts-28*86400,ts-14*86400], windowB=[ts-14*86400,ts];
 const eligible=contenders.filter(a=>{
   if(a.wallet.drawdown>.15 || a.born>windowA[0])return false;
   for(const [from,to] of [windowA,windowB]){
     const p=windowReturn(a.wallet,from,to);
     const cash=windowReturn(state.portfolios.cash,from,to)??0;
     const btc=windowReturn(state.portfolios.btcBenchmark,from,to)??0;
     if(p===null || p<=Math.max(cash,btc)+.015)return false;
   }
   // 15 actual closed simulated exits must still produce positive net reward
   // after an EXTRA 1.2% stress charge per round trip.
   return a.wallet.events.slice(-15).reduce((sum,e)=>sum+(e.returnPct/100-.012),0)>0;
 });
 eligible.sort((a,b)=>recentRet(b.wallet,336)-recentRet(a.wallet,336));
 if(state.selected==='CASH' && eligible.length){
   state.selected=eligible[0].id;state.promotions.push({at:ts,to:state.selected,reason:'>=30d new paper, 15 exits, positive 14d+14d vs cash/BTC after fee stress'});
   pushEvent(state,{at:ts,type:'research',text:'Promoted paper champion '+state.selected+'; NO live order permission.'});
 }
 if(state.agents.length>=24)return;
 const learners=state.agents.filter(a=>a.born!==null && ts-a.born>=5*86400 && a.wallet.completed>=4);
 const leader=learners.filter(a=>a.wallet.events.length>=4&&a.wallet.avgReward>0&&a.wallet.drawdown<.18)
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
 const child=makePolicy(tweak,ts+ONE_MINUTE);child.parents=[leader.id];
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
 if(Math.floor(ts/ONE_MINUTE)%288===0)evaluate(state,ts);
}
function advance(state,feed,now=Date.now()/1000){
 const cutoff=Math.floor(now/ONE_MINUTE)*ONE_MINUTE;
 const clean={};
 for(const sym of PAIRS){
   const rows=feed[sym];if(!Array.isArray(rows))throw Error('Missing public market '+sym);
   clean[sym]=rows.map(z=>({t:+z.t,o:+z.o,h:+z.h,l:+z.l,c:+z.c,v:+z.v}))
     .filter(z=>Number.isInteger(z.t)&&z.t%ONE_MINUTE===0 && z.t<cutoff && [z.o,z.h,z.l,z.c,z.v].every(Number.isFinite)
       && z.o>0&&z.c>0&&z.l>0&&z.h>=z.l&&z.v>=0)
     .sort((a,b)=>a.t-b.t);
 }
 const times=clean[PAIRS[0]].map(x=>x.t).filter(t=>PAIRS.every(s=>clean[s].some(y=>y.t===t)));
 const byTime=Object.fromEntries(PAIRS.map(s=>[s,new Map(clean[s].map(r=>[r.t,r]))]));
 if(state.schema!==2)throw Error('Unsupported agent state version; refuse cross-granularity replay');
 if(state.lastBar===null){
   const boot=times.slice(-210);
   if(boot.length<110)throw Error('Too few valid common bars to bootstrap');
   for(const sym of PAIRS)state.history[sym]=boot.map(t=>byTime[sym].get(t));
   state.lastBar=boot.at(-1);
   for(const a of state.agents)a.born=state.lastBar+ONE_MINUTE;
   state.updatedAt=new Date().toISOString();state.runs++;
   pushEvent(state,{at:state.lastBar,type:'bootstrap',text:'Loaded '+boot.length+' historical candles for signal context; NO retroactive paper trades.'});
   return {bootstrap:true,processed:0,lastBar:state.lastBar};
 }
 const fresh=times.filter(t=>t>state.lastBar).sort((a,b)=>a-b);
 let processed=0;
 for(const t of fresh){
   if(t-state.lastBar>ONE_MINUTE) {
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
function publicSummary(s){
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


/* Cloudflare migration: minute-by-minute research, D1 persistence, public read-only dashboard.
 * NO wallet/account credentials, real exchange orders, payments or funded trading.
 * Uses existing deterministic paper engine; persistent state never backfills imaginary fills.
 */
const HEADERS={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'*','X-Content-Type-Options':'nosniff'};
const htmlHeaders={'Content-Type':'text/html; charset=utf-8','Cache-Control':'public, max-age=60','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'none'; base-uri 'none'; frame-ancestors 'none'"};
const item=(v)=>JSON.stringify(v);
function json(v,code=200){return new Response(item(v),{status:code,headers:HEADERS});}
function stamp(){return new Date().toISOString();}
async function info(DB,key){return DB.prepare('SELECT value, version FROM agent_documents WHERE name=?').bind(key).first();}
async function commit(DB,key,data,version=null){
 const payload=item(data);
 if(payload.length>1850000)throw Error('State too large for D1 row; fail closed and archive old history');
 if(version===null){
  const result=await DB.prepare('INSERT OR IGNORE INTO agent_documents(name, value,version,updated_at) VALUES (?, ?, 1, ?)').bind(key,payload,stamp()).run();
  return Number(result.meta?.changes||0)===1;
 }
 const r=await DB.prepare('UPDATE agent_documents SET value=?,version=version+1,updated_at=? WHERE name=? AND version=?')
    .bind(payload,stamp(),key,version).run();
 return Number(r.meta?.changes||0)===1;
}
async function candles(symbol,cutoff){
 const end=cutoff, start=end-294*ONE_MINUTE;
 const url='https://api.exchange.coinbase.com/products/'+encodeURIComponent(symbol)
 +'/candles?granularity=60&start='+encodeURIComponent(new Date(start*1000).toISOString())
 +'&end='+encodeURIComponent(new Date(end*1000).toISOString());
 const resp=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(18000)});
 if(!resp.ok)throw Error('Coinbase public OHLCV '+symbol+': HTTP '+resp.status);
 const data=await resp.json();
 if(!Array.isArray(data))throw Error('Unexpected public OHLCV format: '+symbol);
 return data.map(x=>({t:Number(x[0]),l:Number(x[1]),h:Number(x[2]),o:Number(x[3]),c:Number(x[4]),v:Number(x[5])}))
   .filter(x=>Number.isInteger(x.t)&&x.t<end);
}
async function cyclePaper(DB,nowSecs){
 const cutoff=Math.floor(nowSecs/ONE_MINUTE)*ONE_MINUTE;
 // Read-only sources. All prices may fail to load. Missing data never creates paper fills.
 const feeds=await Promise.all(PAIRS.map(s=>candles(s,cutoff)));
 const existing=await info(DB,'paper');
 const state=existing?JSON.parse(existing.value):newState();
 const advanced=advance(state,Object.fromEntries(PAIRS.map((s,i)=>[s,feeds[i]])),nowSecs);
 const view=publicSummary(state);
 view.health={status:advanced.bootstrap?'BOOTSTRAPPED':'PAPER_RUNNING',...advanced,engine:'CLOUDFLARE_D1_CRON'};
 view.lastRunAt=stamp();
 const saved=await commit(DB,'paper',state,existing?Number(existing.version):null);
 if(!saved)throw Error('Concurrent scheduler changed state; discarded duplicate snapshot');
 await commitOrUpdate(DB,'summary',view);
 return {status:view.health.status,processed:advanced.processed,agents:state.agents.length,completedLabels:state.agents.reduce((s,a)=>s+a.observations,0),lastBar:advanced.lastBar};
}
async function commitOrUpdate(DB,key,value){
 const row=await info(DB,key);
 if(!(await commit(DB,key,value,row?Number(row.version):null)))throw Error('Concurrent document revision for '+key);
}
function rankBounty(i){
 const labels=(i.labels||[]).map(z=>String(typeof z==='string'?z:z.name||'').toLowerCase());
 const name=String(i.title||'').slice(0,180),body=String(i.body||'').slice(0,1200);
 const money=(name+' '+body).match(/(?:US\$|\$|USD\s*)([1-9]\d{0,5}(?:,\d{3})*(?:\.\d{1,2})?)/i);
 const payout=money?Number(money[1].replaceAll(',','')):null;
 const txt=(name+' '+body+' '+labels.join(' ')).toLowerCase();
 const risky=/registration fee|deposit first|seed phrase|private key|pay to apply/.test(txt);
 const aggreg=/bounty[- ]?radar|bounty alert|bounty[- ]?scout|external[- ]?mirror|aggregator/.test(txt);
 const proposed=/bounty proposal|proposed bounty|reward proposed/.test(txt);
 const valid=!!i.html_url&&String(i.html_url).startsWith('https://github.com/')&&!i.pull_request;
 let score=30+(labels.some(x=>x.includes('bounty'))?14:0)+(payout&&payout<10000?Math.min(22,Math.log2(payout+1)*2):0);
 if(risky)score-=100;if(aggreg)score-=40;if(proposed)score-=30;if(payout&&payout>20000)score-=35;
 return {id:i.id,title:name,url:i.html_url,repository:String(i.repository_url||'').replace('https://api.github.com/repos/',''),
    updated:i.updated_at,payoutMentionUSD:payout,score:Math.round(score),status:risky?'REJECT SCAM INDICATORS':aggreg?'AGGREGATOR — FIND ORIGINAL':proposed?'PROPOSAL — NOT CONFIRMED':'UNVERIFIED PAYOUT',valid};
}
async function cycleBounties(DB){
 const queries=['is:issue is:open label:bounty','is:issue is:open bounty in:title'];
 const found=await Promise.allSettled(queries.map(async q=>{
  const r=await fetch('https://api.github.com/search/issues?per_page=60&sort=updated&q='+encodeURIComponent(q),
       {headers:{Accept:'application/vnd.github+json','User-Agent':'MicroCompound-Research-PaperOnly'},signal:AbortSignal.timeout(18000)});
  if(!r.ok)throw Error('GitHub issue search HTTP '+r.status);
  return (await r.json()).items||[];
 }));
 const items=found.filter(r=>r.status==='fulfilled').flatMap(r=>r.value);
 if(!items.length)throw Error('No public GitHub search results; preserving previous lead snapshot');
 const seen=new Set();
 const ranked=items.map(rankBounty).filter(x=>{
  if(!x.valid||seen.has(x.id))return false;seen.add(x.id);return x.score>=20;
 }).sort((a,b)=>b.score-a.score).slice(0,45).map(({valid,...entry})=>entry);
 const report={updatedAt:stamp(),count:ranked.length,kind:'RESEARCH_ONLY',disclaimer:'UNVERIFIED third-party rewards. Verify funding, assignment and eligibility; never pay or disclose keys.',leads:ranked,
    errors:found.filter(r=>r.status==='rejected').map(r=>String(r.reason).slice(0,160))};
 await commitOrUpdate(DB,'bounties',report);
 return {status:'SCANNED',count:ranked.length,partial:report.errors.length>0};
}
function page(){
return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>OpenClaw | Paper Agents</title><style>
:root{color-scheme:dark}body{margin:0;background:#0c1421;color:#eff3f2;font:15px/1.55 -apple-system,Segoe UI,sans-serif}
main{max-width:1080px;margin:auto;padding:25px 18px 60px}small{color:#8fe8c4;letter-spacing:2px;font-weight:700}
h1{font:normal clamp(36px,7vw,62px) Georgia,serif;margin:10px 0}h2{font:normal 24px Georgia,serif}p{color:#9eafbf}
.card{background:#162537;border:1px solid #30475d;padding:16px;border-radius:12px;margin:12px 0}
.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}strong.num{font-size:30px}
a{color:#83eaca}table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:10px 4px;border-bottom:1px solid #304050;text-align:left}
.info{padding:12px;border:1px solid #355c56;background:#142e2b;border-radius:9px;color:#a6e3c9}
footer{font-size:12px;color:#8ea3b5;padding:15px 0}@media(max-width:700px){.grid{grid-template-columns:1fr}}
</style></head><body><main><small>OPENCLAW / RESEARCH INFRASTRUCTURE</small><h1>The Agent Laboratory</h1>
<p>Cloudflare-hosted, minute-scheduled, <b>paper-only</b> market research and bounty discovery. Real money never enabled.</p>
<div class="info" id="health">Waiting for the first scheduled observation and D1 initialization…</div>
<section class="grid"><div class="card"><small>VIRTUAL CHAMPION</small><p><strong class="num" id="nav">$3.00</strong></p><span id="champ">CASH</span></div>
<div class="card"><small>AGENT LABELS</small><p><strong class="num" id="labels">0</strong></p><span>Closed hypothetical trades</span></div>
<div class="card"><small>BOUNTY CANDIDATES</small><p><strong class="num" id="bounties">0</strong></p><span>Not verified as payable</span></div></section>
<section class="card"><h2>Paper strategies</h2><table><thead><tr><th>Strategy</th><th>Virtual balance</th><th>Return</th><th>Completed trades</th></tr></thead><tbody id="rows"><tr><td colspan="4">Awaiting research</td></tr></tbody></table></section>
<section class="card"><h2>Bounty leads</h2><div id="leads">Awaiting public issue research</div></section>
<footer>Research only. Minute triggers are best effort and can be delayed. Candle prices are not executable quotes. All rewards are unverified. No real orders or payments.</footer>
</main><script>
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
async function load(){
 try{
 const [r,b]=await Promise.all([fetch('/api/status',{cache:'no-store'}),fetch('/api/bounties',{cache:'no-store'})]);
 if(!r.ok)throw Error('Paper state unavailable: '+r.status);
 const d=await r.json();const c=d.portfolios?.champion||{};document.getElementById('nav').textContent='$'+Number(c.nav??3).toFixed(2);
 document.getElementById('champ').textContent=d.champion||'CASH';document.getElementById('labels').textContent=(d.agents||[]).reduce((s,a)=>s+(a.observations||0),0);
 document.getElementById('health').textContent=(d.health?.status||'WAITING')+' • Last update '+(d.lastRunAt||'not yet')+' • Last completed candle '+(d.lastBar?new Date(d.lastBar*1000).toLocaleString():'none');
 document.getElementById('rows').innerHTML=(d.agents||[]).map(a=>'<tr><td>'+esc(a.id)+'</td><td>$'+Number(a.nav).toFixed(2)+'</td><td>'+Number(a.roi_pct).toFixed(2)+'%</td><td>'+a.trades+'</td></tr>').join('');
 if(b.ok){const x=await b.json();document.getElementById('bounties').textContent=x.count||0;
 document.getElementById('leads').innerHTML=(x.leads||[]).slice(0,12).map(y=>'<p><a target="_blank" rel="noopener noreferrer" href="'+encodeURI(y.url)+'">'+esc(y.title)+'</a> '+(y.payoutMentionUSD?' • $'+y.payoutMentionUSD+' mentioned':'')+' <small>UNVERIFIED</small></p>').join('')||'No leads yet';}
 }catch(e){document.getElementById('health').textContent='No fresh agent data: '+e.message;}
}load();setInterval(load,30000);
</script></body></html>`;
}
export default {
 async scheduled(controller,env,ctx){
  const cron=controller.cron;
  ctx.waitUntil((async()=>{
   try{
     if(cron==='* * * * *')console.log('PAPER MINUTE',item(await cyclePaper(env.DB,controller.scheduledTime/1000)));
     else if(cron==='17 */3 * * *')console.log('BOUNTIES',item(await cycleBounties(env.DB)));
   }catch(e){console.error('PAPER RESEARCH FAILED CLOSED',String(e?.message||e));}
  })());
 },
 async fetch(req,env){
  const url=new URL(req.url);
  if(req.method!=='GET'&&req.method!=='HEAD')return json({error:'read-only API'},405);
  try{
   if(url.pathname==='/'||url.pathname==='/index.html')return new Response(page(),{headers:htmlHeaders});
   if(url.pathname==='/api/status'){
     const v=await info(env.DB,'summary');return v?json(JSON.parse(v.value)):json({mode:'PAPER ONLY — NO MONEY',health:{status:'NOT_INITIALIZED'},agents:[]},503);
   }
   if(url.pathname==='/api/bounties'){
     const v=await info(env.DB,'bounties');return v?json(JSON.parse(v.value)):json({kind:'RESEARCH_ONLY',count:0,leads:[]});
   }
   if(url.pathname==='/health')return json({service:'micro-compound-paper',mode:'PAPER_ONLY',cloudflare:true,updatedAt:stamp()});
   return json({error:'Not found'},404);
  }catch(e){return json({error:'Research API unavailable; no fabricated data'},503);}
 }
};
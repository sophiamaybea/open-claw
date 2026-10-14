/* Cloudflare migration: minute-by-minute research, D1 persistence, public read-only dashboard.
 * NO wallet/account credentials, real exchange orders, payments or funded trading.
 * Uses existing deterministic paper engine; persistent state never backfills imaginary fills.
 */
import {newState,advance,publicSummary,PAIRS,ONE_MINUTE} from '../core.mjs';
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
/**
 * Scheduled, unauthenticated, READ-ONLY Coinbase public OHLCV fetch and local
 * PAPER-ONLY simulation. No API keys, credentials or exchange write functions.
 * GitHub Actions retains state-minute.json across invocations by committing it.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {newState,advance,publicSummary,PAIRS,ONE_MINUTE} from './core.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const file=join(here,'state-minute.json'), publicFile=join(here,'site','latest.json');
const now=Date.now(),toIso=secs=>new Date(secs*1000).toISOString();
async function readState(){try{return JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return newState();throw e;}}
async function get(symbol,completeBefore) {
 const from=completeBefore-294*ONE_MINUTE;
 const u='https://api.exchange.coinbase.com/products/'+encodeURIComponent(symbol)
   +'/candles?granularity='+ONE_MINUTE+'&start='+encodeURIComponent(toIso(from))+'&end='+encodeURIComponent(toIso(completeBefore));
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),18000);
 try {
   const response=await fetch(u,{signal:controller.signal,headers:{'Accept':'application/json','User-Agent':'MicroCompoundPaperResearch/1.0 (public read-only OHLCV)'}});
   if(!response.ok)throw Error('Public OHLCV '+symbol+' HTTP '+response.status);
   const raw=await response.json();
   if(!Array.isArray(raw))throw Error('Public OHLCV '+symbol+' had invalid shape');
   return raw.map(row=>({t:Number(row[0]),l:Number(row[1]),h:Number(row[2]),o:Number(row[3]),c:Number(row[4]),v:Number(row[5])}))
     .filter(row=>Number.isInteger(row.t)&&row.t<completeBefore);
 } finally {clearTimeout(timer)}
}
async function main(){
 const state=await readState();
 let summary={status:'WAITING_FOR_MARKET_DATA',processed:0};
 try{
   const before=Math.floor(now/1000/ONE_MINUTE)*ONE_MINUTE;
   const fetched=await Promise.all(PAIRS.map(pair=>get(pair,before)));
   const feed=Object.fromEntries(PAIRS.map((p,i)=>[p,fetched[i]]));
   const result=advance(state,feed,now/1000);
   summary={...result,status:result.bootstrap?'BOOTSTRAPPED':'PAPER_RUNNING'};
   state.lastError=null;
 }catch(e){
   state.lastError=String(e?.message||e).slice(0,220);
   state.errors.push({at:new Date(now).toISOString(),error:state.lastError});
   if(state.errors.length>30)state.errors=state.errors.slice(-30);
   state.updatedAt=new Date(now).toISOString();
   state.runs+=1;summary={...summary,status:'FEED_ERROR',error:state.lastError};
   // Fail closed: never generate fake fills from a gap or invented price.
 }
 await mkdir(join(here,'site'),{recursive:true});
 await writeFile(file,JSON.stringify(state,null,2)+'\n','utf8');
 const view=publicSummary(state);
 view.health=summary;
 await writeFile(publicFile,JSON.stringify(view,null,2)+'\n','utf8');
 console.log(JSON.stringify({health:summary,agents:state.agents.length,closedLabels:state.agents.reduce((n,a)=>n+a.wallet.completed,0),
  champion:state.selected,realDollarsSpent:0},null,2));
 if(summary.status==='FEED_ERROR')process.exitCode=0; // alert in public status, preserve last known state
}
await main();

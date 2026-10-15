/** Read-only public Limitless market data; no wallet or order API ever used. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {makeState,marketInfo,parseBook,registerForecast,learnOnResolution,report} from './engine.mjs';
import {describeModels,typedAssessments,readIndependentForecast} from './models.mjs';
const home=dirname(fileURLToPath(import.meta.url)),path=join(home,'state.json'),pub=join(home,'site','latest.json');
const NOW=Date.now(),BASE='https://api.limitless.exchange';
async function readJson(p){try{return JSON.parse(await readFile(p,'utf8'))}catch(e){if(e.code==='ENOENT')return null;throw e}}
async function apiGet(p){const c=new AbortController(),timer=setTimeout(()=>c.abort(),11000);try{const r=await fetch(BASE+p,{signal:c.signal,headers:{accept:'application/json','user-agent':'LimitlessPaperResearch/1.0 (read-only)'}});if(!r.ok)throw Error('Limitless '+p+' HTTP '+r.status);return r.json()}finally{clearTimeout(timer)}}
async function run(){
 const s=await readJson(path)||makeState();s.runs++;s.latestModels=describeModels();s.updatedAt=new Date(NOW).toISOString();let fresh=0,learned=0;
 try{
  const listing=await apiGet('/markets/active?limit=25&page=1&sortBy=newest&tradeType=clob');
  if(!Array.isArray(listing.data))throw Error('Invalid Limitless market-list response');
  const chosen=listing.data.map(m=>marketInfo(m,NOW)).filter(Boolean).sort((a,b)=>a.remainingMin-b.remainingMin).slice(0,8);
  const scanned=[];
  for(const info of chosen){
   try{
    const raw=await apiGet('/markets/'+encodeURIComponent(info.slug)+'/orderbook'),book=parseBook(raw);
    if(!book){scanned.push({...info,quality:'NO_VALID_QUOTES',decision:'HOLD'});continue}
    const ext=await readIndependentForecast(info,{now:NOW}),models=await typedAssessments(info);
    if(models.status==='PARTIAL_OR_UNAVAILABLE'){s.latestModels.laya='UNAVAILABLE_OR_PARTIAL';s.latestModels.kev='UNAVAILABLE_OR_PARTIAL'}
    const f=registerForecast(s,info,book,NOW,{independentProbability:ext.pYes,independentSource:ext.source||'NONE',modelAssessments:models.assessments});
    if(f)fresh++;
    scanned.push({...info,quality:'VALID_ORDER_BOOK',yesBid:book.yesBid,yesAsk:book.yesAsk,spread:book.spread,marketProbability:book.mid,independentProbability:ext.pYes,decision:f?.decision||'ALREADY_RECORDED',reason:f?.reason||'EARLIER_SNAPSHOT_RETAINED'});
   }catch(e){scanned.push({...info,quality:'DATA_ERROR',decision:'HOLD',error:String(e.message).slice(0,120)})}
  }
  s.scanned=scanned;s.lastScan={at:s.updatedAt,listed:listing.data.length,eligible:chosen.length,newForecasts:fresh};
  // Check past deadlines against OFFICIAL resolution only, not Coinbase price or assumptions.
  for(const f of s.forecasts.filter(f=>f.resolution===null&&Date.parse(f.expiresAt)<=NOW).slice(0,18)){
   try{const detail=await apiGet('/markets/'+encodeURIComponent(f.slug));if(learnOnResolution(s,f.slug,detail,NOW))learned++}
   catch(e){s.errors.push({at:s.updatedAt,step:'resolution',slug:f.slug,error:String(e.message).slice(0,95)})}
  }
  s.status='SCANNING_AND_LEARNING';
 }catch(e){s.status='FEED_ERROR';s.errors.push({at:s.updatedAt,step:'scan',error:String(e.message).slice(0,160)})}
 if(s.forecasts.length>700){const open=s.forecasts.filter(x=>x.resolution===null),done=s.forecasts.filter(x=>x.resolution!==null);s.forecasts=[...done.slice(-Math.max(0,700-open.length)),...open].slice(-1200)}
 s.errors=s.errors.slice(-15);
 await mkdir(join(home,'site'),{recursive:true});
 await writeFile(path,JSON.stringify(s,null,2)+'\n');await writeFile(pub,JSON.stringify(report(s),null,2)+'\n');
 console.log(JSON.stringify({status:s.status,newPredictions:fresh,newVerifiedLabels:learned,runs:s.runs,scanned:s.scanned.length,held:'NO REAL TRADING'}));
}
await run();
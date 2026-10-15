/** Optional typed decision-model adapter. AI confidence is never an event probability. */
export const MODEL_SPECS={laya:{model:'laya:en',usage:'market screening'},kev:{model:'kev:4b',usage:'evidence and uncertainty assessment'},h2o:{model:'h2oai/h2o-lightning-4b',usage:'longer-duration evidence assessment (future service)'}};
export function describeModels(env=process.env){return {laya:env.OLLAYA_URL?'CONFIGURED':'NOT_CONFIGURED',kev:env.OLLAYA_URL?'CONFIGURED':'NOT_CONFIGURED',h2o:env.H2O_DECISIONS_URL?'CONFIGURED':'NOT_CONFIGURED',statistical:env.INDEPENDENT_FORECAST_URL?'CONFIGURED':'NOT_CONFIGURED'};}
export async function typedAssessments(info,{fetcher=fetch,env=process.env}={}){
 if(!env.OLLAYA_URL)return {status:'NOT_CONFIGURED',assessments:{}};
 const base=new URL(env.OLLAYA_URL);
 if(base.protocol!=='https:'&&!(base.protocol==='http:'&&['127.0.0.1','localhost'].includes(base.hostname)))return {status:'UNSAFE_ENDPOINT',assessments:{}};
 const assessments={};let failures=0;
 for(const [name,model] of [['laya','laya:en'],['kev','kev:4b']]){
  try{
   const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),4000);
   try{
    const response=await fetcher(new URL('/api/decide',base),{method:'POST',signal:ctrl.signal,headers:{'content-type':'application/json',...(env.OLLAYA_TOKEN?{'authorization':'Bearer '+env.OLLAYA_TOKEN}:{})},body:JSON.stringify({model,state:{title:info.title,marketType:'prediction',symbol:info.symbol,expiresAt:info.expiresAt},questions:{clear_market:{type:'noul',instructions:'Are the outcome and settlement conditions sufficiently clear to investigate further?'},needs_research:{type:'noul',instructions:'Does the market require additional research to assess settlement conditions?'}}})});
    if(!response.ok)throw Error('HTTP '+response.status);const data=await response.json();
    assessments[name]={status:'RESPONSE_UNVALIDATED',clearMarket:typeof data.answers?.clear_market?.noul==='number'?data.answers.clear_market.noul:null,needsResearch:typeof data.answers?.needs_research?.noul==='number'?data.answers.needs_research.noul:null};
   }finally{clearTimeout(timer)}
  }catch(e){failures++;assessments[name]={status:'UNAVAILABLE',error:String(e.message).slice(0,90)};}
 }
 return {status:failures?'PARTIAL_OR_UNAVAILABLE':'ASSESSMENTS_AVAILABLE',assessments};
}
/** Accept only a contemporaneous, exact-market prediction from a separate service. */
export async function readIndependentForecast(info,{fetcher=fetch,env=process.env,now=Date.now()}={}){
 if(!env.INDEPENDENT_FORECAST_URL)return {status:'NOT_CONFIGURED',pYes:null};
 const base=new URL(env.INDEPENDENT_FORECAST_URL);if(base.protocol!=='https:')return {status:'HTTPS_REQUIRED',pYes:null};
 try{
  const u=new URL(base);u.searchParams.set('slug',info.slug);u.searchParams.set('symbol',info.symbol);u.searchParams.set('bucket',info.bucket);
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),4500);
  try{
   const r=await fetcher(u,{signal:ctrl.signal,headers:env.INDEPENDENT_FORECAST_TOKEN?{'authorization':'Bearer '+env.INDEPENDENT_FORECAST_TOKEN}:{}});
   if(!r.ok)throw Error('HTTP '+r.status);const j=await r.json(),p=Number(j.pYes),t=Date.parse(j.generatedAt);
   if(j.slug!==info.slug||j.source==='MARKET_MIDPOINT'||!Number.isFinite(p)||p<=0||p>=1||!Number.isFinite(t)||Math.abs(now-t)>120000)return {status:'REJECTED_STALE_OR_MISMATCHED',pYes:null};
   return {status:'FORECAST_AVAILABLE',pYes:p,source:String(j.source||'INDEPENDENT_MODEL').slice(0,70)};
  }finally{clearTimeout(timer)}
 }catch(e){return {status:'UNAVAILABLE',pYes:null,error:String(e.message).slice(0,120)};}
}
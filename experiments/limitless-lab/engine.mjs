/** Limitless prediction lab: public-data and paper-only, NO order endpoints. */
export const VERSION='limitless-lab-v1';
export const clamp=(v,l,h)=>Math.max(l,Math.min(h,v));
export const sigmoid=x=>1/(1+Math.exp(-clamp(x,-25,25)));
export const logit=p=>Math.log(clamp(p,.01,.99)/(1-clamp(p,.01,.99)));
export const asTime=v=>{if(typeof v==='number'&&Number.isFinite(v))return v<1e11?v*1000:v;let t=Date.parse(String(v||''));return Number.isFinite(t)?t:null;};
export function makeState(){return {version:VERSION,mode:'PAPER_ONLY',updatedAt:null,runs:0,errors:[],calibrator:{bias:0,slope:1,trained:0,learningRate:.04},forecasts:[],resolvedCount:0,scanned:[],lastScan:null,latestModels:{laya:'NOT_CONFIGURED',kev:'NOT_CONFIGURED',h2o:'NOT_CONFIGURED',statistical:'NOT_CONFIGURED'},status:'AWAITING_FIRST_SCAN'};}
export function marketInfo(m,now=Date.now()){
 if(!m||typeof m.slug!=='string')return null;
 const title=String(m.title||''),full=(m.slug+' '+title+' '+(m.categories||[]).join(' ')).toLowerCase();
 const symbol=/(?:\bbtc\b|bitcoin)/i.test(full)?'BTC':/(?:\beth\b|ethereum)/i.test(full)?'ETH':null;
 if(!symbol)return null;
 const exp=asTime(m.expirationTimestamp??m.deadline??m.expirationDate),remaining=exp===null?null:(exp-now)/60000;
 if(m.tradeType!=='clob'||m.tradingEnabled===false||m.expired===true||remaining===null||remaining<=0||remaining>180)return null;
 const horizon=String(m.subFrequency||m.frequency||m.tags?.join(' ')||'').toLowerCase();
 const bucket=/(?:minutes[_ -]?5|5[_ -]?min|5m)/.test(horizon)?'5m':/(?:minutes[_ -]?15|15[_ -]?min|15m)/.test(horizon)?'15m':/(?:60[_ -]?min|hour|1h)/.test(horizon)?'1h':remaining<=5?'5m':remaining<=15?'15m':'1h';
 return {slug:m.slug,title,symbol,bucket,expiresAt:new Date(exp).toISOString(),remainingMin:+remaining.toFixed(2),status:m.status,tradeType:m.tradeType};
}
export function parseBook(book){
 if(!book||!Array.isArray(book.bids)||!Array.isArray(book.asks))return null;
 const bid=book.bids.map(x=>Number(x.price)).filter(x=>x>0&&x<1).sort((a,b)=>b-a)[0],ask=book.asks.map(x=>Number(x.price)).filter(x=>x>0&&x<1).sort((a,b)=>a-b)[0];
 if(!Number.isFinite(bid)||!Number.isFinite(ask)||ask<bid)return null;
 return {yesBid:bid,yesAsk:ask,noAsk:+(1-bid).toFixed(6),noBid:+(1-ask).toFixed(6),mid:+((bid+ask)/2).toFixed(6),spread:+(ask-bid).toFixed(6),minSize:Number(book.minSize)||1};
}
export function calibratedProbability(model,base){return sigmoid(model.bias+model.slope*logit(base));}
export function classifyCandidate({pYes=null,book,minutesLeft=null,labels=0,source='NONE',feePerShare=.02,minEdge=.03}={}){
 if(!book)return {decision:'HOLD',reason:'NO_EXECUTABLE_ORDER_BOOK'};
 if(!Number.isFinite(minutesLeft)||minutesLeft<=0)return {decision:'HOLD',reason:'EXPIRED_OR_UNKNOWN_DEADLINE'};
 if(!Number.isFinite(pYes)||pYes<=0||pYes>=1)return {decision:'HOLD',reason:'NO_INDEPENDENT_FORECAST'};
 if(labels<30)return {decision:'HOLD',reason:'NOT_ENOUGH_VERIFIED_LABELS'};
 if(source==='MARKET_MIDPOINT'||source==='MARKET_CALIBRATION')return {decision:'HOLD',reason:'MARKET_DERIVED_NOT_INDEPENDENT'};
 const yesEv=pYes-book.yesAsk-feePerShare,noEv=(1-pYes)-book.noAsk-feePerShare;
 const best=yesEv>noEv?{side:'YES',netEv:yesEv,price:book.yesAsk}:{side:'NO',netEv:noEv,price:book.noAsk};
 if(best.netEv<minEdge)return {decision:'HOLD',reason:'INSUFFICIENT_NET_EDGE',best};
 return {decision:'PAPER_CANDIDATE',reason:'SIMULATE_ONLY',best};
}
export function registerForecast(state,info,book,now=Date.now(),{independentProbability=null,independentSource='NONE',modelAssessments={}}={}){
 if(state.forecasts.some(f=>f.slug===info.slug))return null;
 const pMarket=book.mid,pCalibration=calibratedProbability(state.calibrator,pMarket);
 const proposal=classifyCandidate({pYes:independentProbability,book,minutesLeft:info.remainingMin,labels:state.calibrator.trained,source:independentSource});
 const rec={slug:info.slug,title:info.title,symbol:info.symbol,bucket:info.bucket,expiresAt:info.expiresAt,observedAt:new Date(now).toISOString(),pMarket,pCalibration:+pCalibration.toFixed(6),independentProbability:Number.isFinite(independentProbability)?independentProbability:null,independentSource,yesBid:book.yesBid,yesAsk:book.yesAsk,noAsk:book.noAsk,spread:book.spread,assessment:modelAssessments,decision:proposal.decision,reason:proposal.reason,resolution:null,verifiedAt:null};
 state.forecasts.push(rec);return rec;
}
export function learnOnResolution(state,slug,market,now=Date.now()){
 const f=state.forecasts.find(x=>x.slug===slug&&x.resolution===null);
 if(!f||String(market?.status||'').toUpperCase()!=='RESOLVED')return false;
 const idx=market.winningOutcomeIndex;let y;
 if(idx===0)y=1;else if(idx===1)y=0;
 else if(Array.isArray(market.payoutNumerators)&&market.payoutNumerators.length===2){const a=Number(market.payoutNumerators[0]),b=Number(market.payoutNumerators[1]);if(!(a>=0&&b>=0&&a+b>0))return false;y=a/(a+b);}else return false;
 f.resolution=y;f.verifiedAt=new Date(now).toISOString();
 f.brierMarket=(f.pMarket-y)**2;f.brierCalibration=(f.pCalibration-y)**2;
 if(f.independentProbability!==null)f.brierIndependent=(f.independentProbability-y)**2;
 // Prequential learning: the recorded forecast is never changed after observing settlement.
 const err=f.pCalibration-y,x=logit(f.pMarket),eta=state.calibrator.learningRate;
 state.calibrator.bias=clamp(state.calibrator.bias-eta*err,-2,2);state.calibrator.slope=clamp(state.calibrator.slope-eta*err*x,.2,2.5);
 state.calibrator.trained++;state.resolvedCount++;return true;
}
export function report(state){
 const settled=state.forecasts.filter(f=>f.resolution!==null);
 const mean=k=>settled.length?+(settled.reduce((a,f)=>a+(f[k]??0),0)/settled.length).toFixed(6):null;
 const ind=settled.filter(f=>typeof f.brierIndependent==='number');
 return {version:VERSION,mode:'PAPER ONLY — NO LIVE ORDERS',updatedAt:state.updatedAt,status:state.status,runs:state.runs,predictions:state.forecasts.length,resolved:state.resolvedCount,calibrator:{trained:state.calibrator.trained,bias:+state.calibrator.bias.toFixed(5),slope:+state.calibrator.slope.toFixed(5)},brierMarket:mean('brierMarket'),brierCalibration:mean('brierCalibration'),brierIndependent:ind.length?+(ind.reduce((a,f)=>a+f.brierIndependent,0)/ind.length).toFixed(6):null,independentSamples:ind.length,modelStatus:state.latestModels,markets:state.scanned.slice(0,16),errors:state.errors.slice(-5),warnings:['Forecasts are not proven profitable.','Market-derived calibration is not independent forecasting.','No real trades, wallets, orders or funds.']};
}
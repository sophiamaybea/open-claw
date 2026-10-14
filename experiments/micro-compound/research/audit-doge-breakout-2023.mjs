/* Pre-declared DOGE breakout rule, 20-day HIGH breakout, SMA(10) exit, minimum 7 days. 1-day OHLCV only.
 An independent earlier-year falsification audit. No wallet or network operations.
 */
export function auditFixedDOGE(ohlcv,{periodStart='2023-01-01',periodEnd='2024-01-01',feeBps=50,slipBps=10,delayDays=0}={}){
 const series=ohlcv.sort((a,b)=>a.t-b.t), start=Date.parse(periodStart+'T00:00:00Z')/1000,end=Date.parse(periodEnd+'T00:00:00Z')/1000;
 const first=series.findIndex(z=>z.t===start),stop=series.findIndex(z=>z.t===end),last=(stop<0?series.length:stop);
 if(first<21||last-first<20)throw Error('Missing enough complete bars');
 let cash=3,qty=0,enteredAt=-1000,peak=3,maxDD=0,turns=0,fees=0,events=[],pending=null,invalid=false;
 const charge=(notional)=>notional*(feeBps+slipBps)/10000;
 for(let i=first;i<last;i++){
   // Feature calculation is based on *completed previous days*, never today's OHLC.
   if(pending && pending.at===i){
     if(pending.side==='sell'&&qty){
       const gross=qty*series[i].o;if(gross<1)invalid=true;
       const cost=charge(gross);fees+=cost;cash+=gross-cost;qty=0;turns++;
       events.push({date:new Date(series[i].t*1000).toISOString().slice(0,10),action:'sell',price:series[i].o,nav:cash,cost});
     }else if(pending.side==='buy'&&qty===0&&cash>=1){
       const spent=cash,paid=spent/(1+(feeBps+slipBps)/10000),cost=spent-paid;
       if(paid>=1){qty=paid/series[i].o;cash=0;enteredAt=i;fees+=cost;turns++;events.push({date:new Date(series[i].t*1000).toISOString().slice(0,10),action:'buy',price:series[i].o,nav:paid,cost})}
     }
     pending=null;
   }
   if(!pending && i<last-1-delayDays){
     const prior=series[i-1], priorHigh=Math.max(...series.slice(i-21,i-1).map(x=>x.h));
     const last10=series.slice(i-10,i), sma10=last10.reduce((s,x)=>s+x.c,0)/10;
     if(qty===0&&prior.c>priorHigh)pending={side:'buy',at:i+delayDays};
     if(qty>0&&i-enteredAt>=7&&prior.c<sma10)pending={side:'sell',at:i+delayDays};
     if(pending&&delayDays===0){
       if(pending.side==='buy'&&cash>=1){const paid=cash/(1+(feeBps+slipBps)/10000);const cost=cash-paid;
         if(paid>=1){qty=paid/series[i].o;cash=0;enteredAt=i;fees+=cost;turns++;events.push({date:new Date(series[i].t*1000).toISOString().slice(0,10),action:'buy',price:series[i].o,nav:paid,cost})}
       }else if(pending.side==='sell'&&qty){const gross=qty*series[i].o; if(gross<1)invalid=true;const cost=charge(gross);cash+=gross-cost;qty=0;fees+=cost;turns++;events.push({date:new Date(series[i].t*1000).toISOString().slice(0,10),action:'sell',price:series[i].o,nav:cash,cost});}
       pending=null;
     }
   }
   const value=cash+qty*series[i].c;peak=Math.max(peak,value);maxDD=Math.max(maxDD,(peak-value)/peak);
 }
 const gross=qty*series[last-1].c;const ending=cash+(qty?gross-charge(gross):0);if(qty){fees+=charge(gross);if(gross<1)invalid=true;}
 const b0=series[first].o,b1=series[last-1].c,benchmark=(b1/b0)*Math.pow(1+(feeBps+slipBps)/10000,-1)*(1-(feeBps+slipBps)/10000);
 return {period:periodStart+' to '+periodEnd,firstBar:series[first].t,lastBar:series[last-1].t,feeBps,slipBps,delayDays,pnl:ending-3,retPct:100*(ending/3-1),endUSD:ending,maxDrawdownPct:100*maxDD,transactions:turns,feesUSD:fees,valid:!invalid,buyholdDOGERetPct:100*(benchmark-1),ledger:events};
}
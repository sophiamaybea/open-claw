/* Micro Compound 0.3, history replay. Paper-only. No APIs, wallets or order submission.
   Read-only OHLCV snapshots; fixed fees, pessimistic next-open market fills;
   hypothetical post-only orders have stochastic queue fills not proved by OHLC.
   Parameter variants and fill-seed scenarios are NOT independent market evidence.
*/
export function benchmark(dataset) {
 const arms=['momentum','mean_reversion','breakout','passive_maker'],methods=[...arms,'adaptive','hold'];
 const scenarios=[], feedStats=[];
 const fees={makerBps:25,takerBps:50,source:'Coinbase Advanced Trade intro fee tier returned by owner connected read-only fee query on 2026-10-14'};
 function avg(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:0}
 function signal(c,i,arm,threshold) {
   if(i<20)return false;
   if(arm==='momentum')return 10000*(c[i].c/c[i-4].c-1)>24*threshold;
   if(arm==='mean_reversion'){const v=c.slice(i-14,i+1).map(z=>z.c);const m=avg(v);const s=Math.sqrt(avg(v.map(z=>(z-m)**2)));return (c[i].c-m)/(s||1)<-1*threshold;}
   if(arm==='breakout')return c[i].c>Math.max(...c.slice(i-15,i).map(z=>z.h))*(1+0.00005*threshold);
   if(arm==='passive_maker')return (c[i].h-c[i].l)/c[i].c>.0018*threshold;
   return false;
 }
 function fill(seed,t,arm,rate){let h=(Math.imul((seed+1)*2654435761,1) ^ Math.imul(t+1,1597334677) ^ (arm.length*9817))>>>0; h^=h>>>16;h=Math.imul(h,2246822519)>>>0;h^=h>>>13;return (h>>>0)/4294967296<rate;}
 function proposed(c,i,arm,k,h,cfg,seed){
   if(i+1+h>=c.length)return null;
   const e=i+1,x=e+h;
   let buy=c[e].o;
   if(arm==='passive_maker'){
     buy=c[i].c*(1-0.0005*k);
     // Reaching candle low is not a guarantee of queue fill.
     if(c[e].l>buy*(1-.0002)||!fill(seed,i,arm,cfg.queue))return null;
   }
   const sell=c[x].o;
   const entryFee=(arm==='passive_maker'?25:50)*cfg.fee/1e4;
   const exitFee=50*cfg.fee/1e4;
   const slip=cfg.slip*cfg.fee/1e4;
   const buyExecuted=arm==='passive_maker'?buy:buy*(1+slip);
   const sellExecuted=sell*(1-slip);
   const gain=(sellExecuted/buyExecuted)*(1-exitFee)-(1+entryFee);
   return {end:x,gain};
 }
 function one(c,signals,method,cfg){
   let balance=cfg.cash,peak=balance,closed=0,wins=0,halted=false,modelChoices=0, matured=0;let due=null;
   const pending=Array.from({length:c.length},()=>[]),shadows={};
   for(const a of arms)shadows[a]={busy:0,values:[]};
   for(let i=20;i<c.length-2;i++){
     if(due && due.end<=i){balance+=due.notional*due.gain;wins+=Number(due.gain>0);closed++;due=null;}
     for(const [arm,gain] of pending[i]){const x=shadows[arm].values;x.push(gain);if(x.length>50)x.shift();matured++;}
     if(method==='adaptive') {
       for(const a of arms){if(shadows[a].busy>i || !signals[a][i])continue;
         const pp=proposed(c,i,a,cfg.k,cfg.h,cfg,(cfg.seed+arms.indexOf(a)*17)>>>0);
         if(pp){shadows[a].busy=pp.end;pending[pp.end].push([a,pp.gain]);}
       }
     }
     if(due)continue;
     peak=Math.max(peak,balance);if((peak-balance)/peak>=.20)halted=true;
     if(halted || method==='hold')continue;
     let choose=method;
     if(method==='adaptive'){
       const candidates=arms.filter(a=>signals[a][i]&&shadows[a].values.length>=3&&avg(shadows[a].values)>0);
       if(!candidates.length)continue;
       choose=candidates.reduce((a,b)=>avg(shadows[a].values)>avg(shadows[b].values)?a:b);
     }
     if(!signals[choose][i])continue;
     const pp=proposed(c,i,choose,cfg.k,cfg.h,cfg,cfg.seed);
     if(!pp)continue;
     const notional=balance*.35;
     if(notional+1e-9<1 || notional*(1+50*cfg.fee/1e4)>balance)continue;
     due={...pp,notional};if(method==='adaptive')modelChoices++;
   }
   if(due&&due.end<c.length){balance+=due.notional*due.gain;wins+=Number(due.gain>0);closed++;}
   return {pnl:balance-cfg.cash,pct:100*(balance/cfg.cash-1),trades:closed,wins,halted,modelChoices,maturedLabels:matured};
 }
 for(const feed of dataset.series||[]){
   const c=feed.candles||[];if(c.length<60){feedStats.push({product:feed.product_id,granularity:feed.granularity,bars:c.length,excluded:true});continue;}
   feedStats.push({product:feed.product_id,granularity:feed.granularity,bars:c.length,start:c[0].t,end:c[c.length-1].t});
   for(const k of [.7,1,1.4]){
     const signs=Object.fromEntries(arms.map(a=>[a,c.map((_,i)=>signal(c,i,a,k))]));
     for(const cash of [1,3,10])for(const fee of [1,2,5])for(const h of [3,8,16])
       for(const slip of [2,12])for(const queue of [.15,.50])
         for(const method of methods){
           const cfg={cash,fee,h,slip,queue,k,seed:42};
           const result=one(c,signs,method,cfg);
           scenarios.push({product:feed.product_id,granularity:feed.granularity,method,cash,fee,h,slip,queue,k,...result});
         }
   }
 }
 const groups={},venues={};
 for(const r of scenarios){(groups[r.method]??=[]).push(r);(venues[r.product+'|'+r.granularity]??=[]).push(r)}
 const methodsSummary=Object.keys(groups).sort().map(method=>{const rows=groups[method];return {method,runs:rows.length,mean_pct:+avg(rows.map(x=>x.pct)).toFixed(5),median_pct:+rows.map(x=>x.pct).sort((a,b)=>a-b)[Math.floor(rows.length/2)].toFixed(5),positive_rate_pct:+(100*rows.filter(x=>x.pnl>0).length/rows.length).toFixed(3),traded_rate_pct:+(100*rows.filter(x=>x.trades>0).length/rows.length).toFixed(3),average_trades:+avg(rows.map(x=>x.trades)).toFixed(3),model_decisions:rows.reduce((s,x)=>s+x.modelChoices,0),matured_shadow_labels:rows.reduce((s,x)=>s+x.maturedLabels,0),min_pct:+Math.min(...rows.map(x=>x.pct)).toFixed(5),max_pct:+Math.max(...rows.map(x=>x.pct)).toFixed(5)}});
 const byFeed=Object.entries(venues).map(([feed,rows])=>({feed,methods:Object.fromEntries(methods.map(m=>[m,+avg(rows.filter(x=>x.method===m).map(x=>x.pct)).toFixed(5)]))}));
 return {meta:{title:'Micro Compound v0.3 actual observed OHLCV paper stress replay',date:'2026-10-14',funded_usd:0,source:dataset.source,independent_historical_feeds:feedStats.length,market_observations:feedStats.reduce((s,x)=>s+x.bars,0),stress_replay_count:scenarios.length,not_independent_trials:true,costs:fees,capital_tests:[1,3,10],fee_multipliers:[1,2,5],slippage_bps:[2,12],passive_queue_fill_probabilities:[.15,.50],params:'3 thresholds x 3 holding horizons. No look-ahead entry: signal bar close, then next bar open. Long spot only. Maker fills simulated from next candle low and synthetic queue probability. No order book, memecoin rug detection, latency ticks, spread or live execution.'},feeds:feedStats,by_method:methodsSummary,by_feed:byFeed,example_first_50:scenarios.slice(0,50)};
}
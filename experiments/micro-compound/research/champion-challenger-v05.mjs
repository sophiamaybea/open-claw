/**
 * Micro Compound v0.5: paper-only, chronological self-learning strategy research.
 * Each shadow strategy acts as a separate simulated portfolio with its own labels.
 * At review time, choose a champion from COMPLETED prior observations. A promising
 * champion may spawn a new variant, born TODAY, and cannot be promoted until its
 * own forward-shadow history matures. Nothing here can place orders or move funds.
 * Historical market data were previously used in Micro Compound research: this
 * retrospective diagnostic is NOT a blind future/out-of-sample test.
 */
export const VERSION='micro-compound-research-v0.5';
export function researchLoop(feeds,opt={}){
 const config={fee:.005,slippage:.001,capital:3,minimumUsd:1,reviewDays:21,evidenceDays:120,maxChallengers:26, ...opt};
 const syms=Object.keys(feeds).sort(),data=Object.fromEntries(syms.map(s=>[s,feeds[s].candles]));
 const N=Math.min(...syms.map(s=>data[s].length));
 if(N<600||syms.length<3)throw Error('Insufficient daily multi-asset history');
 for(let k=0;k<N;k++)for(const s of syms)if(data[s].length!==N||data[s][k].t!==data[syms[0]][k].t)throw Error('Misaligned daily time series');
 const seeds=[
  ['rot120','rotation',120,120,45,0],['rot90','rotation',90,150,30,.01],
  ['rot60','rotation',60,200,30,0],['rot150','rotation',150,150,60,.01],
  ['rot200','rotation',200,200,45,0],['rot45','rotation',45,120,21,.02],
  ['rot120s','rotation',120,200,21,0],['rot30','rotation',30,90,14,.03],
  ['lowvol60','lowvol',60,200,30,0],['lowvol120','lowvol',120,150,45,0],
  ['btc','trend',120,200,45,0,'BTC-USD'],
  ['eth','trend',120,200,45,0,'ETH-USD'],
  ['sol','trend',120,200,45,0,'SOL-USD']
 ].filter(r=>!r[6]||syms.includes(r[6]))
 .map(([id,type,lb,ma,hold,thresh,asset])=>({id,type,lb,ma,hold,thresh,asset,seed:true}));
 const wallet=()=>({usd:config.capital,asset:null,qty:0,entered:-1,spent:0,labels:[],equity:[],feeUsd:0,unfillable:0,peak:config.capital,dd:0});
 const candidates=seeds.map(p=>({...p,born:0,wallet:wallet()}));
 const champion=wallet(),static120=wallet(),cash=wallet(),buyBTC=wallet();
 const revisions=[],births=[],endogenousUpdates=[];
 const closePx=(s,k)=>data[s][k].c,openPx=(s,k)=>data[s][k].o;
 const date=k=>new Date(data[syms[0]][k].t*1000).toISOString().slice(0,10);
 function choose(p,k){
   const ix=k-1,available=[];
   if(ix<201)return null;
   for(const s of syms){
     if(p.asset && p.asset!==s)continue;
     const arr=data[s];const price=arr[ix].c;
     const mean=arr.slice(ix-p.ma+1,ix+1).reduce((a,b)=>a+b.c,0)/p.ma;
     const ret=price/arr[ix-p.lb].c-1;
     if(!(price>mean&&ret>p.thresh))continue;
     if(p.type==='lowvol'){
       const rs=[];for(let j=ix-19;j<=ix;j++)rs.push(Math.log(arr[j].c/arr[j-1].c));
       const mu=rs.reduce((a,b)=>a+b,0)/rs.length,vol=Math.sqrt(rs.reduce((a,x)=>a+(x-mu)**2,0)/rs.length);
       if(vol>(p.lb===60?.025:.04))continue;
     }
     available.push({s,ret});
   }
   available.sort((a,b)=>b.ret-a.ret||a.s.localeCompare(b.s));
   return available[0]?.s??null;
 }
 function worth(w,k){return w.asset?w.usd+w.qty*openPx(w.asset,k)*(1-config.fee)*(1-config.slippage):w.usd;}
 function trade(w,k,target,minHold){
   if(w.asset&&target!==w.asset&&k-w.entered<minHold)target=w.asset;
   if(w.asset!==target){
     if(w.asset){
       const gross=w.qty*openPx(w.asset,k);
       if(gross<config.minimumUsd){w.unfillable++;target=w.asset;}
       else{
         const received=gross*(1-config.slippage)*(1-config.fee);
         w.usd+=received;w.feeUsd+=gross*config.fee;
         w.labels.push({open:w.entered,closed:k,asset:w.asset,netPercent:100*(received/w.spent-1),netUsd:received-w.spent});
         w.qty=0;w.asset=null;w.spent=0;
       }
     }
     if(!w.asset&&target){
       const p=openPx(target,k);
       if(w.usd>=config.minimumUsd&&p>0){
         const budget=w.usd;
         w.qty=(budget*(1-config.fee))/(p*(1+config.slippage));
         w.feeUsd+=budget*config.fee;w.spent=budget;w.usd=0;w.asset=target;w.entered=k;
       }else w.unfillable++;
     }
   }
   const v=worth(w,k);w.peak=Math.max(w.peak,v);w.dd=Math.max(w.dd,(w.peak-v)/w.peak);
   w.equity.push({day:k,nav:v,t:data[syms[0]][k].t});
 }
 function maxDD(rows){let hi=0,out=0;for(const x of rows){hi=Math.max(hi,x.nav);if(hi>0)out=Math.max(out,(hi-x.nav)/hi)}return out;}
 function score(c,k) {
   const eq=c.wallet.equity;
   if(eq.length<=config.evidenceDays)return null;
   const old=eq[eq.length-config.evidenceDays-1],now=eq.at(-1),pnl=now.nav/old.nav-1;
   const dd=maxDD(eq.slice(-config.evidenceDays-1));
   const labels=c.wallet.labels.filter(z=>z.closed>=k-config.evidenceDays).length;
   return {pnl,dd,labels,quality:pnl-.40*dd};
 }
 let selected=null;
 for(let k=205;k<N;k++){
   if(k===205||(k-205)%config.reviewDays===0) {
     // Scores from shadow valuations up to YESTERDAY; today's open is not yet used.
     const eligible=candidates.map(c=>({c,s:score(c,k)})).filter(z=>z.s&&z.s.pnl>0&&z.s.quality>.02&&z.s.labels>=1).sort((a,b)=>b.s.quality-a.s.quality);
     let next=eligible[0]?.c.id??null;
     const incumbent=eligible.find(z=>z.c.id===selected);
     if(incumbent&&incumbent.s.quality>=(eligible[0]?.s.quality??0)-.025)next=selected;
     if(next!==selected){revisions.push({date:date(k),day:k,old:selected,new:next,score:eligible[0]?+eligible[0].s.quality.toFixed(5):null});selected=next;}
     const winner=eligible[0];
     if(winner&&winner.s.pnl>.06&&winner.s.labels>=2&&winner.s.dd<.28&&candidates.length<config.maxChallengers){
       const parent=winner.c,sign=births.length%2? -30:30;
       const child={...parent,id:parent.id+'-trial'+(births.length+1),
         lb:Math.min(200,Math.max(20,parent.lb+sign)),
         ma:Math.min(200,Math.max(60,parent.ma+(sign>0?15:-15))),
         hold:Math.max(14,Math.min(75,parent.hold+(sign>0?7:-7))),
         thresh:Math.max(0,Math.min(.05,parent.thresh+(sign>0?.005:-.005))),
         seed:false,born:k+1,parent:parent.id,wallet:wallet()};
       const dup=candidates.some(c=>c.type===child.type&&c.lb===child.lb&&c.ma===child.ma&&c.hold===child.hold&&c.thresh===child.thresh&&c.asset===child.asset);
       if(!dup){candidates.push(child);births.push({date:date(k),parent:parent.id,child:child.id,why:'Cost-adjusted parent looked promising; child requires fresh forward paper history before promotion.'});}
     }
   }
   const p=candidates.find(z=>z.id===selected);
   trade(champion,k,p?choose(p,k):null,p?.hold??0);
   trade(static120,k,choose(seeds[0],k),seeds[0].hold);
   trade(cash,k,null,0);trade(buyBTC,k,'BTC-USD',2000);
   for(const c of candidates)if(k>=c.born){const prev=c.wallet.labels.length;trade(c.wallet,k,choose(c,k),c.hold);
       if(c.wallet.labels.length>prev){const last=c.wallet.labels.at(-1);if(endogenousUpdates.length<200)endogenousUpdates.push({date:date(k),candidate:c.id,...last});}}
 }
 function metric(w){const latest=w.equity.at(-1)?.nav??config.capital;return {nav:+latest.toFixed(6),returnPct:+(100*(latest/config.capital-1)).toFixed(4),drawdownPct:+(w.dd*100).toFixed(3),closedTrades:w.labels.length,winningClosedTrades:w.labels.filter(l=>l.netPercent>0).length,feeUSD:+w.feeUsd.toFixed(5),minimumTicketSkips:w.unfillable};}
 const byYear={};
 for(let year=2024;year<=2026;year++){
  const ix=champion.equity.map((e,i)=>({i,y:Number(new Date(e.t*1000).getUTCFullYear())})).filter(x=>x.y===year).map(x=>x.i);
  if(ix.length<2)continue;
  const start=ix[0],end=ix.at(-1),slice=w=>({retPct:+((w.equity[end].nav/w.equity[start].nav-1)*100).toFixed(3),ddPct:+(maxDD(w.equity.slice(start,end+1))*100).toFixed(3)});
  byYear[year]={learning:slice(champion),fixedRotation:slice(static120),cash:slice(cash),buyAndHoldBTC:slice(buyBTC)};
 }
 return {metadata:{version:VERSION,source:'Coinbase read-only historical 1-day OHLCV',marketDays:N,firstEvaluated:date(205),lastEvaluated:date(N-1),markets:syms,
  initialVirtualUSD:config.capital,realMoneyUSD:0,simulatedFeesPctPerSide:config.fee*100,slippagePctPerSide:config.slippage*100,
  caveat:'ALL 2024-2026 observations have already been inspected in prior research. This is RETROSPECTIVE demonstration, not untouched blind validation; simulated next-day OPEN fills do not model live order book.'},
  results:{learning:metric(champion),fixedRotation:metric(static120),cash:metric(cash),buyAndHoldBTC:metric(buyBTC),byYear},
  learning:{initialCandidates:seeds.length,finalCandidates:candidates.length,spawned:births.length,changes:revisions.length,closedShadowLabels:candidates.reduce((a,c)=>a+c.wallet.labels.length,0),
  spawnedToChampion:revisions.filter(r=>r.new?.includes('-trial')).length,
  championHistory:revisions,spawnedCandidates:births,closedTradeExamples:endogenousUpdates.slice(0,16),
  candidateScoreboard:candidates.map(c=>({id:c.id,seed:c.seed,born:date(Math.min(N-1,c.born)),labels:c.wallet.labels.length,returnPct:metric(c.wallet).returnPct}))}};
}
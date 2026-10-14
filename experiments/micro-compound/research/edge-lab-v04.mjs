/* Micro Compound Edge Lab v0.4 — chronological multi-year Coinbase paper backtester.
* No authenticated orders, signing, leverage, wallet use or live execution.
* Indicator at close t-1, order at next recorded OPEN(t); daily data lacks precise spreads/fill latency.
* Choices are selected with training 2024 and validation 2025, tested once on 2026.
*/
export function edgeLab(feed, opts={}) {
 const symbols=Object.keys(feed).sort(), data=symbols.map(s=>feed[s].candles), len=Math.min(...data.map(c=>c.length));
 if(symbols.length<3||len<700)throw Error('Need 3+ years/markets with >=700 days');
 const t0=data[0][0].t;
 for(const c of data){if(c[0].t!==t0)throw Error('Unaligned market histories');for(let i=1;i<len;i++)if(c[i].t!==data[0][i].t)throw Error('Missing candle day');}
 const start2024=Math.max(201,data[0].findIndex(d=>d.t>=1714521600)), start2025=data[0].findIndex(d=>d.t>=1735689600),start2026=data[0].findIndex(d=>d.t>=1767225600),end=len;
 if(Math.min(start2024,start2025,start2026)<0)throw Error('Missing years');
 const fee=opts.takerFee??.005,slip=opts.slippage??.0010,initial=opts.start??3, minTicket=1;
 function average(a){return a.length?a.reduce((s,v)=>s+v,0)/a.length:0;}
 // Features MUST have known values up to index i-1 only; all decisions precomputed only from past close.
 const F={};
 for(let k=0;k<symbols.length;k++){
  const a=data[k], by={};
  for(const n of [3,5,10,20,30,45,60,90,120,150,200]){
    const rs=[], av=[],mxh=[],vl=[],vol=[];
    for(let i=0;i<len;i++){
      rs[i]=(i>=n?a[i].c/a[i-n].c-1:NaN);
      let sum=0,high=-Infinity, v=0, sq=0;
      for(let z=Math.max(0,i-n+1);z<=i;z++){sum+=a[z].c;high=Math.max(high,a[z].h);v+=a[z].v;}
      av[i]=sum/Math.min(n,i+1);
      mxh[i]=(i>=n)?Math.max(...a.slice(i-n,i).map(x=>x.h)):NaN;
      vl[i]=v/Math.min(n,i+1);
      if(i>=n){let ret=[];for(let j=i-n+1;j<=i;j++)ret.push(Math.log(a[j].c/a[j-1].c));let m=average(ret);vol[i]=Math.sqrt(average(ret.map(x=>(x-m)**2)));}
      else vol[i]=NaN;
    }
    by[n]={ret:rs,ma:av,prevHigh:mxh,avgVolume:vl,vol};
  } F[k]=by;
 }
 function params(){
 const all=[];
 for(const n of [20,60,120,200])for(const thresh of [0,.01,.04])for(const minHold of [7,21])for(const k of symbols)
   all.push({type:'trend',k,n,thresh,minHold});
 for(const rankN of [20,60,120,200])for(const maN of [60,120,200])for(const thresh of [0,.02,.05])for(const minHold of [7,21,45])
   all.push({type:'rotation',rankN,maN,thresh,minHold});
 for(const rankN of [20,60,120])for(const maN of [60,200])for(const maxVol of [.025,.045,.075])for(const minHold of [7,21])
   all.push({type:'volatility_veto',rankN,maN,maxVol,minHold});
 for(const k of symbols)for(const n of [20,60])for(const exit of [10,30,60])for(const minHold of [7,21])
   all.push({type:'breakout',k,n,exit,minHold});
 for(const k of symbols)for(const dip of [-.025,-.05,-.08])for(const maN of [60,200])for(const wait of [5,14,30])
   all.push({type:'dip_reversal',k,dip,maN,wait,minHold:wait});
 for(const k of symbols)for(const volRatio of [1.5,2.5])for(const dayReturn of [.01,.025])for(const wait of [5,14])
   all.push({type:'event_surge',k,volRatio,dayReturn,wait,minHold:wait});
 return all;
 }
 function want(p,idx,held,entered){
  const i=idx-1; if(i<201)return null;
  const valid=(k,n)=>data[k][i].c>F[k][n].ma[i];
  if(p.type==='trend'){
   const k=symbols.indexOf(p.k);
   return valid(k,p.n)&&F[k][Math.min(p.n,120)].ret[i]>p.thresh?k:null;
  }
  if(p.type==='rotation'||p.type==='volatility_veto'){
   const n=p.rankN, maN=p.maN, candidate=symbols.map((_,k)=>({k,mom:F[k][n].ret[i],vol:F[k][20].vol[i]})).filter(x=>{
      if(!valid(x.k,maN))return false;
      return p.type==='rotation'?x.mom>p.thresh:(x.mom>0 && x.vol<p.maxVol);
   }).sort((a,b)=>b.mom-a.mom);
   return candidate[0]?.k??null;
  }
  if(p.type==='breakout'){
   const k=symbols.indexOf(p.k);
   if(held===k)return valid(k,p.exit)?k:null;
   return data[k][i].c>F[k][p.n].prevHigh[i] ?k:null;
  }
  if(p.type==='dip_reversal'){
   const k=symbols.indexOf(p.k);
   if(held===k)return idx-entered<p.wait?k:null;
   const ret=F[k][3].ret[i];return valid(k,p.maN)&&ret<p.dip?k:null;
  }
  if(p.type==='event_surge'){
   const k=symbols.indexOf(p.k);
   if(held===k)return idx-entered<p.wait?k:null;
   const v=data[k][i].v/F[k][30].avgVolume[i],r=F[k][3].ret[i];
   return v>p.volRatio && r>p.dayReturn && valid(k,60)?k:null;
  }
  if(p.type==='hold')return null;
  if(p.type==='buyhold')return symbols.indexOf(p.k);
  throw Error('Unknown '+p.type);
 }
 function sim(p,start,stop){
  let cash=initial,qty=0,held=null,entered=-1000,trades=0,fees=0,change=0,peak=initial,maxDD=0,exposureDays=0,invalid=false;
  function nav(i,isOpen){return cash+(held===null?0:qty*(isOpen?data[held][i].o:data[held][i].c));}
  for(let i=start;i<stop;i++){
    const target=want(p,i,held,entered);
    if(held!==target && i-entered>=p.minHold){
     if(held!==null){
       const gross=qty*data[held][i].o;
       if(gross<minTicket){invalid=true;break;}
       let cost=gross*(fee+slip);
       cash+=gross-cost;fees+=cost;qty=0;held=null;trades++;change++;
     }
     if(target!==null && cash>=minTicket){
       const buyCost=cash*(fee+slip)/(1+fee+slip),gross=cash-buyCost;
       if(gross>=minTicket){qty=gross/data[target][i].o;fees+=buyCost;cash=0;held=target;entered=i;trades++;change++;}
     }
    }
    if(held!==null)exposureDays++;
    let value=nav(i,false);
    peak=Math.max(peak,value);maxDD=Math.max(maxDD,(peak-value)/peak);
  }
  let exitPrice=held===null?0:data[held][stop-1].c;const netCash=cash+(held===null?0:qty*exitPrice*(1-fee-slip));
  if(held!==null){const g=qty*exitPrice;if(g<minTicket)invalid=true;fees+=g*(fee+slip);}
  return {ret:(netCash/initial-1)*100,net:netCash,drawdown:maxDD*100,fees,trades,changes:change,exposurePct:100*exposureDays/(stop-start),valid:!invalid};
 }
 const periods={train:{start:start2024,end:start2025},validation:{start:start2025,end:start2026},test:{start:start2026,end}};
 const candidates=params(),leaders={},ranking={};
 for(const p of candidates){
  const a=sim(p,periods.train.start,periods.train.end),b=sim(p,periods.validation.start,periods.validation.end);
  if(!a.valid||!b.valid)continue;
  // Minimum activity avoids no-trade strategies winning through exact zero.
  if(a.trades<2||b.trades<2)continue;
  const score=Math.min(a.ret,b.ret)+.25*(a.ret+b.ret)/2-.40*Math.max(a.drawdown,b.drawdown);
  if(!leaders[p.type]||score>leaders[p.type].score)leaders[p.type]={parameter:p,score,train:a,validation:b};
 }
 const selected=Object.entries(leaders).map(([type,obj])=>({type,...obj,test:sim(obj.parameter,periods.test.start,periods.test.end)}));
 const cash={type:'hold',test:sim({type:'hold',minHold:0},periods.test.start,periods.test.end)};
 const baselines=symbols.map(s=>({asset:s,...sim({type:'buyhold',k:s,minHold:0},periods.test.start,periods.test.end)}));
 const objective={criteria:"Prospective selected model: positive after realistic transaction costs, >=2 holdout entries/exits, beats cash and BTC baseline, <=25% max drawdown; NOT proof or guarantee",achievers:selected.filter(z=>z.test.ret>0&&z.test.ret>baselines.find(x=>x.asset==='BTC-USD').ret&&z.test.drawdown<=25&&z.test.trades>=4&&z.test.valid).map(z=>z.type)};
 return {meta:{source:"Coinbase read-only daily OHLCV 2024-01 to 2026-10, six USD spot markets",periods:Object.fromEntries(Object.entries(periods).map(([k,v])=>[k,{from:new Date(data[0][v.start].t*1000).toISOString().slice(0,10),through:new Date(data[0][v.end-1].t*1000).toISOString().slice(0,10),days:v.end-v.start}])),dataCandles:symbols.length*len,uniqueMarkets:symbols,candidates:candidates.length,selection:"train 2024 and validation 2025 combined robustness; evaluate only selected family representative on untouched 2026",startingVirtualUSD:initial,takerFeeBps:fee*10000,assumedSlipBps:slip*10000,minimumQuoteUSD:minTicket,realMoneySpent:0,execution:"next UTC daily open after signal closes, forced last-day close settlement estimation; no intrabar fills, spread feed or orders; fee schedule based on 2026 account tier and may differ historically"},objective,trainOnlySelection:ranking},selected,baselines,cash};
}
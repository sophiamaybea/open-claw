/* Micro Compound, deliberately offline: simulated prices, fills, wallets. No network or signing code. */
const round = n => Math.round(n * 1e8) / 1e8;
export function experiment({seed = 7, ticks = 360, startingUSD = 3, feeMultiplier = 1} = {}) {
  if (!(startingUSD > 0 && startingUSD <= 1000000 && ticks >= 10 && ticks <= 86400 && feeMultiplier > 0)) throw Error('Invalid experiment parameters');
  let s = seed >>> 0;
  const random = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
  const costs = {momentum: .013 * feeMultiplier, scalper: .0016 * feeMultiplier}; // per side, illustrative, not executable quotes
  const arms = ['momentum', 'scalper'];
  const makeWallet = () => ({cash: startingUSD, position: null, fees: 0, pnl: 0, trades: 0, wins: 0, losses: 0});
  const primary = makeWallet();
  const shadows = {momentum: makeWallet(), scalper: makeWallet()};
  const scores = {momentum: 0, scalper: 0}, counts = {momentum: 0, scalper: 0};
  const prices = {momentum: .004, scalper: 150};
  const history = {momentum: [], scalper: []};
  const series = [], decisions = [];
  let high = startingUSD, worstDD = 0, halted = false, lossStreak = 0;
  const nav = (w) => w.cash + (w.position ? w.position.units * prices[w.position.arm] : 0);
  function open(w, arm, tick) {
    if (w.position || halted) return false;
    const notional = w.cash * .35;
    const fee = notional * costs[arm];
    if (notional < .01 || w.cash < notional + 2 * fee) return false;
    w.cash -= notional + fee;
    w.fees += fee;
    w.position = {arm, notional, units: notional / prices[arm], entryFee: fee, at: tick};
    return true;
  }
  function close(w, tick) {
    if (!w.position) return null;
    const {arm, notional, units, entryFee} = w.position;
    const gross = units * prices[arm];
    const exitFee = gross * costs[arm];
    const profit = gross - exitFee - notional - entryFee;
    w.cash += gross - exitFee;
    w.fees += exitFee;
    w.pnl += profit;
    w.trades++;
    if (profit > 0) w.wins++; else w.losses++;
    w.position = null;
    if (w === shadows[arm]) {
      const rewardBps = Math.max(-1000, Math.min(1000, 10000 * profit / notional));
      scores[arm] = counts[arm] ? .85 * scores[arm] + .15 * rewardBps : rewardBps;
      counts[arm]++;
    }
    if (w === primary) lossStreak = profit < 0 ? lossStreak + 1 : 0;
    return {arm, profit: round(profit), tick};
  }
  for (let i = 0; i < ticks; i++) {
    // Deterministic fixture with two different synthetic market regimes.
    const regime = Math.sin(i / 31);
    const u = Math.max(1e-8, random()), v = random();
    const gaussian = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    const u2 = Math.max(1e-8, random()), v2 = random();
    const gaussian2 = Math.sqrt(-2 * Math.log(u2)) * Math.cos(2 * Math.PI * v2);
    prices.momentum *= Math.exp(.004 * regime + .013 * gaussian);
    prices.scalper *= Math.exp(.00005 * regime + .00095 * gaussian2);
    for (const a of arms) { history[a].push(prices[a]); if (history[a].length > 12) history[a].shift(); }
    for (const w of [primary, ...arms.map(a => shadows[a])]) if (w.position && i - w.position.at >= 4) close(w, i);
    const total = nav(primary);
    high = Math.max(high, total);
    worstDD = Math.max(worstDD, (high - total) / high);
    if (worstDD >= .20 || lossStreak >= 5) halted = true;
    const proposals = {};
    for (const arm of arms) {
      const h = history[arm], delta = h.length < 5 ? 0 : (h[h.length - 1] / h[h.length - 5] - 1) * 10000;
      const edge = arm === 'momentum' ? Math.max(0, delta * 1.6) : Math.max(0, -delta * 1.7);
      proposals[arm] = {edge, eligible: arm === 'momentum' ? delta > 30 && edge > 2 * costs[arm] * 10000 + 30 : delta < -8 && edge > 2 * costs[arm] * 10000 + 15};
      if (proposals[arm].eligible) open(shadows[arm], arm, i);
    }
    const available = arms.filter(a => proposals[a].eligible);
    let chosen = 'HOLD';
    if (!halted && !primary.position && available.length) {
      const explore = available.filter(a => counts[a] < 3);
      chosen = explore.length ? explore.sort((a,b)=>counts[a]-counts[b])[0] : available.sort((a,b)=>(scores[b]+proposals[b].edge-2*costs[b]*10000)-(scores[a]+proposals[a].edge-2*costs[a]*10000))[0];
      if (!explore.length && scores[chosen] + proposals[chosen].edge - 2 * costs[chosen] * 10000 <= 0) chosen = 'HOLD';
    }
    if (chosen !== 'HOLD' && open(primary, chosen, i)) decisions.push({tick: i, strategy: chosen, action: 'SIMULATED BUY', estimatedGrossEdgeBps: round(proposals[chosen].edge)});
    if (i % 6 === 0 || i === ticks - 1) series.push({minute: round(i / 6), primary: round(nav(primary)), momentum: round(nav(shadows.momentum)), scalper: round(nav(shadows.scalper))});
  }
  for (const w of [primary, ...arms.map(a=>shadows[a])]) close(w, ticks);
  series.push({minute: round(ticks / 6), primary: round(nav(primary)), momentum: round(nav(shadows.momentum)), scalper: round(nav(shadows.scalper))});
  return {mode: 'SYNTHETIC FIXTURE, PAPER ONLY', realCapital: 0, seed, ticks, startingUSD, finalUSD: round(nav(primary)), netPnL: round(nav(primary) - startingUSD), worstDrawdownPct: round(worstDD * 100), halted, fees: round(primary.fees), trades: primary.trades, scores, routerShadowObservations: counts, decisions, series, shadow: Object.fromEntries(arms.map(a=>[a, {finalUSD: round(nav(shadows[a])), netPnL: round(nav(shadows[a]) - startingUSD), trades: shadows[a].trades}]))};
}
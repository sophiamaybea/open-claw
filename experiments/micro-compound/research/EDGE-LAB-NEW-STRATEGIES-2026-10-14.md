# MICRO COMPOUND — EDGE LAB
**Research date:** 14 October 2026 • **Next generation of research hypotheses, NOT backtested results.** Never attach signing keys or trade real funds at this stage.

## What the earlier 167,184 configurations actually established
The historical sample was just 350 1-minute and 350 5-minute bars for BTC/ETH/SOL (six overlapping feeds; 2,100 bars total). Thousands of fee/momentum parameter changes are not independent evidence. The tested strategies were mostly short-horizon directional bets in a market whose user's Coinbase spot fee tier was **0.25% maker / 0.50% taker**. A taker–taker round trip needs >1% price advantage before any spread/slippage. A maker–taker round trip needs >0.75% before adverse fills. The observed strategy losses suggest the next hypothesis must change the *source of edge or decision economics*, not add more model jargon. Fees and tiers must be checked on each test date.

## The highest-value new hypotheses (prioritised for £3 paper research)

### 1. THE VETO ENGINE — predict profitable-enough opportunities, not direction
**Novelty:** A separate meta-model takes a proposed entry and predicts **whether the realised move will clear the actual round-trip cost by enough to justify execution**, using triple-barrier outcomes (profit boundary, loss boundary, expiry). HOLD is a full-fledged decision.
- Features: market regime, spread, realised volatility, signal age, volume imbalance, slippage proxy, and probable holding time; only available information at event time.
- Research references: [baobach/mlfinpy](https://github.com/baobach/mlfinpy) (triple-barrier and meta-labelling), [landtml/finlab-ml](https://github.com/landtml/finlab-ml) (CUSUM, purged cross-validation, deflated Sharpe, PBO), [online-ml/river](https://github.com/online-ml/river) (delayed online update).
- Test: Fixed legacy strategy vs fee-aware veto vs pure HOLD; chronological train/test split, nonoverlap embargo, calibrated probabilities; must **make real choices** for claims about learning, not remain frozen.
- Failure: never trading can beat losing strategies, but earning 0 is not a discovered profitable edge. Need compare selectivity and actual expected return *conditional on trades taken*.

### 2. MARKET-CLOCK INSTEAD OF WALL-CLOCK — trade only when information arrives
**Novelty:** Stop asking every minute for a decision. Use **volume, dollar and imbalance bars**, CUSUM change detection and order-book trade-pressure to sample markets when something statistically meaningful changes.
- Repos: [landtml/finlab-ml](https://github.com/landtml/finlab-ml), [nkaz001/hftbacktest](https://github.com/nkaz001/hftbacktest).
- Data: public Coinbase **level2** and trade events ([official WebSocket help](https://help.coinbase.com/en/developer-platform/websocket-feeds/advanced-trade)); can also use Binance public **data-api.binance.vision** for research ([official docs](https://github.com/binance/binance-spot-api-docs/blob/master/faqs/market_data_only.md)).
- Test: equal numbers of independent event-time and fixed-time signals, holding and roundtrip friction aligned. Event-triggered activity must not be a disguised overtrading mechanism.
- Failure: toxic order flow and abrupt reversals cause spectacular losses and latency disadvantages; 1-minute candles cannot establish queue quality.

### 3. REGIME CHANGE AND FALSE BREAKOUT ENGINE
**Novelty:** Detect a liquidity sweep/breakout *that fails*, combine it with regime-aware position vetoes, and compare to buy-the-breakout. Examples: range-break + return inside range + normalised volume and book imbalance reversal.
- Repos: [richkuo/go-trader](https://github.com/richkuo/go-trader) (liquidity_sweeps, anchored VWAP, regime_adaptive_htf, and fee-audited deprecated indicators), [ray-singh/regime-adaptive-stat-arb](https://github.com/ray-singh/regime-adaptive-stat-arb).
- Test: breakout, false breakout, anchored VWAP, volatility expansion, regime-conditioned HOLD on unseen weeks. Include timestamp-pure, next-trade execution and latency. Do NOT mix train and test to identify each regime.

### 4. CROSS-ASSET LEAD–LAG WITHOUT FALSE 'ARBITRAGE'
**Novelty:** Use an asset's temporarily unexplained movement *relative to a rolling basket*, e.g. SOL versus lagged BTC/ETH changes. Predict whether the laggard catches up. Instead of entering two legs or using UK-restricted derivative shorts, examine **spot-only long or cash** as its own strategy.
- Repos: [ray-singh/regime-adaptive-stat-arb](https://github.com/ray-singh/regime-adaptive-stat-arb), [atharvajoshi01/crypto-stat-arb](https://github.com/atharvajoshi01/crypto-stat-arb).
- Test: rolling hedge weights estimated strictly on prior days; long-only residual signals; spread/fee net; compare against plain momentum and HOLD over many weeks.
- Warning: 'cointegration' is not the same as a sustainable profit. A public crypto stat-arb repository [reports negative returns on real data](https://github.com/atharvajoshi01/crypto-stat-arb). Funding/long-short carry requires more capital, multiple legs and may involve UK-restricted crypto derivatives.

### 5. PAID-PROMOTION DETECTOR AS A NEGATIVE SIGNAL
**Novelty:** Instead of following token hype, **test whether paid boost/advertisement activity combined with rising volume but shrinking liquidity predicts pump exhaustion, non-sellability or subsequent drawdowns**. Could be valuable as a 'never buy this' veto even if it cannot identify profitable buys.
- Source: [DEX Screener public API](https://docs.dexscreener.com/api/reference) exposes token boosts, ad inventory, pair age, liquidity, volumes and transaction counts. Its [boosting docs](https://docs.dexscreener.com/boosting) acknowledge purchased boosts alter trending scores; trends are not independent organic demand.
- Repo: [openSVM/dexscreener-mcp-server](https://github.com/openSVM/dexscreener-mcp-server) for read-only tool integration.
- Test: capture *prospectively* all newly discovered pools (including failures, rugs, vanishing liquidity), timestamp source and quote freshness, compare 1h/4h/24h forward liquidity outcomes. No reconstructed survivorship-pruned history. **Paper only**; tiny accounts are acutely exposed to swap and token-account costs.

### 6. STRUCTURAL MISPRICING / INCENTIVE ANALYSER — research only under UK restrictions
**Novelty:** Verify executable payoff identities (binary YES+NO complete sets and basket constraints) with order book *depth*, settlement conversion rules and fee schedule. Separate purely mathematical 'arbitrage' from **capital-efficient protocol-executable** arbitrage.
- Academic: [Executable Arbitrage and Market Efficiency in Prediction Markets](https://arxiv.org/abs/2608.00666) (2026).
- Repo: [warproxxx/poly_data](https://github.com/warproxxx/poly_data), [warproxxx/poly-maker](https://github.com/warproxxx/poly-maker).
- **Critical:** Polymarket [officially lists GB as a blocked country](https://help.polymarket.com/en/articles/13364163-geographic-restrictions); Kalshi's [Member Agreement](https://kalshi.com/docs/kalshi-member-agreement.pdf) lists the United Kingdom as restricted. The UK forbids firms selling certain [crypto derivatives to retail customers](https://www.fca.org.uk/news/press-releases/fca-bans-sale-crypto-derivatives-retail-consumers). Do not propose any attempt to circumvent geo restrictions; research data only until location and legal eligibility independently confirmed.

## Validation architecture — how to prevent another million misleading backtests
1. **Ingest many *independent historical days* and public Level-2 market data** (not 1m + 5m copies of overlapping hours); store source, UTC, gaps, and latency. First goal >=30 distinct market days and >=3 market regimes, preferably more.
2. **Freeze a small number of hypotheses before evaluation** to prevent p-hacking; set train/test dates first, final blind holdout untouched; independent markets alone are not independent samples when correlated.
3. **Count unique signals / genuine fills / fees / out-of-sample days**, never market parameter combinations as the headline statistic.
4. **For Coinbase owner's tier**, taker+exit fees for a $3 virtual roundtrip cost roughly $0.03, before spread/slippage. Maker+taker ≈$0.0225 before slippage and queue risk. The public data connector's quote-size minimum is $1 for observed BTC/ETH/SOL spot products; a 35% ticket of a $1 portfolio can be unexecutable if <$1.
5. Stress: no order if stale feed, missing quote, spread too wide, not enough unencumbered SOL for network fees, impossible min ticket, unavailable instruments, or no credible sell path. Post-only orders should rarely be assumed filled on mere candle lows; measure queue and adverse selection on Level-2/ticks.
6. The machine-learning agent **can recommend HOLD** and needs completed outcomes to train; the research LLM may suggest new tests but must not change trade limits, model/evaluation protocol, real signing or merge privileges.

## Projects and papers (direct source links)
- Meta-labelling and triple barriers: https://github.com/baobach/mlfinpy • https://github.com/landtml/finlab-ml
- Order-book replay: https://github.com/nkaz001/hftbacktest
- Fee-audited strategy collection: https://github.com/richkuo/go-trader
- Regime adaptation: https://github.com/ray-singh/regime-adaptive-stat-arb
- Real-data stat-arb negative control: https://github.com/atharvajoshi01/crypto-stat-arb
- Token paid-promotion metadata: https://docs.dexscreener.com/api/reference
- Economic no-trade region: https://onlinelibrary.wiley.com/doi/full/10.1111/mafi.70001
- Prediction-market protocol conversion: https://arxiv.org/abs/2608.00666
- Retail execution costs: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6992598

**Deliverable status**: Ideas researched and feasibility-screened, **NOT coded, deployed or newly simulated**. Next implementation work should add read-only order-book capture, Veto Engine labelling and one proper out-of-sample 'event clock' experiment, with complete net-trade accounting, before revisiting the £3.

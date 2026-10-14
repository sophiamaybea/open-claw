# ONE-TIME X TRADING DISCOVERY — 14 October 2026
**Purpose:** Discover trading ideas/frameworks and GitHub repositories *mentioned by users on X*, then verify promising projects against their actual GitHub README. This is a **one-off research snapshot** for Micro Compound, not a live X monitor or trading recommendation.

## Method and limitations
- Searched public, search-engine-indexed X posts and public Thread Reader archives/unrolls of X threads. Some X pages do not expose post text to unauthenticated crawlers.
- Checked candidate GitHub repository existence and selected README material using connected GitHub search/fetch. **This is not an exhaustive authenticated X API scrape.** Reposts, sales pitches, duplicates and stale recommendations are common.
- **Source labels:** `X-direct` is a post with indexed readable text; `X-thread-mirror` is a public archive of a thread from X, not a direct X API response. Both are attributed; project claims and returns are **not audited**.
- Dates belong to original posts, where shown. Links to posts and source thread mirrors are evidence of discussion, *not evidence of profitable results*. Any independently added GitHub repo is explicitly marked `independent`.

## Source-by-source findings

| Source | Original post / readable thread | Trading methods identified | Repo(s) actually cited by X participant | Verification |
|---|---|---|---|---|
| **S01 @FM_yassin, 4 Jun 2026** | [X post](https://x.com/FM_yassin/status/2062562452290564395) (indexed) | Polymarket trade-data analysis, maker quoting, ML pattern mining | [warproxxx/poly_data](https://github.com/warproxxx/poly_data), [warproxxx/poly-maker](https://github.com/warproxxx/poly-maker), ambiguous `pselamy/patter…` | First two exist, GitHub READMEs examined. Exact third repo **not independently resolved**. |
| **S02 @virattt, 21 Dec 2024** | [X thread mirror](https://threadreaderapp.com/thread/1870513142981353703.html) • [original X](https://x.com/virattt/status/1870513142981353703) | Multi-agent hedge-fund-style signal gathering, portfolio/risk decision workflow | [virattt/ai-hedge-fund](https://github.com/virattt/ai-hedge-fund) | Exists. README explicitly says proof of concept, **does not make real trades**. |
| **S03 @quantscience_, 25 Jan 2025** | [X thread mirror](https://threadreaderapp.com/thread/1883198545987019013.html) • [original X](https://x.com/quantscience_/status/1883198545987019013) | Four-role market-data → quant → risk → portfolio research pipeline | [virattt/ai-hedge-fund](https://github.com/virattt/ai-hedge-fund) | Confirmed; duplicate independent recommendation of S02, not a new project. |
| **S04 @KanikaBK, 11 Apr 2026** | [X thread mirror](https://threadreaderapp.com/thread/2042919910544986401.html) • [original X](https://x.com/KanikaBK/status/2042919910544986401) | Multi-provider data ingestion rather than a trading strategy; separate prices, fundamentals and indicators | [ranaroussi/yfinance](https://github.com/ranaroussi/yfinance), [alpacahq/alpaca-py](https://github.com/alpacahq/alpaca-py), Alpha Vantage library, Twelve Data and additional providers | Main GitHub libraries identified; provider quotas and data rights **not confirmed free** by post alone. |
| **S05 @quantscience_, 30 Sep 2025** | [X thread mirror](https://threadreaderapp.com/thread/1973000959245668753.html) • [original X](https://x.com/quantscience_/status/1973000959245668753) | Research terminal / data exploration | [OpenBB](https://github.com/OpenBB-finance/OpenBB) | Known project; available functionality/data rights vary by integration. |
| **S06 @aiedge_, 5 Dec 2025** | [X thread mirror](https://threadreaderapp.com/scrolly/1996987968113004556) • [original X](https://x.com/aiedge_/status/1996987968113004556) | Polymarket AI research, social-signal evaluation, market comparison, execution tools | Refers to a Polymarket AI bot repo, `@MoonDevOnYT` repo and `@PolymarketEco` collection **without full resolvable URLs in the public unroll** | Do **not** silently equate these with unrelated GitHub repositories. Product/return claims unverified. |
| **S07 @jungle_sven, Sep 2023** | [X thread mirror](https://threadreaderapp.com/thread/1698726076212490307.html) | Volatility / standard deviation as a mean-distance signal; adaptive maker quote placement | Thread shows truncated `github.com/Jungle-Sven/st…` | Exact repo unresolved; treat approach as a **hypothesis** only. |
| **S08 @Wayne145591, 13 Jul 2025** | [X thread mirror](https://threadreaderapp.com/thread/1944386125981982962.html) | Lead–lag/latency arbitrage across exchanges, spread convergence; depth filters, quote age, inventory and fee budgets | No specific usable project established | Requiring colocation/fees/queue model means especially **poor fit for £3**. Use as negative-control scenario for simulator. |
| **S09 @quantscience_, 14 Jul 2025** | [X thread mirror](https://threadreaderapp.com/scrolly/1944788073935507860) • [original X](https://x.com/quantscience_/status/1944788073935507860) | Stock research using feature engineering, moving averages, MACD, ARIMA, GAN, XGBoost | Link truncated to `github.com/borisbanushev/…` | Precise original project not verified. Reject any implied predicted returns. |
| **S10 @pyquantnews, 23 Nov 2022** | [X thread mirror](https://threadreaderapp.com/thread/1595224661679542273.html) | Finance and risk-calculation toolkits, optional derivatives pricing | [goldmansachs/gs-quant](https://github.com/goldmansachs/gs-quant), [domokane/FinancePy](https://github.com/domokane/FinancePy), [pmorissette/ffn](https://github.com/pmorissette/ffn) and others | These are finance libraries, **not plug-and-play profitable bots**. Low relevance to £3 crypto experiment. |
| **S11 @accelxr, 2 Jul 2024** | [X thread mirror](https://threadreaderapp.com/thread/1808160938970997251.html) | Memory, planning, feedback, autonomous onchain agents, prediction-market agents and externally verifiable controls | Discusses Autonolas and other projects by name; no verified exact GitHub links in accessible text | Good architecture ideas for bounded research agents; do not enable autonomous custody. |
| **S12 @quantscience_, indexed thread collection 2026** | [X thread mirror index](https://threadreaderapp.com/user/quantscience_) | Time-series momentum, volatility/relative value, adaptive systematic workflows | No individually resolvable repository link in index | Separate social-market *method* mention; original individual post not verified. |

## What the independently verified GitHub projects do

**Most useful for Micro Compound's paper research:**
1. **[warproxxx/poly_data](https://github.com/warproxxx/poly_data)** (X S01): Polymarket trade-events / market metadata pipeline, now V2. Requires a **free Envio HyperSync API token**; older V1 data retrieval no longer complete.
2. **[warproxxx/poly-maker](https://github.com/warproxxx/poly-maker)** (X S01): Post-only maker quoting, inventory skew, real market WS, risk caps, kill switch, SQLite; `--paper` support. **Uses signer private key for live**. We should study quoting/fill safety only.
3. **[virattt/ai-hedge-fund](https://github.com/virattt/ai-hedge-fund)** (X S02/S03): Structured specialist-agent and portfolio risk-debate patterns. **Research/education; no live trades**.
4. **[ranaroussi/yfinance](https://github.com/ranaroussi/yfinance)** (X S04): Lightweight research data, not an executable exchange order book. Data licence/freshness must be evaluated.
5. **[alpacahq/alpaca-py](https://github.com/alpacahq/alpaca-py)** (X S04): Broker integration and market data, but not immediately relevant to Coinbase/Solana £3.
6. **[OpenBB](https://github.com/OpenBB-finance/OpenBB)** (X S05): Research aggregation layer; not a fast execution engine.
7. **[goldmansachs/gs-quant](https://github.com/goldmansachs/gs-quant)** (X S10): Structured risk/quant analysis, not an automated crypto profit engine.

**Independent comparison projects, NOT claimed to have been identified by these X authors:**
- **[nkaz001/hftbacktest](https://github.com/nkaz001/hftbacktest)** — priority next-step simulator reference for order-book queue/latency and maker fills.
- **[hummingbot/hummingbot](https://github.com/hummingbot/hummingbot)** — paper trading and making markets on CEX/DEX.
- **[hummingbot/condor](https://github.com/hummingbot/condor)** — agent coordination and dry-run strategies, but trading API must be isolated.
- **[freqtrade/freqtrade](https://github.com/freqtrade/freqtrade)** — CEX backtesting and FreqAI retraining.
- **[online-ml/river](https://github.com/online-ml/river)** — genuine online learning from delayed verified outcomes.
- **[ccxt/ccxt](https://github.com/ccxt/ccxt)** — markets, fees and order constraints.
- **[pmxt-dev/pmxt](https://github.com/pmxt-dev/pmxt)** — interface reference for prediction-market data and cross-venue study (verification of exact present API still needed).
- **[HKUDS/Vibe-Trading](https://github.com/HKUDS/Vibe-Trading)** — promising separate agent/shadow-account research framework, **not attributed to an X post in this sample**.

## Trade types uncovered and how to test them

| Approach seen in X material | Why people discuss it | Micro Compound experiment design | £3 suitability |
|---|---|---|---|
| **Momentum and time-series momentum** | Price acceleration may persist | Compare 1m/5m/15m momentum across fee-adjusted spot paper portfolios vs HOLD | Paper first; possible only if broker min size passes |
| **Mean reversion via deviations from VWAP/mean** | Price may oscillate around fair value | No look-ahead, run 3 volatility regimes, realistic roundtrip costs | Often no viable edge at tiny size |
| **Post-only market making** | Capture bid/ask spread and potentially rebates | Model latency, queue position, adverse selection, unfilled orders, inventory toxicity | Poor with £3 on competitive venue |
| **Lead–lag exchange arbitrage** | Quotes can diverge briefly | Timestamp quote feeds, include order latency and fee tiers; unfilled exits mandatory | **Not realistic** with £3 and free hosting |
| **Prediction-market event probability** | Compare prices to external evidence/probability | Observation-only; record market timing/news/public data and paper outcomes | Min size and fees must be checked |
| **Multi-agent decision debate** | Different research agents challenge one another | Require reproducible tool traces; compare against *no-LLM* baseline | Valuable for research, not high-frequency order execution |
| **Online self-learning** | Update signal quality from each outcome | Delayed-label River, rolling calibration/Brier, frozen HOLD champion, challenger sandbox | Cheapest/useful *paper* research pathway |
| **Sentiment-driven signal gating** | Posts may anticipate/follow market movements | Independent, time-stamped sample with spam detection and future-window outcomes | High manipulation and look-ahead risk; unproven |

## Findings, caution and next actions

1. **The strongest X-origin code discovery is `poly-maker` plus `poly_data`**, not a guaranteed-profit sniper. They expose a high-value separation of data collection, maker quotes, risk controls and fill analysis.
2. **The best agent architecture example directly recommended on X is `virattt/ai-hedge-fund`**; importantly it says it cannot execute trades.
3. "95% win rate", "free money", "50% profit" and other popular X claims are anecdotal advertising until reproduced net of spreads, fees, slippage and out-of-sample testing. Some X threads are promotional and have missing exact repository links.
4. Add three *paper-only* challenger strategies to Micro Compound: deviation/mean reversion, post-only quoting with queue-aware fills, and a prediction-market probability watcher. Compare against existing momentum/scalper and HOLD.
5. Prioritise the **£3 minimum executable ticket/fee/exit feasibility filter** before any real-money planning. Do not connect X scraping tools, untrusted GitHub code or a public Vercel dashboard directly to wallet signing.
6. This research is complete as a one-time snapshot. **No background X scraper or automation is scheduled.**

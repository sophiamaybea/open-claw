# Micro Compound: automatically explore promising signals, without promoting luck
**14 October 2026 — implemented and executed, paper only.**

## What “self-learn and keep trying” means here
- Run **13 independent paper/shadow strategy variants** on each next-day open against chronological Coinbase daily BTC/ETH/SOL/ADA/DOGE/LTC OHLCV.
- Update each strategy's evidence after its simulated position **actually exits** (not when entry looks exciting).
- Every **21 historical days** review the preceding **120 days** of shadow performance. Promising performers spawn parameter challengers; each challenger starts its **own new paper record at birth** and cannot inherit its parent's winning backtest.
- Compare net after **0.50% taker fee on each side** and **0.10% synthetic adverse slippage per side**, with $3 starting cash and $1 minimum ticket.
- Preserve and compare HOLD cash, BTC buy-and-hold and the pre-existing low-turnover rotation baseline.
- Do not connect any exchange execution endpoint, Coinbase order tool, wallet, payments or live funds.

## Actual diagnostic rounds, on historical data ALREADY used in previous Micro Compound experiments

| Variant | Adaptive paper net return (from $3) | Max simulated drawdown | Learning activity | Finding |
| --- | ---: | ---: | --- | --- |
| v0.5, performance-chasing selector | **−60.90%** | 69.11% | 4 challengers, 167 closed shadow-trade labels | Failed badly; positive trailing returns were an unreliable promotion criterion. |
| v0.6, relative-to-baseline and drawdown gates | **−37.64%** | 75.00% | 6 challengers, 194 labels | Still failed; same-window trailing outperformance was insufficient evidence. |
| **v0.7, evidence quarantine** | **+37.21%** | **55.43%** | 6 challengers, 194 labels, zero promotions | Preserved the **existing** rotation baseline, **did not improve on it**. The result is inherited baseline performance, NOT ML alpha. |
| Fixed 120/120/45 rotation comparator | **+37.21%** | 55.43% | No self-learning | Positive historical total return with unacceptable drawdowns for many users. |
| HOLD cash | 0.00% | 0.00% | None | Safest against strategy loss in this test. |

**2025 remains negative** for the baseline and conservative v0.7 (**−10.01% year segment**). Historic 2024–2026 data was previously examined and **cannot be re-labelled as unseen out-of-sample evidence**.

## Research gates in v0.7
- When historical performance looks promising, continue to **create and run paper challengers**. Record reasons and every completed simulated result.
- **Do not auto-promote** a challenger merely because a historical backtest looks great.
- After first receiving wholly **new, previously unseen sessions starting 15 Oct 2026**, require **at least 120 sessions of new evidence** and candidate outperformance versus fixed baseline in **two disjoint 60-session windows**, plus extra previous 120-day drawdown and relative-return requirements.
- This is a **paper strategy promotion gate only**, not authority to move money. It does not guarantee future profits and requires independent inspection of actual live quotes, spreads, min orders, slippage, sellability and runtime security before any money can be touched.
- Models are heuristic incremental strategy evaluators, **not a neural network retraining itself**. The separate Python research system provides optional `river` machine learning trained from delayed labels; neither has proved an economic edge.

## Reproduce
From repository root:
```sh
node --test experiments/micro-compound/tests/champion-challenger-v07.test.mjs
```
The source `experiments/micro-compound/research/champion-challenger-v07.mjs` exports `researchLoop(feeds, options)`; feed values are six versioned JSON fixtures in `research/fixtures/`.
Full evidence: `results/champion-challenger-v05.json`, `-v06.json`, `-v07.json`.

## What's intentionally not claimed
- No active cloud process has been deployed to run this research indefinitely; code executes **when run**. User previously explicitly did not want scheduling. GitHub workflow triggers on commits/pull requests or by manually dispatching, **no cron**.
- No fresh post-14-Oct-2026 data or untouched prospective holdout has been processed in this revision.
- No actual exchange fees have been paid and no real trades placed. Price-bar next-open assumption can be optimistic.
- Running until a backtest shows a profit is **not validation**; always keep independent untouched time periods before considering a strategy viable.

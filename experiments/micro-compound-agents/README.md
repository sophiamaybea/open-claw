# Micro Compound: Autonomous Paper Agent Lab

**State:** Experimental public-data agent system. No real money can be moved. This lives in the public OpenClaw repository's `main` branch, isolated from the earlier Micro Compound research feature branch.

## How it is actually run

A GitHub Actions workflow (`.github/workflows/micro-compound-paper-agents.yml`) runs immediately after this workflow is added/updated and periodically at **08, 23, 38, and 53 minutes past each hour, UTC** (every 15 minutes, subject to GitHub Actions scheduling delay or service interruptions). It also supports manual GitHub `workflow_dispatch`. It uses a free-to-read public Coinbase Exchange endpoint, *not* the user's connected Coinbase account and not an API key.

The runner requests **last ~24.5 hours of 5-minute BTC-USD, ETH-USD and SOL-USD OHLCV candles**, filters out the still-open candle, requires a valid synchronized timestamp for all three assets, and simulates new candles exactly once. A stale or missing candle causes **no fabricated fill**. The first run loads historical candles as **context only** and does not retroactively trade them.

The stateful agent engine is `core.mjs`. Eight separate paper strategies each receive **$3 hypothetical starting capital**, marked to market after a hypothetical 0.50% taker fee on each side and 0.10% slippage on each side. Orders smaller than a hypothetical $1 ticket are blocked. No short selling, leverage, wallet, account, transactions, API keys, or real trade endpoints are present.

The worker persists `state.json` and `site/latest.json` to the Git repository after every run. This keeps independent portfolio state and trade outcomes across GitHub Actions invocations. Its dashboard is read-only and fetches `site/latest.json` from the GitHub repository. **Do not add secrets or personal account values to these public files.**

## Autonomous roles

| Agent role | Implementation |
| --- | --- |
| **Watcher** | The runner collects public 5-minute candle data and checks completeness/freshness. |
| **Trend/rotation scouts** | 24/72-bar rotations, 48-bar trend, and low-volatility rotation paper portfolios. |
| **Event scouts** | Breakout, volume surge, mean reversion and flush-reversal paper portfolios. |
| **Risk gate** | Cash-only option, next-bar execution, min order size, min holding time, fixed hypothetical fees/slippage, no leverage. |
| **Learning ledger** | Every strategy updates its online win/return statistic only **after a full simulated exit**. |
| **Challenger forge** | Once a strategy has sufficient completed, prospective paper evidence and positive net trade performance, it can spawn a new parameter variant that starts with **no inherited trade record**. |
| **Evidence examiner** | A potential champion requires at least **30 days** since birth, **15 completed paper exits**, positive net results in **two non-overlapping 14-day windows** that each outperform both cash and BTC, drawdown below 15%, and extra fee stress. |
| **Champion** | Starts in cash and will only follow a promoted, paper-tested strategy. Promotion is **paper-only**, never authorises a live trade. |

**This is a heuristic incremental learner, not GPT/Claude weights being retrained, not autonomous code self-modification, and not proof of a profit edge.** The selection rules are intentionally conservative, particularly given the small account and fees.

## Status and limitations

- Initial state is `WAITING_FOR_FIRST_CLOUD_RUN`; dashboard does not invent active trades. Check GitHub Actions job status and the actual `health.status` in `site/latest.json` before claiming the agents are operational.
- GitHub scheduled jobs can run late or be skipped; this is **not** true millisecond or real-time execution.
- Public candles are not executable bid/ask quotes, and maker queue and true order fill prices cannot be recovered from these bars.
- No guarantees of profitability. Repeatedly optimising on the same data cannot substitute for forward validation on genuinely unseen market periods.
- The $3 denomination is virtual US dollars, not a claim about the user's actual £3 Coinbase balance.
- Modifications and experimental strategies are non-financial, research-only. Owner confirmation and a separate security review would be required before designing any live integration.
- If GitHub branch protection blocks automated commits, the job will visibly fail and **state persistence will not work** until repository permissions are corrected.
- If no signals succeed after 21 days, the real outcome may be no trades / loss / no winner. The system must not manufacture profitable results.

## How to check
- [Action runs](https://github.com/sophiamaybea/open-claw/actions/workflows/micro-compound-paper-agents.yml)
- [Paper ledger](https://github.com/sophiamaybea/open-claw/blob/main/experiments/micro-compound-agents/state.json)
- [Published summary](https://github.com/sophiamaybea/open-claw/blob/main/experiments/micro-compound-agents/site/latest.json)

Stop running agents: disable the scheduled workflow in GitHub Actions, or remove its `schedule` block.

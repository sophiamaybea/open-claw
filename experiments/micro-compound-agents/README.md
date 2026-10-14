# Micro Compound: Autonomous Paper Agent Lab

**State:** Experimental public-data agent system. No real money can be moved. This lives in the public OpenClaw repository's `main` branch, isolated from the earlier Micro Compound research feature branch.

## How it is actually run

A GitHub Actions workflow (`.github/workflows/micro-compound-paper-agents.yml`) runs immediately after this workflow is added/updated and periodically at **04, 09, 14, 19, 24, 29, 34, 39, 44, 49, 54 and 59 minutes past each hour UTC** (the GitHub **five-minute minimum**; the job executes five approximately one-minute paper observations). This is **best effort**, subject to cloud queue delays and interruptions. It also supports manual GitHub `workflow_dispatch`. It uses a free-to-read public Coinbase Exchange endpoint, *not* the user's connected Coinbase account and not an API key.

The runner requests **the last ~4.9 hours of 1-minute BTC-USD, ETH-USD and SOL-USD OHLCV candles**, filters out the still-open candle, requires a valid synchronized timestamp for all three assets, and simulates new candles exactly once. A stale or missing candle causes **no fabricated fill**. The first run loads historical candles as **context only** and does not retroactively trade them.

The one-minute system uses `state-minute.json` (schema v2); prior `state.json` preserves the old five-minute experiment and is not reused to fabricate mixed-granularity trading history. The stateful agent engine is `core.mjs`. Eight separate paper strategies each receive **$3 hypothetical starting capital**, marked to market after a hypothetical 0.50% taker fee on each side and 0.10% slippage on each side. Orders smaller than a hypothetical $1 ticket are blocked. No short selling, leverage, wallet, account, transactions, API keys, or real trade endpoints are present.

The worker persists `state-minute.json` and `site/latest.json` to the Git repository after each five-observation batch; thus the public website normally refreshes with new data around every five minutes even though the internal polling loop observes prices around once a minute. This keeps independent portfolio state and trade outcomes across GitHub Actions invocations. Its dashboard is read-only and fetches `site/latest.json` from the GitHub repository. **Do not add secrets or personal account values to these public files.**

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

## Dashboard deployment

The dashboard's standalone static site lives in `site/index.html` and its sibling `site/bounties.html`. GitHub Pages deployment is prepared at `.github/workflows/micro-compound-agent-pages.yml`, but initial automation could not enable Pages because the GitHub Actions token lacks repository administration permission. Owner must select **Settings → Pages → Build and deployment → Source: GitHub Actions** once, then rerun the workflow; do not claim the URL is live until deployment is successful. Vercel deployment is presently blocked by the account's free daily deployment quota. The two dashboards already read live JSON from the public repository; no secret credentials are exposed.

## Opportunity Hunter

An independent public bounty crawler lives in `bounty-hunter.mjs` and its 3-hour scheduled workflow `bounty-opportunity-hunter.yml`. It searches GitHub issues, scores candidates and records `site/bounties.json`. Any payout figure is an **unverified issue-body claim**, not an available guaranteed reward. The agent never replies, applies, signs, withdraws or pays.

# Micro Compound — repository review and autonomous-agent architecture
**Research snapshot: 14 October 2026.** This document distinguishes verified features in upstream READMEs from future design proposals. **Status: proposal for implementation, not deployed agents or live trades.** Initial exposure to real funds: **zero**.

## Executive decision

Use `experiments/micro-compound` as a *research system*, borrowing tested elements selectively:
- **OpenClaw (existing Bea deployment)** for cloud control, alerts and human approvals, *not* the millisecond execution loop.
- **Hummingbot / Condor** as the leading existing agent-to-trading-executor reference, with a security boundary between AI and trading execution; heavy for the tiny experiment.
- **Freqtrade + FreqAI** for CEX-oriented offline/paper strategy development, recurrent training and honest exchange constraints.
- **QuantDinger** for virtual portfolios, champion/challenger, Jev gate, walk-forward, holdouts and policy logging; use selected patterns, not entire infrastructure.
- **jev-trader** as a *Kuru/Monad* low-latency hot-loop/model-interface design (its default is a **mock model** and does not implement a Solana memecoin sniper).
- **River** as the exact per-observation incremental learning component (`predict_one` then, *after outcome is known*, `learn_one`).
- **CCXT** (public data first) and **DEX Screener** for separate liquid-exchange and Solana meme-coin observation planes.
- **Jesse** as optional backtesting significance and Monte Carlo research environment, with MCP and built-in ML. Not required for the lightweight runtime.
- **Cobo Agentic Wallet SDK/MCP**, already represented in private `sophiamaybea/bea-openclaw`, remains *separate*, *unfunded for this experiment*, and bound by owner-approved pacts. Never publish private credentials.

## Verified GitHub shortlist

| Priority | Repository | Proven value | Caveat / decision |
|---|---|---|---|
| P0 | https://github.com/hummingbot/hummingbot | Multi-CEX/DEX automated strategies, market making, public-data paper bot | More machinery than $3 test; do not enable live |
| P0 | https://github.com/hummingbot/condor | AI/domain agents can author and run tick strategies with dry-run; Hummingbot API + web UI | Agent access to live trading API demands hard isolation |
| P0 | https://github.com/hummingbot/hummingbot-api | Managed bots, exchange connectors and MCP; explicit API security guidance | Keep private with Tailscale, no open public control ports |
| P0 | https://github.com/freqtrade/freqtrade | Established crypto dry-run, backtests, FreqAI model retraining | Primarily CEX, not instant new Solana token detection |
| P0 | https://github.com/online-ml/river | Online ML learning one labelled observation at a time | Need outcome timestamps, sufficient samples, feature checks |
| P0 | https://github.com/jarrodwatts/jev-trader | ~300ms Monad block-driven Kuru loop, structured Jev interface, dry run | No key ⇒ mock, not actual Jev; not a Solana sniping bot |
| P0 | https://github.com/OpenByteInc/QuantDinger | Strategy evolution, virtual accounts, Jev integration, stress validation, agent/MCP | Full stack is large; avoid transplanting wholesale |
| P0 | https://github.com/ccxt/ccxt | Public exchange books/candles and exchange metadata | Minimum order sizes, market rules, API differences |
| P0 | https://github.com/CoboGlobal/cobo-agentic-wallet | Delegated signing via explicit owner-approved pacts; SDK, MCP | Cobo account/invitation/pairing required; not a free personal hot wallet |
| P1 | https://github.com/jesse-ai/jesse | Backtests, significance testing, Monte Carlo, ML, Jesse MCP | Check edition/licence/live features separately |
| P1 | https://github.com/TauricResearch/TradingAgents | Multi-role research debate, tiered providers and decision memory | Too slow/costly for per-tick execution; research agent only |
| P1 | https://github.com/langchain-ai/langgraph | Durable and stateful agent jobs, checkpoints, human oversight | Optional: existing OpenClaw orchestrator may suffice |
| P1 | https://github.com/polakowo/vectorbt | Massive batched strategy research and visualisation | Not realistic order-level live execution without custom modelling |
| P1 | https://github.com/coinbase/coinbase-advanced-py | Official Coinbase Advanced SDK including public product/order book APIs | Coinbase account, region, product limits and fees must be verified |
| P1 | https://github.com/hummingbot/gateway | DEX trade connectors, wallet gateway and mTLS design | No mainnet signing in initial build |

Do not copy third-party code without separately inspecting per-project licences and provenance. Never clone an unknown "Solana sniper bot" and paste in a seed phrase.

## Model hierarchy: capability is not tied to always-on paid frontier calls

**Never depend on Claude or GPT-6 as a live trade engine.** A consumer ChatGPT or Claude subscription does not itself grant free API use for autonomous workers. Prompts, tool scaffolds, memory and evaluation can give smaller models *better procedures* but cannot transfer proprietary model weights/intelligence.

Recommended model/router:
1. **Every observation (milliseconds–seconds):** deterministic risk/feasibility and statistical signal detectors. Compute is local and free; if feeds stop, HOLD.
2. **Every completed shadow trade:** send features to River's incremental learner, but **learn only after the labelled exit horizon** and use prequential test-then-train evaluation. Enforce rollback on degraded performance.
3. **Every 5–15 minutes (when budget remains):** cloud reasoning agent on Groq free tier, e.g. `openai/gpt-oss-120b`, or smaller `openai/gpt-oss-20b` / `qwen/qwen3.8-27b`, with tool calling, JSON schema, reasoning effort control and strict token budget. This agent proposes hypotheses/tests, never orders.
4. **On a promising candidate only:** optional Jev pre-trade typed classification *after deterministic risk*, before paper fill simulation. Jev hosted access is not guaranteed free; **do not make Jev a hard dependency**.
5. **On demand only:** a higher-end paid Claude/GPT model can audit strategy PRs and diagnostics. This is optional and should not run every minute.

Current published Groq free limits for gpt-oss: 30 RPM, 1,000 requests/day, 8,000 tokens/minute, 200,000 tokens/day per model (check live account headers). An inference call every minute is **1,440/day**, exceeding the 1,000/day limit even before considering token ceilings; free is not a 24/7 SLA. Design strict backoff on 429 and offline fallback. In 2026 GitHub Models is retired; do not plan a GitHub Models free provider.

**Distinguish:** free *software*, free-tier *inference quota*, and free always-on *compute*. They are different. GitHub Actions scheduled runs are for periodic batches and cannot be a low-latency permanent process.

## Agent organisation

```text
OpenClaw (oversight & tool registry, no custody)
│
├── Watcher [public read-only] → token discoveries, risk metadata, book snapshots
├── Microstructure [public read-only] → order book, spread, depth, trade prints
├── Momentum Lab [proposal only] → meme-momentum candidates
├── Scalp Lab [proposal only] → CEX scalping candidates
├── Router [model updates, not unrestricted code edits] → ARM or HOLD
├── Execution Research [simulation only] → cost/latency/exit model
├── Risk Sentinel [deterministic hard veto] → no trade if not viable
├── Learner [River + event log] → update after delayed ground truth
└── Challenger/Auditor [higher-reasoning LLM] → tests, PR, never direct production patch
                                 │
                                 └→ Observable dashboard + audit ledger
```

**No role can bypass Risk Sentinel.** Agents cannot access wallet seed, private signing methods, withdrawal authority, git main write credentials or live trading endpoint. Model outputs are always untrusted proposals.

For Cobo MCP, first use read-only tools for status, balances and addresses. Spending requires a narrow owner-approved pact, named chain/token/recipient/limits and separate approval. Cobo auth secrets remain only in the private runtime, never in the public `open-claw` repository.

## £3 test: venue selection

**Coinbase Advanced:** best candidate to inspect the *existing £3* using read-only API and available product-specific minimum order sizes and fees. More appropriate to research liquid assets than unlisted newly launched memes. Its API is not the same as *Coinbase Wallet*; confirm which product the £3 actually resides in. Typical maker/taker fees on tiny round trips can consume the expected edge. Public Coinbase Advanced product API allows inspection before credentials or real orders.

**Solana + Jupiter route data:** most relevant to earliest on-chain Solana-token discoveries, but £3 is poor seed capital: ATA creation can lock **0.00203928 SOL** (current documented legacy SPL reserve, refundable on successful account closure); network transaction/priority fees, DEX swap fees, impact, sellability and rug risks are material. On-chain swapping also requires SOL to pay gas and associated-account creation. Jupiter route adapter should be quote-only.

**Kraken Pro / other CEX:** evaluate only if available to this particular UK customer and if fee tier/product minimums pass. No blanket claim another exchange guarantees superior net outcomes. Assess instrument and jurisdiction restrictions, especially derivatives.

**Working decision:** prefer Coinbase Advanced for *initial read-only validation* if the £3 is held there; use separate Solana public market data for memecoin research without transferring money. Defer any real capital until more than a single lucky hour of out-of-sample paper evidence exists. Never assume exchanging £3 into a new Solana wallet is economical.

## Learning contract (avoid "self-learning" theatre)

At every event, log `observed_at`, feature vector, source, candidate, quote age, estimated fees/slippage, risk outcome, agent/model version, horizon and shadow baseline.

At `eventual_outcome_at` only, join the **true realised**/simulated exit price and update the local learner. Compare the predicted probability against frequency (Brier/calibration), P&L after fees, max drawdown, and counterfactual regret.

Evaluate challenger against fixed HOLD, always-momentum, always-scalper and greedy router. Promote only after chronological holdouts, fee/slippage/latency stress, separate shadow runs, review and CI. **Never allow an autonomous agent to edit execution permissions, spend caps, wallet secrets, or merge to main.**

## Implementation order

1. Wire **real public read-only** data adapters into existing observatory; keep its colourful constellation visual marked as synthetic until real signals replace it. Capture/replay data with provider and timestamps.
2. Add realistic pair-specific minimums, fees, filled/unfilled order states, stale quote and exit feasibility gates. Compare venue costs at £1/£3/$10/$100 fictitious capital.
3. Add River online reward learning with delayed labels, primary and shadow wallets and baselines. Add property-based invariants.
4. Add cloud model gateway (Groq free tier, deterministic fallback; provider quotas in config) for *research agent*, and Jev as an optional budget-controlled gate. Record every provider call and delay.
5. Add optional Condor/Hummingbot/CCXT connectors **read-only/paper only** behind the OpenClaw orchestration layer and dashboard.
6. Connect Coinbase or Cobo via MCP **read-only**, owner-controlled authentication in a private deployment; log which exchange/wallet and chain actually holds £3.
7. After weeks of independent stress-tested paper results, ask the owner separately whether to design *any* strictly capped, explicitly approved, non-leveraged live pilot. No automated launch based on optimistic simulations.

## Release test: done vs not yet

✅ Existing Observatory has interactive synthetic fixture dashboard and a costed toy simulator.
🟡 This document is a verified design/repository shortlist.
❌ There is currently **no deployed real-price engine, adaptive River agent, 24/7 free model SLA, Jev API credential, Coinbase read-only connection, Cobo wallet pairing, or live trading** established by this research.

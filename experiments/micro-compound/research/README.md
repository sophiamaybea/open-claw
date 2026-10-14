# Micro Compound v0.2 — Fast autonomous research, no real money

**Status 14 Oct 2026: running synthetic experiments. No live trades or wallet permissions.**

## What has been implemented

- `microcompound/agents.py`: two shadow strategies train independent online classifiers **only after trades exit**. The code predicts before training, logging Brier error for the prequential prediction. Uses `river` if installed; otherwise a transparent online logistic classifier implemented in Python.
- `LearningRouter` can use learning probabilities **only after 8 completed shadow trades for each eligible arm**. All original feasibility/risk eligibility checks remain in charge. It can HOLD. This is NOT an online general-purpose LLM and does not self-edit code.
- `research_memo()` creates a bounded independent research assessment of a sweep with no API cost. Optional `cloud_research_memo()` makes **one** external Groq API request only when `--groq-review` and `GROQ_API_KEY` are supplied. If unset, offline fallback is deterministic. No cloud requests were made for the initial experiments.
- CLI runs 108 stress experiments, with independent fixture seeds, **$1/$3/$10 virtual starting balances**, **1x/2x/5x synthetic trading cost**, and **60-minute synthetic historical horizons**. That 60-minute horizon is replayed rapidly in seconds, not one hour of live observed prices.
- Each experiment compares the new learning router to the original discounted router and **HOLD (no trading)**. The agent never moves or requests real assets.
- `tests/test_agents.py` validates timing, label leakage, fixture determinism, fallback, and real funds = zero. The original ledger tests are also included.

## Run quickly

```bash
cd experiments/micro-compound/research
python3 -m unittest discover -s tests -v
python3 -m microcompound.agents --mode sweep --seeds 12 --minutes 60 --output results
python3 -m microcompound.agents --mode fixture --minutes 60 --output results
```

Optional (not needed): `python3 -m pip install river`. If River is installed, the model switches from Python logistic fallback to River's Streaming StandardScaler + LogisticRegression. If a Groq API key is deliberately configured, pass `--groq-review`. Keep credentials outside the repository and never paste them into a chat or ticket. Cloud calls are for research critique, not live trade decisions.

## Results from the first executed stress benchmark

- **108 simulated runs** across twelve independent random seeds, three starting capital amounts, three cost multipliers.
- **0/108 ended profitable** after modelled costs; **0/108 beat HOLD**.
- **0/108 beat the legacy discounted router**. This learner did not show an incremental benefit in this fixture.
- Mean percentage outcome was about **−5.19%** across the synthetic parameter combinations.
- 5x costs often caused HOLD decisions, so average loss may *decrease* with higher costs. This is abstention, **not an improvement in fill economics**.

Those numbers describe a *fictional* price-generation process and approximate fixed fees, not actual exchange execution or any verified strategy edge. Not an investment claim. See `results/learning-summary.json` and the reproducible full snapshot `research-results.zip` available in the chat. When new market data is integrated, actual venue minimum orders, executable prices, liquidity and exits must be modelled.

## Why free 24/7 AI isn't required

In a continuous deployment, fast data/risk checks and online learning happen locally; a reasoning agent is useful only for periodic research and challenging hypotheses. Free-tier cloud inference is quota-limited, has no guaranteed uptime, and is not a reasonable dependency for high-frequency execution. Cobo/Coinbase integrations remain separate, read-only until owner-approved, and are **not connected** here.

## Remaining milestones

1. Replace synthetic fixtures with *captured, labelled, reproducible* public market history. Coinbase/Kraken public tickers alone are not executable order books; memecoin discovery feeds are not guaranteed sellable prices.
2. Add per-venue exchange minimums and realistic ask/bid book replay, gas and liquidity impact.
3. Add true walk-forward and blind holdout evaluation with multiple market regimes; only then consider training parameter promotion. No automatic production code editing.
4. Add optional provider adapters (Jev, GPT-OSS via Groq) after deterministic gates, only if empirical improvement exceeds costs and inference latency.
5. Inspect owner-controlled wallet and MCP **read-only**. Do not fund or enable live execution until a separate explicit approval and security review.

This experiment does **not** contain a method that can sign or submit mainnet trades. Under no condition should private keys or API credentials be committed to this public repository.

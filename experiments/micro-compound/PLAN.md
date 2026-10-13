# Micro Compound: execution plan

## Decision: Build an honest research instrument, not a profit-making claim

The question is whether a $3 **virtual** wallet can outperform HOLD after fee, liquidity, latency and risk stresses. Successful abstention is allowed. Preserve an immutable original test seed, failed runs and the HOLD benchmark.

## Phase 0 — runnable baseline (this repository, v0.1)

**Done**: no key/real-money capabilities, fixture replay, read-only public snapshots, two strategy rules, isolated shadow wallets, a conservative adaptive score baseline, configurable synthetic costs, finite experiments, JSON report/dashboard, deterministic unit/invariant checks, Actions/Pages templates.

**Pass**: `python -m unittest discover -s tests -v` and `python -m microcompound fixture --minutes 60` succeed locally. Explicitly publish data provenance and incomplete fidelity.

## Phase 1 — trustworthy research data

- Standardised `MarketEvent` schema with UTC event time, observation time, source, raw payload and SHA256.
- Captured reproducible historical order-book/trade series for liquid pairs, unmodified event files, clock sync and missing-data policy.
- Pool-specific Solana discovery records: actual mint, pair ID, age, pool depth, flow concentration and program restrictions.
- Strict separation between discovery-only DEX Screener signals and executable quotes; no fabricated historical order books.

**Pass**: Replay identical byte streams to identical positions, costs, NAV and events, including missing/stale-data tests.

## Phase 2 — fill feasibility before algorithmic sophistication

- Actual min-notional/min-quantity checks on CEX public markets, level-by-level book fills, exchange fee tiers, quote staleness and simulated latency.
- Solana bidirectional **read-only** route check when a quote provider is available; unknown sellability => HOLD.
- Account reserves, transaction+priority fees, rent lock/release, token transfer-fee extensions, failed transaction charging.
- Independently audited local on-chain test harnesses (LiteSVM first, then Anvil) with **disposable local keys only**.

**Pass**: Net-ledger conservation, no future fills, no executable-price improvements without evidence, no negative free balance. Stress 2x and 5x costs.

## Phase 3 — router validity

- Full event log (append-only JSONL, SQLite projections), portfolio snapshots and delayed reward joins.
- Baselines: HOLD, always momentum, always scalp, cost-greedy router, contextual discounted Thompson sampling.
- Keep independent shadow strategies but annotate why shadow results are *not* true market counterfactuals.
- Walk-forward splits with embargoed blind holdout, block bootstrap, cherry-pick prevention and router regret dashboards.

**Pass**: Router must beat baselines across held-out regimes and stress cases; otherwise HOLD or revert to the simpler router.

## Phase 4 — optional intelligence, never the authority

- Typed `DecisionGate` interface, deterministic fallback and optional Jev provider behind credentials held outside the repo.
- Fail closed for entries. Exits must not depend on model availability.
- Log model output, latency, confidence, realisation, Brier score, calibration reliability and outage rate.
- Promote challengers only through reviewable pull requests and CI; never let automated learning rewrite risk limits.

**Pass**: Jev adds measurable, out-of-sample net value over deterministic-only control, including provider cost and latency. Otherwise disabled.

## Phase 5 — public verifiable reporting

- Public-safe sanitised run bundles: commit/config/data hash, market provenance, net P&L, rejections, failure counts, drawdown and held-out statistics.
- Dashboard clearly separates fixture vs sampled public vs order-book replay and displays HOLD baseline, cost sensitivity and confidence intervals.
- CI verifies code security boundary, regression datasets and data-lineage checks.

**Pass**: Every headline result is reproducible from a published snapshot set and a git commit. Successful and unsuccessful runs displayed together.

## Later and separate: independent real wallet

A production self-custodial wallet is out of scope for research-only version 1. If later requested, design a **separate** locally encrypted client, audited libraries, signed release chain, offline recovery and explicit chain/fee education, with no sharing of seeds with the research server. It must not silently make the simulator capable of real-money orders.

## Immediate deployment truth

The source code is packaged locally and GitHub workflows are supplied. Publishing requires a GitHub repository and Pages activation by an authorised account. A source archive alone is **not** a deployed or scheduled service.
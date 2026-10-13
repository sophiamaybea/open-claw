# Micro Compound

**£0 real capital | $3 starting virtual capital | No live orders | No external wallet**

This is a **working v0.1 research prototype**, not a profitable trading bot. It compares (1) a momentum strategy on a memecoin-like feed and (2) a short-horizon scalper on SOL/USDT. A discounted-score router selects between eligible candidates, both arms run separately in shadow wallets, simulated fees/slippage are deducted from entry/exit, and results are exported to a static dashboard.

## Start in less than a minute (Python 3.11+)

```sh
python -m microcompound doctor
python -m unittest discover -s tests -v
python -m microcompound fixture --minutes 60
python -m http.server 8000 --directory site
```

Open `http://localhost:8000`. The offline fixture is a **synthetic 60-minute path**, not 60 minutes of real trading observations. If all the trades lose money, that is a valid experiment result.

Optional **read-only** sampling from public APIs (requires Internet access and can fail due to geoblocking/rate limits):

```sh
python -m microcompound public --ticks 12 --poll-seconds 5
```

This is only twelve sampled observations, **not high-fidelity scalping backtesting**. The DEX Screener query selects a public Solana-related pool but maps its price to a generic `DEMO-MEME/USDC` internal symbol. Liquidity and buyer/seller counts are coarse risk proxies, **not executable reverse quotes or sale guarantees**. If an API fails, the app reports it instead of inventing a fill.

## Publish via GitHub Actions + Pages

1. Create a new **public** GitHub repository called `micro-compound`.
2. Upload this repository's contents including `.github/workflows` and `site/`. Set the repository's Pages source to **GitHub Actions** under Settings → Pages.
3. Open Actions → **Publish research dashboard** → **Run workflow**. The workflow exports a deterministic offline simulation and publishes `site/` to a Pages URL. It does **not** continuously trade. Scheduled repeats are requested every six hours but GitHub scheduling can be delayed, disabled or unavailable.
4. For a separate read-only experiment, run Actions → **Optional read-only market sampling**. Its JSON report is kept as a workflow artifact, **not automatically put on the public Pages site**.

GitHub's Pages/Actions service is subject to account/plan/usage limits and GitHub policies; this is intended for free-tier eligible repositories and usage, not a promise of indefinite free infrastructure.

## Features actually implemented

- Synthetic $3 wallet ledger with separate primary/momentum/scalper balances; no keypairs and no custody.
- Non-executable entry/exit fills with configurable all-in cost proxies and forced close at experiment end.
- At most one primary position; position limit, drawdown and loss-streak circuit breakers.
- Deterministic strategy proposals from recent price movements; liquidity proxy for memecoin arm.
- Discounts learned from **realised simulated** shadow P&L, with simple exploration of under-observed arms.
- Appendable JSON report and recent decision log, standalone white-background interactive SVG dashboard.
- Self-contained Python standard library, deterministic tests, GitHub CI, optional read-only price collection.

## Not yet implemented (do not mistake research architecture for code)

- Exchange minimum order sizes, real order-book book walking, quote timestamps/latency to executable fill, accurate memecoin reverse sell routing/honeypot detection, swap/token-account rent, chain fee conversion.
- Typed Jev model provider, Jupiter Swap V2 read-only adapter, Solana LiteSVM and Ethereum Anvil integration.
- SQLite event sourcing, compressed full raw market snapshots, a real contextual Thompson sampler, calibrated model probabilities, out-of-sample validation and formal router regret.
- Any real blockchain wallet, real token holdings, signing keys, seed phrase or live order execution.

## Security boundary

This repository cannot send trades by design. There are no market order placement methods, credentials, blockchain signing dependencies or exchange wallet connections. A **real independent crypto wallet** is an entirely different product from a zero-money synthetic ledger. Its cryptographic key custody, chain support, audits, recovery process and operational security must be designed and reviewed separately. **Never put private keys or mnemonics in a GitHub repository, AI prompt, GitHub Actions secret, dashboard or server.**

## Development roadmap

See [`PLAN.md`](PLAN.md) for prioritised work with acceptance criteria. See [`SECURITY.md`](SECURITY.md) for threat model and data limitations.

## Disclaimer

For research and education. Data feeds and cost models can be inaccurate; simulated results are not evidence of actual trading profitability. No financial advice or actual trade capabilities are provided.
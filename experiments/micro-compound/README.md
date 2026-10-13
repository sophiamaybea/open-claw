# Micro Compound // Observatory

**Status: working synthetic research simulator; no real trading.**

This is the public OpenClaw monorepo experiment at `experiments/micro-compound/`. Its dashboard has been rebuilt in the style of a dense, dark trading observatory, inspired by the user's reference screenshots (not a copy of third-party code).

## Launch

```sh
cd experiments/micro-compound
python3 -m http.server 8000
```

Open `http://localhost:8000`. No API keys, exchange account, external wallet or real cryptocurrency is needed. For a full offline / file:// preview, use the stand-alone downloadable HTML provided in the chat, which bundles the engine into the page. The GitHub source `index.html` imports `engine.mjs` and should be served over HTTP.

## Working features

- Animated central signal constellation and topology radar, explicitly decorative, not on-chain telemetry
- Terminal-style decision trace drawn from the deterministic fixture engine
- Virtual $3 default initial NAV, with changing balance, net profit/loss and drawdown
- Memecoin-like momentum and liquid-market scalping **synthetic** strategy comparisons with separate shadow wallets
- Synthetic execution-cost accounting and basic safety circuit breaker
- Interactive start capital, random seed, cost stress and time-horizon controls
- Replay/pause, time scrub, interactive equity chart and JSON report export
- Responsive layout tested for desktop, iPad and narrow mobile screens
- Experimental local Ed25519 key-vault page (`wallet.html`): **do not fund, do not treat as audited or supported**.

## Validation

```sh
node --test experiments/micro-compound/tests/*.test.mjs
```

Five deterministic tests passed locally; the GitHub Actions CI workflow remains in `.github/workflows/micro-compound-ci.yml`. Browser-tested using Chromium and screenshots at desktop, tablet and phone widths, including new-run and replay controls. GitHub checks should be reviewed before merging.

## Safety and scientific integrity

No real wallet is connected, no live orders can be sent, and nothing is signed or broadcast to any public blockchain. Prices, costs, scores, transactions and results are all derived from deterministic synthetic market fixtures. The visual constellation is not evidence of AI agents or trading performance; the six cards stand for software research stages.

Real-world microcap feasibility, sellability proofs, latency-aware executable quotes, Jev, on-chain Solana and EVM sandbox settlement, proper contextual Thompson sampling, public data ingestion and statistical validation are **not yet implemented in this browser simulator**. The router is a simple performance-weighted baseline, not a trained or production-grade AI model.

Your earlier wallet integration was found separately in the private `sophiamaybea/bea-openclaw` repository. Nothing from that wallet, including addresses and secrets, is imported into this experiment.

See `PLAN.md`, `SECURITY.md` and `THIRD_PARTY.md` for future research and limitations. No guarantee or implication of real-world profit is made.

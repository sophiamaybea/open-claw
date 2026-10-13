# Micro Compound (public OpenClaw research experiment)

**Status: running synthetic simulation prototype. Zero real capital.**

This folder contains a standalone white-background research dashboard in [index.html](index.html) and a deterministic JavaScript simulation engine in [engine.mjs](engine.mjs). It tests a fictional $3 starting portfolio using two synthetic strategy arms (memecoin-like momentum and liquid-market scalping), with independent shadow wallets, entry/exit cost deductions, simple performance-based routing, a drawdown circuit breaker and forced closing. Results are synthetic. There is no live price feed or executable trade engine in this browser version.

## Use

Serve the folder over HTTP (ES modules may be blocked on file:// URLs):

```bash
cd experiments/micro-compound
python3 -m http.server 8000
```

Then open http://localhost:8000. Click **Run experiment** and change the virtual starting balance or cost multiplier. No credentials, funds, RPC provider or wallet apps are needed.

## Tests

```bash
node --test experiments/micro-compound/tests/*.test.mjs
```

A GitHub Actions workflow runs these tests without any secrets.

## The earlier wallet

The existing *Cobo Agentic Wallet* integration was located in the separate **private** `sophiamaybea/bea-openclaw` repository, under `bin/bea-wallet`. It exposes read-only address/balance commands and requires a paired, owner-approved environment for financial actions. The public experiment neither has access to the associated keys nor attempts to move funds. Repository code cannot verify whether that wallet is currently paired, has an address or holds assets.

We do not generate private keys inside ChatGPT, push secrets to GitHub or accept a payment address allegedly owned by an AI assistant. A separate experimental key-vault prototype may be developed, but it must not be funded before a security review.

## Boundaries

No real wallet, custody, network transaction submission, Jev inference, Jupiter quote engine, LiteSVM/Anvil settlement, real exchange order-book execution, or actual $3 real-money trading is included. The assumptions in this prototype must not be treated as evidence of a profitable live strategy. The simulated cost factors are approximate parameters, not executable quotes. The full Python v0.1 package was delivered separately as a ChatGPT download and is not yet mirrored in this folder.

See [PLAN.md](PLAN.md), [SECURITY.md](SECURITY.md), and [THIRD_PARTY.md](THIRD_PARTY.md) for future research and limitations.

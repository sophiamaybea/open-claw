# OpenClaw Bounty Mathematics & Compute Status — 22 October 2026

## Execution truth

| Component | Current status |
|---|---|
| Base44 Bounty Intelligence `/math` | **Implemented**, build/lint/deno-check passed; requires signed-in end-user smoke test |
| Base44 `bounty-math` server function | **Implemented** with Math.js v15.2.0, installed in app; exact fraction calculations, bounded portfolio optimisation and whitelisted symbolic algebra |
| Seventh Base44 agent `mathematics_analyst` | **Installed** and granted `bounty-math` tool. Director and Hunter also granted this tool |
| Wolfram | **Used for independent numerical reference checks** only; no automated Wolfram API entitlement/credential in Base44 |
| SymPy Python mathematics service | **Implemented and locally executed**, 8/8 unit tests and HTTP smoke test passed, including response 27.0 USD per hour for synthetic assumptions |
| Render deployment | **BLOCKED**. The connected account returned HTTP 402, “Payment information is required”; no Render service was created and no charge has been incurred by us |
| Supabase isolated ledger | **Schema created and verified** in existing project `supabase-pink-lamp`, schema `openclaw_bounty`, with four tables, RLS enabled and no anon/authenticated schema/table access |
| Supabase ingestion | **Not connected** to Base44 or OpenClaw yet; requires a secure server-only credential, no browser exposure |
| Jev-compatible alternative Laya | **Verified upstream open-source candidate, not installed or running**. Requires separate adequate CPU/GPU hosting; it is a probability/typed-decision model, not an algebra system |
| Official OpenClaw runtime | Not newly deployed. Source-only read-only Gateway bridge passed 5/5 adapter tests; the isolated research-only Gateway still needs hosting and credentials |

## Real maths and model responsibilities

1. **Math.js** is operating inside Base44 as a calculation tool for expected net value/hours, bounded optimal scheduling (<=15 candidates), and algebraic simplification/derivatives. Inputs are user-supplied hypothetical probabilities, not purported predictions.
2. **SymPy** independently implements exact rational expected value, posterior probability from verified historical labels, a bounded portfolio solver and symbolic calculations. This is tested and ready to deploy as the Render service after billing setup.
3. **Wolfram** checked the synthetic benchmark: expected net returns `{135,111,122.5}`, expected net hourly `{27,37,10.2083333}`. These are examples only, not actual bounty revenue.
4. **Laya** ([GitHub](https://github.com/NandhaKishorM/laya), open-weight Apache-2.0) is an optional Jev-style fast decision model. It does not perform correct symbolic arithmetic. A 421M-parameter model with ~0.8GB weights is not a sensible fit for a Render free 512MB instance; it needs separate hosting and local benchmark validation before scores could be used.
5. **Supabase** stores no keys or personal content from this integration yet. It has four isolated service-only tables `opportunities`, `math_evaluations`, `research_jobs`, `audit_events`. Policy is **default deny** for browser roles.

## Render deployment blocker

Request made to create `openclaw-bounty-math`, runtime Python, plan `free`, region `frankfurt`, repository `sophiamaybea/open-claw`, build/test command:

```
pip install -r packages/bounty-math/requirements.txt && cd packages/bounty-math && python -m unittest discover -s tests -v
```

Start command:

```
cd packages/bounty-math && python -u server.py
```

Render returned `402 Payment information is required` before creating the service. `render-bounty-math.yaml` is committed as a ready-to-review deployment blueprint. Add billing information in your Render dashboard to unblock the service; do not assume a card will lead to charges without verifying the plan and quotas. Using the public HTTP maths API for confidential bounty business data requires adding authentication first. The Base44 internal maths path already avoids this exposure.

## Credentials and security

Do **not** connect inbound Base44 to privileged `bea-openclaw` (mail/wallet) operator Gateway. Provision an independent locked-down research-only instance and use the adapter at `integrations/base44-bounty-bridge`. No payout processing, auto-submissions, mining private accounts, exploit execution or wallet transactions are enabled.

Maths run records are private Base44 `BountyMathRun` entities. Cross-platform synchronisation into the Supabase tables needs explicit server-side secrets, safeguards and integration tests.

## Restore and testing

Base44 app ID `6ad0b61f7040782493fb36b8`. Commands validated: `npm run lint`, `npm run build`, `deno check base44/functions/bounty-math/entry.ts`, standalone SymPy suite with 8 tests, and HTTP smoke response `/v1/score`.

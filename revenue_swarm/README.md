# OpenClaw Revenue Swarm v2

This is a second OpenClaw swarm focused on **legitimate paid problems**. It is deliberately
different from the v0.1 self-training loop: introspective confidence is not treated as learning.

## Swarm

All workers are generalists, but each begins with a different search bias:

- **Atlas** — boring maintenance, docs, migrations, compatibility and cleanup
- **Ada** — Python, algorithms, ML and mathematics
- **Curie** — data, statistics, research and science
- **Turing** — debugging, regression tests and software bounties
- **Faraday** — performance, optimisation and engineering
- **Sagan** — red-team reviewer that attacks weak assumptions and bad opportunity signals

They share one queue and one evidence ledger. A worker can take work discovered by another.

## Cycle

`DISCOVER -> QUALIFY -> INSPECT -> SOLVE -> VERIFY -> SUBMIT -> OUTCOME -> REFLECT -> LEARN`

The currently automated code covers discovery, qualification, queue reflection and evidence
storage. Solving/submission is only allowed after the relevant toolchain and target rules are
verified.

### Learning rule

A strategy is not promoted because a model says it did well. Learning is based on external
outcomes:

- tests/validators pass
- target maintainer accepts the work
- bounty report is accepted
- payout is actually verified
- rejection, invalid scope and failed validation count negatively

Use `scripts/record_revenue_outcome.py` to record outcomes.

## Safety / commercial discipline

- Security work is disabled by default and must have explicit authorised scope.
- No autonomous spending or investing.
- No professional impersonation or eligibility bypass.
- No spam submissions.
- A listed reward is **not revenue**. Revenue remains zero until `PAYOUT_VERIFIED`.
- Self-modification proposals are experiments first. Promotion needs baseline comparison.

## Running

```bash
python scripts/run_revenue_swarm.py
pytest -q tests/test_revenue_swarm.py
```

In GitHub Actions the discovery cycle is scheduled hourly. State is uploaded as an artifact so
runs remain inspectable; durable outcome learning should be written back through the Project
Brain / approved persistence layer.

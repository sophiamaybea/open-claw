# OpenClaw Supabase Memory

Last updated: 2026-09-25

## Status

WORKING for the GitHub Revenue Bee memory layer.

Connected Supabase project: `supabase-pink-lamp`.
OpenClaw data is isolated from the existing application tables inside a private schema:

`openclaw_memory`

## Security boundary

- The schema is separate from `public`.
- `public`, `anon`, and `authenticated` have no schema/table privileges.
- RLS is enabled on every OpenClaw table as defence in depth.
- No permissive RLS policies currently exist.
- `service_role` is the intended server-side writer/reader.
- Do not expose service-role/secret credentials to browser clients.
- Do not add `openclaw_memory` to exposed Data API schemas without a separate security review.

## Tables

- `bee_runs`: one record per swarm cycle.
- `repositories`: repository-level intelligence and metadata.
- `opportunities`: deduplicated explicit and inferred economic opportunities.
- `evidence`: provenance-linked observations supporting opportunity records.
- `predictions`: expected acceptance/payment/effort/value before execution.
- `outcomes`: verified acceptance, rejection, effort and payout outcomes.
- `learnings`: behaviour-changing heuristics, negative signals, capability gaps and skill upgrades.

## First stored cycle

The first persisted revenue cycle includes:
- BCPathway/bc-forge funded contributor cluster;
- TheJustinSunPrize/awards formal-verification opportunity;
- Mantitup-Org/vista issue #61 as a negative payout-ambiguity example;
- the rule that merged work does not imply payment;
- source-provenance classification before economic scoring;
- Skill Bee curriculum signals around CI, testing, compliance, release automation, coverage, docs, benchmarking and traceability;
- Lean/formal verification as a watch-list capability rather than verified near-term revenue.

## Storage authority

Supabase is the machine-memory layer for rapidly changing structured state.
GitHub remains version-controlled operational truth for schemas, strategy and code.
Google Drive remains the human-readable institutional Project Brain.

## Required write discipline

Every durable opportunity should carry:
- source/provenance;
- observation time;
- explicit reward vs inferred commercial value;
- confidence;
- current status;
- last verification time;
- acceptance/payment prediction;
- verified outcome when available.

Never convert a discovered reward into realised revenue until payout evidence exists.

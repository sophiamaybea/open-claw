# OpenClaw Repository Policy

_Last updated: 2026-09-25_

## Default rule

**Do not create a new repository merely because a new OpenClaw concept has a new name.**

OpenClaw is one system. New work should default to the canonical `sophiamaybea/open-claw` repository as an app, package, module, tool, experiment, document or branch.

## A separate repository must earn its existence

Create or retain a separate repository only when at least one is true:

1. **Security boundary** — materially different access controls are required.
2. **Independent product/distribution** — the component is genuinely released independently.
3. **Independent deployment boundary** — it must be versioned and operated separately for a concrete technical reason.
4. **External/fork provenance** — third-party or fork history/licence should remain distinct.

"Different idea", "different agent", "different dashboard", "different experiment" and "might be useful later" are not sufficient reasons.

## Preferred locations

- `apps/` — user-facing applications and control surfaces.
- `packages/` — reusable runtime libraries and domain modules.
- `tools/` — deterministic utilities and CLIs.
- `experiments/` — active experiments that have not earned permanent architecture.
- `archive/legacy/` — preserved predecessor work that is no longer authoritative.
- `docs/` — architecture, decisions and policy.
- `project-brain/` — version-controlled mirror of canonical project memory.

## Intended active OpenClaw repository set

- **`sophiamaybea/open-claw`** — canonical public core, HIVE and public project knowledge.
- **`sophiamaybea/bea-openclaw`** — private operational boundary for privileged mail/wallet/deployment material.
- **`sophiamaybea/octominer`** — private specialist opportunity-mining package retained while independently useful.

Other old OpenClaw-labelled repositories are legacy/migrated unless explicitly reactivated.

## Safety rule

Never reduce repository count by moving private information into a public repository. Consolidation must preserve or improve access boundaries.

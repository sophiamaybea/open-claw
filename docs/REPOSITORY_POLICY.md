# OpenClaw Repository Policy

_Last updated: 2026-09-25_

## Default rule

**Do not create a new repository merely because a new OpenClaw concept has a new name.**

OpenClaw is one system with explicit privacy/security boundaries. New work must first be routed into an existing repository.

## Existing active boundaries

- **`sophiamaybea/bea-agent-core`** — primary private engineering/control plane. Default home for private engineering, internal memory, orchestration and control-plane work.
- **`sophiamaybea/open-claw`** — canonical public monorepo. Default home for public-safe code, HIVE/control surfaces, reusable public packages and sanitised public documentation.
- **`sophiamaybea/bea-openclaw`** — private operational/deployment boundary for privileged mail, wallet and runtime operations.
- **`sophiamaybea/octominer`** — private specialist opportunity-mining package retained while it remains independently useful/testable.

## A separate repository must earn its existence

Create or retain another repository only when at least one is true:

1. **Security boundary** — materially different access controls are required.
2. **Independent product/distribution** — the component is genuinely released independently.
3. **Independent deployment boundary** — it must be versioned and operated separately for a concrete technical reason.
4. **External/fork provenance** — third-party or fork history/licence should remain distinct.

"Different idea", "different agent", "different dashboard", "different experiment" and "might be useful later" are not sufficient reasons.

## Safety rule

Never reduce repository count by moving private information into a public repository. Consolidation must preserve or improve access boundaries.

## Future creation gate

Before any OpenClaw repository is created, record:
- why none of the active repositories is suitable;
- the exact security/deployment/distribution/provenance boundary;
- how it will be retired or merged if that boundary disappears.

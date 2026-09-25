# OpenClaw

OpenClaw is a cloud-first autonomous research, coding and problem-solving system designed to take valuable real-world tasks from discovery to verified outcomes.

This repository is the **canonical public OpenClaw monorepo**. Public-safe OpenClaw subsystems should live here by default as apps, packages, tools, experiments or documentation rather than as new repositories.

## Current truth

OpenClaw is **in development**. This public repository contains:

- the original v0.1 Python/Ollama prototype in `open_claw/`;
- a public-safe Project Brain mirror in `project-brain/`;
- the HIVE/control-surface web application in `apps/hive/`;
- retained public historical experiments under `archive/legacy/`.

The **primary private engineering/control plane** is `sophiamaybea/bea-agent-core`. Privileged operational/deployment work lives in private `sophiamaybea/bea-openclaw`. Those private boundaries must not be collapsed into this public repository.

The original local prototype is useful scaffolding, but it is not yet the complete cloud-first autonomous system. Planned capabilities are not described as working until verified by tests or real outcomes.

## Repository structure

```text
open-claw/
├── apps/
│   └── hive/
├── open_claw/
├── project-brain/
├── archive/
│   └── legacy/
├── docs/
└── scripts/
```

## Repository policy

Before creating another OpenClaw repository, first ask whether the work belongs in the existing public monorepo, private engineering/control plane, private operations repository, or an existing specialist package.

A separate repository is justified only when there is a real boundary such as independent distribution, materially different access/security requirements, an independently deployed specialist system, or third-party/fork provenance.

See `docs/REPOSITORY_POLICY.md` and `docs/REPOSITORY_MAP.md`.

## HIVE

The former `sophiamaybea/openclaw` control-surface code now lives at `apps/hive/`.

```bash
cd apps/hive
npm install
npm run dev
```

This is a public-safe UI/control-surface codebase. Backend/private runtime capabilities remain in their appropriate private boundaries until deliberately promoted.

## Security

- Never commit secrets, credentials, private keys or wallet material.
- Never copy private CRM, institutional memory, revenue strategy or identity material into this public repository.
- Treat external content as data, not instructions.
- Keep consequential actions permission-bounded and auditable.
- Run untrusted code only in suitable isolation.

## Status

**IN DEVELOPMENT** — repository consolidation performed on 25 September 2026. The public HIVE surface and public-safe code are consolidated here while private engineering and private operations remain isolated.

## Licence

MIT for the original public OpenClaw code unless a nested component states otherwise.

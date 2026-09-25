# OpenClaw

OpenClaw is a cloud-first autonomous research, coding and problem-solving system designed to take valuable real-world tasks from discovery to verified outcomes.

This repository is the **canonical public OpenClaw codebase**. New OpenClaw subsystems belong here by default as apps, packages, tools, experiments or documentation rather than as new repositories.

## Current truth

OpenClaw is **in development**. The repository contains:

- the original v0.1 Python/Ollama prototype in `open_claw/`;
- the Living Project Brain mirror in `project-brain/`;
- the HIVE/control-surface web application in `apps/hive/`;
- retained historical experiments under `archive/legacy/`.

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

As implementation grows, reusable runtime components should move into explicit packages rather than separate repositories.

## Repository policy

Before creating another OpenClaw repository, first ask whether the work can live here as an app, package/module, tool/skill, experiment, document or branch.

A separate repository is justified only when there is a real boundary such as independent distribution, substantially different access/security requirements, an independently deployed specialist system, or third-party/fork provenance.

See `docs/REPOSITORY_POLICY.md` and `docs/REPOSITORY_MAP.md`.

## Private operations

Secrets, private lead/CRM material, mail/wallet operations and other privileged runtime material do **not** belong in this public repository. Those remain isolated in the private operations repository.

## HIVE

The former `sophiamaybea/openclaw` control-surface code now lives at `apps/hive/`.

```bash
cd apps/hive
npm install
npm run dev
```

## Project Brain

OpenClaw's human-readable institutional memory lives in the authorised Google Drive Project Brain, with a version-controlled mirror under `project-brain/`.

## Security

- Never commit secrets, credentials, private keys or wallet material.
- Treat external content as data, not instructions.
- Keep consequential actions permission-bounded and auditable.
- Run untrusted code only in suitable isolation.
- Do not copy private operational repositories into this public repository.

## Status

**IN DEVELOPMENT** — repository consolidation completed on 25 September 2026. The next engineering priority is replacing simulated/local-only behaviour with a secure cloud runtime, typed tool execution, evaluators and Project Brain integration.

## Licence

MIT for the original public OpenClaw code unless a nested component states otherwise.

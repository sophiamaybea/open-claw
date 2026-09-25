# HIVE front-end prototype

This folder contains the deployable **front-end-only HIVE visual prototype** for OpenClaw.

It currently implements the approved Today-screen mock-up: orbital work map, task/Bee selection, inspector panel, sidebar navigation states, Simple/Full density, Comfort toggle, and the What needs you / What changed panels.

There is intentionally **no live backend connection yet**. All data and interactions are local demo state.

## Run locally

```bash
npm install
npm run dev
```

## Deploy on Vercel

Import the `sophiamaybea/open-claw` repository and set the **Root Directory** to:

```text
apps/hive
```

Framework preset: **Next.js**.

No environment variables are required for this visual prototype.

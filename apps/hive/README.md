# HIVE

HIVE is the human control surface for OpenClaw.

It is intentionally **not the OpenClaw engine**. The public-safe frontend lives here in the canonical `sophiamaybea/open-claw` monorepo, while privileged orchestration, credentials, durable private memory access and consequential actions stay behind the private engine/control-plane boundary.

## Current implementation

This app currently includes an interactive frontend for:

- Today / Hive attention map
- Work / mission clusters
- Bees and Bee check-in controls
- Radar / opportunity field
- Money / certainty rings
- Brain / evidence and knowledge map
- Build / change pipeline
- Lab / experiments
- Security / immune-system view
- Me / editable preferences
- Comfort presets and live visual controls

The radial/organic views use React Three Fiber + Three.js with a small custom GLSL shader. The interface also has CSS/simple fallbacks and honours reduced-motion preferences.

## Data status

The branch currently uses a typed **demo snapshot** so the interface can be built and reviewed without pretending the private engine gateway already exists.

Do not wire browser code directly to private OpenClaw memory.

The intended flow is:

```text
HIVE browser
   ↓
Next.js server/BFF
   ↓ authenticated, permission-bounded requests
private OpenClaw engine
   ↓
OpenClaw operational memory / tools / audit trail
```

The browser should receive only the safe projection needed for the current screen. Privileged credentials, private memory roles, service credentials and wallet authority never belong in the client bundle.

See `docs/ARCHITECTURE.md` and `lib/engine-contract.ts`.

## Accessibility defaults

HIVE is designed around progressive disclosure and forgiving interaction:

- no critical hover-only controls
- large touch targets
- reduced-motion support
- stable navigation
- Simple / Full information levels
- editable low-stimulation, migraine, low-energy, fog and text-only modes
- no compulsory white background
- high-value information stays visible until dismissed
- dangerous actions are visually separated
- graphs are optional rather than required for access to information

The UI stores display and workflow preferences rather than needing medical diagnoses.

## Run locally

```bash
cd apps/hive
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Engine connection

Environment names are documented in `.env.example`, but the engine gateway must be implemented and authenticated before switching from demo data.

House Bees such as Accessibility, Workflow, Optimiser and Guardian are intended to run in the private engine. HIVE displays their state, suggestions and controls; it does not give browser code their privileged credentials.

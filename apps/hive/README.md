# HIVE

HIVE is OpenClaw's visual control surface.

## Architecture

The browser UI is deliberately separate from the private OpenClaw engine.

```text
browser / HIVE
      |
      | same-origin GET /api/hive/snapshot
      v
Next.js server gateway
      |
      | authenticated server-to-server request
      v
private OpenClaw engine
      |
      +--> operational Supabase memory
      +--> agent state / missions / audit projections
```

The frontend never receives reusable Supabase credentials, the private database role, or the engine token. The private engine remains the authority for memory and consequential actions; HIVE receives a safe projection for display and control.

Until `HIVE_ENGINE_URL` and `HIVE_ENGINE_TOKEN` are configured, the dashboard intentionally renders a labelled demo snapshot.

## Visual stack

- Next.js + React
- React Three Fiber + Three.js
- custom GLSL shaders
- Drei helpers
- GSAP + ScrollTrigger
- progressive accessible fallbacks and reduced-motion modes

## Run

```bash
cd apps/hive
cp .env.example .env.local
npm install
npm run dev
```

Do not add secrets to git and do not change the engine boundary into direct browser-to-database access.

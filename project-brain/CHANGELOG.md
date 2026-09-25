# Changelog

## 2026-09-25

- Created the Living Project Brain and Structured Project Memory in the authorised sophiamaybea Google Drive.
- Verified Drive and GitHub access.
- Audited the public v0.1 predecessor and recorded implementation gaps.
- Created the version-controlled `project-brain/` mirror.
- Live Project Brain review established that private `bea-agent-core` is the primary engineering/control plane and private `bea-openclaw` is the operational layer.
- **Repository consolidation:** migrated the public HIVE/Clawhouse UI from `sophiamaybea/openclaw` into `open-claw/apps/hive`.
- Marked the former `openclaw` repository as migrated/legacy for future work.
- Preserved the old public `business-idea-evolver` prototype under `open-claw/archive/legacy/business-idea-evolver` and marked its source repo legacy.
- Marked `grok-central-brain` and `kairo-central-brain` as legacy predecessors.
- Added a repository-creation gate: new OpenClaw repos require a real security, deployment/distribution or provenance boundary.
- Confirmed four active OpenClaw repository boundaries: private engineering `bea-agent-core`, public-safe `open-claw`, private operations `bea-openclaw`, and specialist private `octominer`.
- Corrected an intermediate cleanup classification that had incorrectly labelled `bea-agent-core` legacy after consulting the newer live Project Brain state.
- **HIVE frontend implementation:** built a new React/Next.js control surface on branch `feat/hive-control-surface-v1` using React Three Fiber, Three.js, custom GLSL shaders, GSAP and ScrollTrigger.
- Added HIVE screens for Today, Work, Bees, Radar, Money, Brain, Build, Lab, Security and Me, plus comfort/reduced-motion/text fallbacks.
- Added a secure same-origin `/api/hive/snapshot` gateway so the public frontend can later consume private engine projections without direct browser-to-Supabase access.
- Added HIVE CI and opened draft PR #8. The private engine snapshot endpoint remains a follow-up and is not described as working yet.

Clean current truth belongs in PROJECT_STATE.md and the Living Project Brain.

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

- Built draft PR #7 (`integrated-data-plane-v2`) from current `main`: secure owner-scoped Supabase machine-memory schema, OpenClaw CLI, GitHub event sync, runtime memory bridge and authenticated HIVE control surface.
- Deliberately did not apply the schema to the existing unrelated Supabase project; dedicated OpenClaw infrastructure remains a required verification gate.
- Classified the new data plane, CLI and HIVE backend as IN DEVELOPMENT rather than WORKING until deployment, Auth/RLS checks and end-to-end round-trip verification pass.

Clean current truth belongs in PROJECT_STATE.md and the Living Project Brain.

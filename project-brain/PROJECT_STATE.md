# Current System State

_Last updated: 2026-09-25_

| ID | Component | Status | Current truth |
|---|---|---|---|
| STATE-001 | Living Project Brain | WORKING | Google Doc + native structured Google Sheet exist in the authorised sophiamaybea Drive. |
| STATE-002 | GitHub connection | WORKING | `sophiamaybea` account connected with write/admin permissions on relevant repositories. |
| STATE-003 | `sophiamaybea/bea-agent-core` | ACTIVE / PRIMARY PRIVATE | Primary private engineering/control plane. Private institutional memory/CRM/internal engineering remain here. |
| STATE-004 | `sophiamaybea/open-claw` | ACTIVE / PUBLIC | Canonical public OpenClaw monorepo. Contains the v0.1 public predecessor, public-safe Brain mirror and HIVE/control-surface app. |
| STATE-005 | Former `sophiamaybea/openclaw` | MIGRATED / LEGACY | HIVE code consolidated into `open-claw/apps/hive`; no new OpenClaw work should start there. |
| STATE-006 | `sophiamaybea/bea-openclaw` | ACTIVE / PRIVATE OPS | Operational/deployment boundary for privileged mail/wallet/runtime work. |
| STATE-007 | `sophiamaybea/octominer` | ACTIVE SPECIALIST / PRIVATE | Separately testable opportunity-mining package while independently useful. |
| STATE-008 | Local Ollama predecessor | EXPERIMENTAL | Public v0.1 predecessor remains useful scaffolding, not the complete cloud-first system. |
| STATE-009 | Cloud-first autonomous runtime | IN DEVELOPMENT | Private engineering/control-plane work has moved beyond the public v0.1 prototype. |
| STATE-010 | Repository architecture | WORKING POLICY | New work routes to one of four active boundaries; new repositories require a documented real boundary. |
| STATE-011 | HIVE app | IMPLEMENTED ON DRAFT BRANCH | PR #8 replaces the legacy landing page with the React/Three.js/GLSL/GSAP HIVE visual operating system and accessible fallback modes. |
| STATE-012 | HIVE engine connection | PARTIAL | A secure same-origin server gateway exists, but the private engine does not yet expose the authenticated snapshot projection. Demo data is labelled and used as fallback. |
| STATE-013 | HIVE / Supabase boundary | ACTIVE | Browser code has no direct access to `openclaw_private`; operational memory remains behind the private engine boundary. |
| STATE-014 | Privacy boundary | ACTIVE | Public consolidation must not receive private revenue strategy, CRM, identity, credentials or institutional memory. |

## Consolidation result

Repository proliferation was reduced by retiring the duplicate public `openclaw` HIVE repo as an active destination and marking obsolete Grok/KAIRO/idea-evolver repositories as legacy. The newer live Project Brain decision that `bea-agent-core` is the primary private engineering/control plane remains authoritative and was explicitly preserved.

HIVE now has a concrete public frontend architecture without collapsing that privacy boundary. Maintenance, security and reviewer Bees should run in the private engine and surface safe projections/actions in HIVE rather than executing with privileged credentials in browser code.

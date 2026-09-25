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
| STATE-011 | HIVE app | IN DEVELOPMENT | Public HIVE/Clawhouse source now lives at `open-claw/apps/hive/`; current approved HIVE design can evolve there. |
| STATE-012 | Privacy boundary | ACTIVE | Public consolidation must not receive private revenue strategy, CRM, identity, credentials or institutional memory. |
| STATE-013 | Shared Supabase data plane | IN DEVELOPMENT | Draft PR #7 implements owner-scoped RLS schema plus shared tasks, runs, results, machine memory, events, artifacts and links. It is not production-live until deployed to a dedicated OpenClaw Supabase project and verified. |
| STATE-014 | OpenClaw CLI | IN DEVELOPMENT | Draft PR #7 adds `python -m open_claw` commands for shared memory, tasks, results, events and GitHub commit sync. |
| STATE-015 | HIVE authenticated control plane | IN DEVELOPMENT | Draft PR #7 adds `apps/hive/control` over the same Supabase state while preserving the existing visual prototype. |

## Consolidation result

Repository proliferation was reduced by retiring the duplicate public `openclaw` HIVE repo as an active destination and marking obsolete Grok/KAIRO/idea-evolver repositories as legacy. The newer live Project Brain decision that `bea-agent-core` is the primary private engineering/control plane remains authoritative and was explicitly preserved.

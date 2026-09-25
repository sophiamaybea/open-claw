# Decision Log

_Last updated: 2026-09-25_

| ID | Decision | Active? | Rationale |
|---|---|---|---|
| DEC-001 | Project Brain is the persistent source of truth. | YES | Chat history is fragmented and should not be the only memory layer. |
| DEC-002 | Use a living Google Doc + structured Google Sheet + GitHub mirror. | YES | Human readability and machine retrieval need different representations. |
| DEC-003 | Maintain/rewrite canonical records instead of append-only logging. | YES | The Brain must become clearer as it grows. |
| DEC-004 | `open-claw` is canonical agent repo; `openclaw` is a separate related web repo. | SUPERSEDED BY DEC-011 | HIVE was subsequently migrated into the canonical repository. |
| DEC-005 | Explicit implementation statuses are mandatory. | YES | Prevent planned features being described as implemented. |
| DEC-006 | Important claims keep provenance + confidence. | YES | Facts, inference and hypotheses need different evidentiary weight. |
| DEC-007 | Target architecture is cloud-first and phone/iPad controllable. | YES | Core user constraint. |
| DEC-008 | Search the Brain before substantial work. | YES | Reuse prior tools, methods, failures and decisions. |
| DEC-009 | Advertised/discovered rewards are not revenue. | YES | Earnings require verified accepted/payout state. |
| DEC-010 | Superseded decisions remain in history and link to replacements. | YES | Preserve institutional history. |
| DEC-011 | `sophiamaybea/open-claw` is the canonical public OpenClaw monorepo, including HIVE. | YES | Prevent repository proliferation and duplicated architecture. |
| DEC-012 | Keep `bea-openclaw` private as the privileged operations boundary. | YES | Consolidation must not expose private mail/wallet/CRM material. |
| DEC-013 | Retain `octominer` as a specialist private repository while independently useful and testable. | YES | It is a coherent package with its own workflows and tests. |

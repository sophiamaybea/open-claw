# Decision Log

_Last updated: 2026-09-25_

| ID | Decision | Active? | Rationale |
|---|---|---|---|
| DEC-001 | Project Brain is the persistent source of truth. | YES | Chat history is fragmented and should not be the only memory layer. |
| DEC-002 | Use a living Google Doc + structured Google Sheet + GitHub mirror. | YES | Human readability and machine retrieval need different representations. |
| DEC-003 | Maintain/rewrite canonical records instead of append-only logging. | YES | The Brain must become clearer as it grows. |
| DEC-004 | `open-claw` is canonical agent repo; `openclaw` is a separate related web repo. | SUPERSEDED | Later private-engineering and repository-consolidation decisions refined the boundary. |
| DEC-005 | Explicit implementation statuses are mandatory. | YES | Prevent planned features being described as implemented. |
| DEC-006 | Important claims keep provenance + confidence. | YES | Facts, inference and hypotheses need different evidentiary weight. |
| DEC-007 | Target architecture is cloud-first and phone/iPad controllable. | YES | Core user constraint. |
| DEC-008 | Search the Brain before substantial work. | YES | Reuse prior tools, methods, failures and decisions. |
| DEC-009 | Advertised/discovered rewards are not revenue. | YES | Earnings require verified accepted/payout state. |
| DEC-010 | Superseded decisions remain in history and link to replacements. | YES | Preserve institutional history. |
| DEC-011 | `sophiamaybea/open-claw` is the canonical **public** monorepo and includes HIVE. | YES | Consolidates public-safe code without weakening privacy boundaries. |
| DEC-012 | `sophiamaybea/bea-openclaw` remains the private privileged operations/deployment boundary. | YES | Mail/wallet/runtime operations need stronger isolation. |
| DEC-013 | `sophiamaybea/octominer` remains a specialist private repository while independently useful/testable. | YES | It is a coherent tested specialist package. |
| DEC-014 | `sophiamaybea/bea-agent-core` remains the primary private engineering/control plane. | YES | Live Project Brain state supersedes the older snapshot; consolidation must preserve private institutional/engineering authority. |
| DEC-015 | New OpenClaw repositories require a documented security, deployment/distribution or provenance boundary. | YES | Prevent recurrence of repository proliferation. |

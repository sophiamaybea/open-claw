# Upstream repository manifest — 22 October 2026

This manifest distinguishes discovered upstream projects from **the code actually installed and run** in the Base44 bounty integration.

| Upstream | Role | Verified licence | Status in this integration |
|---|---|---|---|
| [openclaw/openclaw](https://github.com/openclaw/openclaw) | Official agent Gateway and protocol | MIT (checked LICENSE) | REFERENCED; external Gateway must be separately installed/configured, NOT connected |
| [FoundationAgents/OpenManus](https://github.com/FoundationAgents/OpenManus) | Python multi-agent/task-planning framework | MIT (checked LICENSE) | REFERENCED; not installed |
| [unclecode/crawl4ai](https://github.com/unclecode/crawl4ai) | Crawl/parse public websites | Apache-2.0 (checked LICENSE) | REFERENCED; not installed |
| [assafelovic/gpt-researcher](https://github.com/assafelovic/gpt-researcher) | Evidence-gathering research pipeline | Apache-2.0 (checked LICENSE) | REFERENCED; not installed |
| [microsoft/graphrag](https://github.com/microsoft/graphrag) | Retrieval over entity/relationship graphs | MIT (checked LICENSE) | REFERENCED; not installed |
| [crytic/slither](https://github.com/crytic/slither) | Solidity static analysis for authorised code | AGPL-3.0 (checked LICENSE) | REFERENCED; not installed; copyleft review necessary if incorporated |
| [foundry-rs/foundry](https://github.com/foundry-rs/foundry) | EVM local testing for authorised targets | MIT licence file verified; check whole repository licence set if redistributing | REFERENCED; not installed |
| [sophiamaybea/bea-agent-core](https://github.com/sophiamaybea/bea-agent-core) | Existing private engineering/bounty-brain | Private user-owned | EXISTING, not changed here |
| [sophiamaybea/bea-openclaw](https://github.com/sophiamaybea/bea-openclaw) | Existing private privileged mail/wallet Gateway deployment | Private user-owned | EXISTING, not changed here; not suitable for public bounty ingress |

## Integration audit
- IMPLEMENTED: Six Base44-native research agent definitions and a new official GitHub issue verification function, deployed as Base44 resource files; real end-user agent conversations still require a signed-in smoke test.
- IMPLEMENTED: Read-only authenticated Base44 `openclaw-dispatch` relay, private job records and status polling.
- IMPLEMENTED / TESTED: Standalone no-dependency Node bridge in this directory. Five negative-path security/contract tests passed, and the HTTP server health check passed.
- NOT IMPLEMENTED: Separate official upstream Gateway installation, isolated `bounty_research` agent configuration, secure secrets, network connectivity, paid workloads, automated proposals/submissions, vulnerability scanning, or real payment receipts.
- NOT VERIFIED: Real paid bounty, funds availability, eligibility, working OpenClaw model call, or cross-platform production operation.

## Deployment boundary

**Never reuse the privileged `bea-openclaw` mail/wallet Gateway as the base of this inbound bounty research service**. The official OpenClaw Gateway bearer token carries operator authority. Set up a fully isolated read-only instance with separate secrets/network/workspace or leave the bridge disconnected. No access to wallet or Gmail.

The only source copied into the new bridge is original integration glue. Upstream code is linked, not vendored. Licence review and technical compatibility must precede any future incorporation of upstream libraries or binaries.

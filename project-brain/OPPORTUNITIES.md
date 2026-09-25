# Money-Making Opportunity Database

_Last updated: 2026-09-25_

The database is now seeded from a fresh live scan. This replaces the previous intentionally-empty initial state.

## Live opportunity set

### QUALIFIED / work can begin now

- **Google Gemma 4 Developer Agent Competition — Kaggle — $65,000.** Deadline 2026-12-02. Directly aligned with OpenClaw's agent architecture; submissions are evaluated with repository patch PASS/FAIL tests. Status: QUALIFIED_R_AND_D.
- **Google Gemma 4 Developer Agent Paper Track — Kaggle — $35,000.** Deadline 2026-11-12. Particularly relevant because a new tool, dataset, benchmark or code-graph application can win dedicated awards. Status: QUALIFIED_R_AND_D.
- **Copperhead end-to-end create pipeline bounty — GitHub — $50.** Clear integration-test and findings-report acceptance criteria. Status: QUALIFIED.
- **RustChain MCP streaming/long-running behavior — GitHub — 8 RTC.** Small docs+tests deliverable. Status: QUALIFIED; wallet required for payout.
- **BC Forge indexer pagination + OpenAPI — GitHub/Drips.** Explicit contributor-funding language and clear tests; exact reward still requires verification. Status: QUALIFIED_PENDING_REWARD_VERIFICATION.
- **Superteam Earn agent API.** Not one bounty but a machine-readable feed of agent-eligible bounties/projects/hackathons. Status: INTEGRATION_STARTED.

### SCOUT / run cheap feasibility tests first

- **Lost in Transcription — DrivenData — $20,000.** Deadline 2026-10-02. Multilingual/bilingual ASR. Time pressure means only a fast baseline is justified before committing more compute.
- **AI4S Open Innovation: AI for Life Science — Kaggle Community — $22,200.** Lower visible participation than flagship Kaggle competitions.
- **2026 IEEE Big Data Traffic Flow Bench — Kaggle Community — $3,500.** Physics-aware traffic reconstruction/forecasting.
- **ARC Prize 2026 ARC-AGI-3 — Kaggle — $850,000.** Very large upside but also large competition/compute uncertainty.
- **ARC Prize 2026 ARC-AGI-2 — Kaggle — $700,000.** Same rule: no large spend until a cheap experiment shows signal.

### AUTHORISED-SECURITY SCOUTING ONLY

- **Immunefi** currently exposes a large live portfolio of public Web3 bounty programs. OpenClaw may inspect public code and rules and work only inside explicit authorised scope. No out-of-scope probing.
- HackerOne and Bugcrowd remain candidate sources for explicitly authorised programs.

## Revenue-engine implementation

A new branch, `revenue-engine/autonomous-portfolio-v1`, now contains:

- `revenue_engine/portfolio_100.md` — 100 diversified autonomous revenue mechanisms;
- `revenue_engine/live_opportunities_2026-09-25.json` — first live registry;
- `revenue_engine/score.py` — transparent expected-value scoring;
- `revenue_engine/superteam.py` — Superteam agent-eligible listing client;
- tests for scoring behavior.

The scoring tests were executed independently and passed. Full repository CI could not be run from the current execution container because outbound DNS is unavailable; do not classify repository CI as verified yet.

## Required state discipline

DISCOVERED -> QUALIFIED -> SOLVING -> READY_TO_SUBMIT -> SUBMITTED -> ACCEPTED/REJECTED -> PAYOUT_VERIFIED.

A reward is not revenue until payout is verified.

## Selection rule

Prefer:

clear payer + explicit rules + machine-verifiable output + low ambiguity + legal scope + reusable learning + low human-attention cost.

Penalise:

high competition + unclear payout + KYC/account friction + financial exposure + public-posting requirements + unsafe/unauthorised activity + large compute before evidence.

## Structured fields

Every opportunity should record:

- organisation
- problem
- category
- reward
- deadline
- requirements
- eligibility
- competition level
- estimated difficulty
- capabilities required
- tools required
- expected effort
- status
- source
- submission route
- result
- last checked
- confidence
- autonomy class
- required authority
- reusable assets created
- predicted vs realised outcome

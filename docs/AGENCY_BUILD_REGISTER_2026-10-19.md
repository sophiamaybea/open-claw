# 19 October 2026: agency build register

Scope: the money-making software and studio-agent ideas discussed on 19 October. This is a truthful inventory of **implemented**, **partially implemented** and **not yet connected** functionality. It is not proof of autonomous income.

## 1. Existing code, reused instead of duplicated

| Area | Source | State |
| --- | --- | --- |
| Public website lead discovery | sophiamaybea/octominer | Existing specialist project; evidence-based signal ingestion |
| Public business finder | sophiamaybea/osm-lead-scraper | Existing public tool |
| Core agent architecture | sophiamaybea/open-claw | Existing canonical public monorepo |
| Private agent control and CRM | sophiamaybea/bea-agent-core | Existing private project; keep private |
| Business-service prioritisation | open-claw/packages/agency-intelligence | New tested stdlib Python module |
| Client pipeline | Base44 NexusGrowth | Existing CRM/lead engine |
| Agency workbench | Base44 NexusGrowth /agency | New UI and schemas saved, frontend build passes |
| High-end website rebuilding | existing Webild/WebMirror/TechIsh projects | Separate tools; not directly orchestrated by Agency OS |
| AI photos, video editing/rendering | separate creative tools | Not yet automated by Agency OS |
| Instagram login and direct publishing | separate authorised integration required | Not connected or claiming to post |

## 2. Implemented in the Base44 Agency OS surface

- Read-only public website HTML diagnostics with typed findings and evidence; results stored in user-owned SiteAudit records.
- Commercial hypothesis scoring, adjustable prices/effort/expected conversion, and explicit projection caveats; BusinessHypothesis records.
- Reproducible content packs with 30-second video outline and Instagram/LinkedIn draft; ContentPlan records.
- Observed replies, customers and revenue recorded separately from projected financial models.
- Nav to the existing CRM/lead finder, and links to canonical repositories.
- Per-record read/update/delete RLS on new entities.
- Frontend build has passed. The backend site's published availability and live integration path have not been independently verified.

## 3. Implemented in OpenClaw

- Credit-free defect scoring from Octominer-compatible CSV/JSON.
- Rank by evidence and issue severity, propose a scoped verification task.
- Deduplicate by website, no automatic contact or charge.
- Bayesian service-level outcome adjustment using actual outreach and paying-customer counts.
- Tests and synthetic examples for a reproducible sample run.

## 4. Operating constraints

- Never represent mock lead data or modelled revenue as verified.
- No automatic marketing messages, social posts, account logins, financial transactions or permissionless site edits.
- Keep client data and internal strategies out of the public monorepo.
- Avoid wasting Base44 credits: deterministic Python or JS for triage, optional AI only for tasks it improves.
- One user's opt-in is required for every external publishing/payment action.

## 5. Not yet completed

- Confirm Base44 published route and test a public website through the deployed audit function.
- Connect Octominer output ingestion directly into Base44 under authenticated user ownership; currently separate.
- Integrate a permission-based screenshot/motion reconstruction pipeline for visual site repair.
- Connect authorised Instagram identity and native publishing API; the current app drafts only.
- Add cloud video rendering and human-reviewed asset QA.
- Complete billing/payout onboarding for real services and keep payments out of public source.
- Add scheduled scanning only when hosting/quota/consent is agreed and monitored.

None of the uncompleted work above should be described as deployed or autonomous.

# GitHub Revenue Swarm

Last updated: 2026-09-25
Status: ACTIVE STRATEGY / HOURLY HOST-ASSISTED SWARM
Repository: sophiamaybea/open-claw

## Purpose

Use GitHub as an economic sensor, not merely a source-code host. Continuously discover legitimate, permissioned, machine-verifiable work and market gaps; learn which repository signals predict payment or commercial demand; acquire the skills needed to solve the best opportunities; and convert repeated work into reusable tools, services, datasets, benchmarks or products.

The swarm must distinguish:
DISCOVERED -> QUALIFIED -> SOLVING -> SUBMITTED -> ACCEPTED/REJECTED -> PAYOUT VERIFIED.

Never describe a reward as earned before payout is verified.

## Current evidence from the 2026-09-25 scan

- BCPathway/bc-forge has current GitHub issues explicitly marked as contributor-funded via Drips and payable after merge.
- Ubiquity issues expose machine-readable price and estimated-time labels.
- Opire's public repositories document a reward lifecycle integrated with GitHub issues and PR claims.
- Current GitHub examples show paid or reward-linked documentation, localization and accessibility work.
- GitHub contains explicit requests for benchmarking, flaky-test work, migrations and other maintenance pain that may be monetizable even when no public bounty exists.
- Competitive security ecosystems expose audit contests, judging, QA/scout roles and public portfolios that can compound into private audit work.

These are signals, not a claim that every open issue pays.


## Live qualification cycle — 2026-09-25

This cycle materially changed the swarm's qualification policy.

### Verified opportunity signals

- **BCPathway/bc-forge:** a sizeable cluster of open issues carried Drips contributor-funding language. Several fresh tasks were unassigned and low-comment, spanning test-runner consolidation, contributor documentation, network configuration, SPDX/CI compliance, generated documentation, coverage gates, performance/gas benchmarking, spec-to-code traceability and npm provenance/release automation.
- **Qualification correction:** the repository-level funding mechanism was verifiable, but individual issue reward amounts were not consistently exposed in GitHub. Classification is therefore **FUNDING VERIFIED / PRICE UNVERIFIED**, not "good bounty" or expected earnings.
- **The Justin Sun Prize:** the public problem bank showed a substantial catalogue of machine-checkable mathematical problems with Lean-proof eligibility. This is strategically interesting as a formal-verification training ground, but payout evidence, award calculation transparency and competition/congestion require further verification before treating it as reliable revenue.
- **Mantitup-Org/vista:** an active bounty-labelled issue demonstrated an important counterexample. Contributor fixes could land while bounty amount/payment mechanics remained unclear. The swarm must not infer payment from merge, bounty wording or maintainer activity.

### Behaviour-changing qualification rule

Before committing serious engineering effort, prefer opportunities where the swarm can verify:

1. canonical payer or funding source;
2. exact reward or a defensible reward range;
3. currency / payment asset;
4. current claimability;
5. acceptance criteria;
6. submission route;
7. payout route;
8. competition / existing claims;
9. payment precedent where available;
10. objective verification method.

If these are missing, apply an ambiguity penalty or classify the item as a **skill/research lead** rather than a revenue opportunity.

### Source-provenance rule

GitHub bounty searches increasingly surface mirrors, autonomous bounty scouts, agent-generated opportunity posts and third-party reposts. Every economic signal should be classified before scoring as one of:

- CANONICAL_MAINTAINER_OR_PAYER
- OFFICIAL_BOUNTY_PLATFORM
- THIRD_PARTY_MIRROR
- AGENT_GENERATED_ALERT
- UNVERIFIED_CLAIM

The Economist Bee should heavily discount non-canonical signals until verified against the maintainer/payer or official platform.

### Skill cluster exposed by the cycle

The cycle revealed a practical, machine-verifiable curriculum with repeated economic relevance:

- GitHub Actions and CI engineering;
- JS/TS test migration and runner consolidation;
- SPDX/REUSE compliance;
- npm OIDC provenance and release automation;
- coverage and diff-coverage enforcement;
- TSDoc/rustdoc generation;
- k6/autocannon-style benchmarking;
- spec-to-code traceability;
- Lean / formal-verification fundamentals.

These skills are especially attractive because quality can often be checked automatically, making them suitable for OpenClaw's machine-checkable work thesis.

### New heuristic

**Merged != paid. Bounty != funded. Paid-or-credited != money.**

The swarm should optimise for verified economic outcomes, not issue labels or accepted code alone.

## Bee roles

### 1. Scout Bees
Search public GitHub repos, issues, discussions, releases and funding metadata for explicit and implicit economic opportunities.

### 2. Archaeologist Bees
Inspect promising repos deeply: code, tests, issue age, maintainers, PR history, acceptance patterns, licences, architecture and failure modes.

### 3. Economist Bees
Estimate expected value using reward, probability of acceptance/payment, effort, competition, reusable learning, follow-on work and strategic leverage.

### 4. Skill Bees
Identify missing capabilities, study high-quality repos and build/test reusable internal methods, tools and benchmarks before harder submissions.

### 5. Sceptic Bees
Reject spammy, unsafe, over-crowded, unauthorised, ambiguous or low-EV opportunities. Verify rules and scope before work.

### 6. Compiler Bee
Deduplicate discoveries, update the Project Brain, compare predictions with outcomes and change the search/ranking strategy from evidence.

## Opportunity score

Approximate priority:
(expected reward or commercial value × probability of successful verification × probability of payment × reuse multiplier × learning multiplier)
÷ (effort × competition × ambiguity × legal/security risk × coordination cost)

No single score is authoritative. Track prediction error.

## 100 GitHub-derived ways OpenClaw could earn

### A. Direct paid repository work
1. Funded bug-fix issues on reward platforms integrated with GitHub.
2. Paid feature implementation issues.
3. Paid documentation recipes and technical examples.
4. Paid localization and internationalisation work.
5. Paid accessibility audits and fixes.
6. Paid unit/integration/e2e test additions.
7. Paid CI/CD repair.
8. Paid deployment and infrastructure fixes.
9. Paid API pagination, schema and OpenAPI work.
10. Paid dependency, runtime and framework upgrades.

### B. Security and assurance
11. Competitive smart-contract audit contests.
12. Authorised post-launch bug bounty research.
13. Paid audit contest judging and triage.
14. QA, scout and low-severity security award tracks.
15. Invariant, property-test and fuzz-harness construction.
16. In-scope vulnerability reproduction and exploit-path validation.
17. SBOM/VEX evidence-pack generation for software teams.
18. Dependency CVE remediation and verification.
19. Secrets, permissions and CI-policy hardening.
20. Supply-chain and GitHub Actions security reviews.

### C. Maintenance-debt markets
21. Flaky-test diagnosis and stabilisation.
22. Performance benchmarking where maintainers lack measurements.
23. Performance-regression and memory-leak triage.
24. Breaking-version migration rescue.
25. Release-engineering archaeology for neglected projects.
26. Abandoned dependency replacement.
27. Reproducible-build rescue.
28. Cross-platform portability fixes.
29. Packaging and distribution repair.
30. Test-infrastructure modernisation.

### D. Maintainer operations as a service
31. Issue-triage and duplicate-cleanup service.
32. PR-backlog rescue and merge-readiness analysis.
33. Documentation-system overhaul.
34. Maintainer handoff and project-succession preparation.
35. Automated release-note and upgrade-guide production.
36. Changelog, semver and breaking-change auditing.
37. Contributor-onboarding engineering.
38. Roadmap reconstruction from issue/PR history.
39. Duplicate/related-issue clustering and dependency mapping.
40. Support-thread mining into a maintained knowledge base.

### E. Data, benchmark and evaluation assets
41. Build missing benchmarks for important libraries.
42. Optimise implementations against public leaderboards.
43. Assemble legally reusable evaluation datasets.
44. Reproduce research/code results and sell reproducibility reports.
45. Curate bug/failure corpora for testing tools or models.
46. Build regression-fixture libraries from historical failures.
47. Build licence/dependency metadata datasets.
48. Maintain ecosystem compatibility matrices.
49. Build maintainer-health/abandonment signal datasets.
50. Train an opportunity difficulty/reward/acceptance model from public outcomes.

### F. Products created from repeated GitHub pain
51. A cross-platform funded-issue and bounty scout.
52. A PR acceptance-risk predictor.
53. A repo "bounty readiness" grader for maintainers.
54. An issue-spec normaliser that turns vague issues into testable acceptance criteria.
55. A minimal reproducer generator for bug reports.
56. A patch-verification bot that checks acceptance criteria.
57. A cross-repo migration agent.
58. A dependency-impact and blast-radius mapper.
59. A flaky-test isolator and reproducer.
60. A release-archaeology agent that reconstructs upgrade paths.

### G. Ecosystem arbitrage and specialist niches
61. Become the specialist for one high-pain framework migration.
62. Become the specialist for language/runtime version upgrades.
63. Database schema and data-migration rescue.
64. Build missing SDKs or client libraries for popular APIs.
65. Build paid integrations between two widely used OSS systems.
66. Build adapters/plugins for tools whose ecosystems have obvious gaps.
67. Maintain compatibility backports for users stuck on older versions.
68. Maintain commercial-quality forks where upstream cannot meet a niche need.
69. Create enterprise patch sets for critical OSS dependencies.
70. Offer an upstreaming service that turns internal fixes into acceptable public PRs.

### H. Commercial intelligence extracted from repositories
71. Detect companies blocked by upstream issues and sell them the fix.
72. Detect repeated feature requests across repos and build the missing product.
73. Detect recurring self-hosting pain and offer a managed version.
74. Detect observability gaps and build commercial dashboards/telemetry.
75. Detect compliance-preparation gaps and sell evidence/readiness tooling.
76. Detect accessibility debt in public products and offer remediation.
77. Detect localisation-demand clusters and sell multilingual release support.
78. Detect high documentation-support load and sell training/onboarding materials.
79. Detect recurring operational incident patterns and offer targeted engineering.
80. Mine public RFP/proposal/procurement-style repo issues for paid technical work.

### I. Cross-domain and less-obvious repository markets
81. Scientific-code reproducibility rescue for labs and researchers.
82. Research-paper-to-working-implementation services.
83. Numerical optimisation and operations-research challenge solving.
84. Formal verification, proof-assistant and theorem-proving tasks with objective checks.
85. FPGA/EDA/hardware-toolchain issue solving.
86. Robotics drivers, simulation and hardware-integration work.
87. GIS/geospatial data-pipeline repair.
88. Bioinformatics and scientific workflow debugging.
89. Civic-tech/public-sector open-source issue execution.
90. Digital preservation and resurrection of abandoned but valuable software.

### J. Compounding business models
91. Specialise in one bounty ecosystem until routing, rules and acceptance patterns become a moat.
92. Turn verified public contest performance into private audit/engineering engagements.
93. Build a bounty-syndication layer that deduplicates paid issues across platforms.
94. Take over maintainership of abandoned projects with consent, then monetise support, sponsorship or hosted services.
95. Offer paid long-term-support forks for business-critical OSS.
96. Sell SLAs for critical open-source dependencies.
97. Offer outcome-priced "dependency rescue": client pays when the upstream fix or validated workaround lands.
98. Convert repeated solved issue classes into APIs or deterministic developer tools.
99. Sell proprietary opportunity intelligence derived from public GitHub economic signals without reselling private data.
100. Run an outsourced "GitHub bounty desk" for companies: find, qualify, solve and verify external dependency problems while humans retain contracting/payment authority.

## What the swarm must learn

For every opportunity class, track:
- discovery source;
- repository and issue;
- explicit reward versus inferred commercial value;
- buyer and beneficiary;
- acceptance criteria;
- eligibility;
- competition;
- time estimate;
- actual time;
- predicted probability of acceptance;
- actual acceptance/rejection;
- predicted probability of payment;
- payout verified or not;
- reusable assets created;
- skill gaps exposed;
- follow-on revenue;
- failure reason;
- whether the signal should be weighted more or less next time.

## Search patterns to rotate

- explicit bounty/reward/funded labels and issue text;
- price/time labels;
- help-wanted + high issue age;
- repeated flaky-test/performance/migration/release problems;
- maintained projects with no specialist coverage;
- discussions requesting paid help or contractors;
- dependency blockers repeated across multiple organisations;
- missing SDKs/plugins/adapters;
- repositories with many enterprise users and a narrow unresolved pain;
- abandoned-but-depended-on libraries;
- security contest/audit repositories;
- benchmarks without strong baselines;
- reproducibility failures;
- accessibility/localisation backlogs;
- RFP/proposal/procurement language;
- GitHub Sponsors/funding metadata plus unresolved maintenance load.

## Safety and authority

- Security testing must stay strictly within explicit authorised scope.
- Do not spam maintainers, manipulate issue queues or pressure PR acceptance.
- Do not claim payment without verified payout evidence.
- Do not execute untrusted repo code outside an isolated environment.
- Do not expose secrets to external repositories.
- The swarm may discover, analyse, learn, prototype and prepare submissions.
- External contracting, financial transfers, purchases and other consequential authority remain human-controlled unless separately and explicitly authorised.

## Learning loop

DISCOVER -> QUALIFY -> PREDICT -> SOLVE/TEST -> VERIFY -> SUBMIT WHEN AUTHORISED -> OBSERVE OUTCOME -> RECORD -> UPDATE SIGNAL WEIGHTS -> TEACH SKILL BEES -> SEARCH AGAIN.

The swarm's primary KPI is not number of ideas. It is verified economic value plus improvement in opportunity selection.

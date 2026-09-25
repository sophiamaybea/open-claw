# OPENCLAW — Project Brain

This directory is the version-controlled mirror of OpenClaw's living institutional memory.

## Canonical layers

1. **Human-readable living report:** [OPENCLAW — Living Project Brain](https://docs.google.com/document/d/1WI6WDFn8Syz23UF9zpkx_tLYqi4OI6qLuExVbMsvos4/edit)
2. **Structured operational memory:** [OPENCLAW — Structured Project Memory](https://docs.google.com/spreadsheets/d/1V2sd3JQSodXUt2NnhZbRkQofJFMpeP242sTCiiV45Ts/edit)
3. **Version-controlled mirror:** this `project-brain/` directory

The structured records use stable IDs so the Google Doc, structured memory and repository mirror can refer to the same knowledge objects.

## Operating rule

OpenClaw should query the Project Brain before substantial work, then update it after meaningful work.

**Loop:** DISCOVER → REASON → BUILD → TEST → LEARN → RECORD → CONNECT → REUSE → IMPROVE

Do not treat documentation as an afterthought. Do not blindly append chat transcripts. Merge duplicate knowledge, update canonical records, preserve important history, mark superseded decisions, record failures and retain provenance/confidence.

## Status vocabulary

- WORKING
- EXPERIMENTAL
- IN DEVELOPMENT
- PLANNED
- BLOCKED
- DEPRECATED

Idea-specific statuses may additionally use NEW, INVESTIGATING, PROMISING, EXPERIMENTING, IMPLEMENTED, PAUSED, REJECTED and SUPERSEDED.

## Provenance vocabulary

USER · CHAT · GITHUB · RESEARCH · DOCUMENTATION · EXPERIMENT · CODE EXECUTION · EXTERNAL SOURCE · INFERENCE

## Confidence

HIGH · MEDIUM · LOW · UNVERIFIED

## Update protocol

At the end of meaningful work:

1. Review the session.
2. Identify new, changed, superseded and contradictory knowledge.
3. Update existing records before adding duplicates.
4. Update current system state and capabilities.
5. Record discoveries, experiments, failures, opportunities and learnings.
6. Update roadmap and architecture when needed.
7. Add unresolved questions.
8. Link related entities.
9. Update CHANGELOG.md.
10. Deduplicate and verify that no major decision or discovery was lost.

## Repository identity

The canonical agent repository is **`sophiamaybea/open-claw`**. The similarly named **`sophiamaybea/openclaw`** repository is a separate Clawhouse/web project and must not be treated as the agent runtime.

Last updated: 2026-09-25

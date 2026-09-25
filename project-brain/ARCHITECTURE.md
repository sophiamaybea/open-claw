# Architecture

_Last updated: 2026-09-25_

## Target architecture

```mermaid
flowchart TD
    U[User / iPad / Phone] --> C[Cloud Control Plane]
    C --> O[Orchestrator / Planner]
    O --> B[Project Brain API]
    O --> R[Research / Browser Tools]
    O --> G[GitHub / Repository Tools]
    O --> X[Isolated Code Execution Sandbox]
    O --> S[Specialist Agents]
    X --> E[External Evaluators / Tests]
    R --> Q[Opportunity Ingestion & Scoring]
    G --> Q
    Q --> P[Problem Queue]
    P --> O
    O --> M[Submission Manager]
    M --> T[Treasury / Wallet]
    E --> B
    M --> B
    T --> B
    B --> D[Living Google Doc]
    B --> DB[Structured Memory Store]
    B --> V[GitHub project-brain Mirror]
```

## Current vs target

### Current predecessor
- Python package in `sophiamaybea/open-claw`
- local Ollama client
- JSON/JSONL memory
- model-generated reflection score
- basic prompt evolution
- skill text/code stored in memory
- recursive-improvement note written for human merge

### Target
- persistent cloud execution
- real typed tool router
- sandboxed code/test loop
- source-grounded research
- capability/opportunity matching
- external correctness evaluators
- failure-aware planning
- Project Brain API
- knowledge graph / semantic retrieval
- permission-aware submissions
- controlled treasury/wallet
- complete audit trail

## Key principle

Self-improvement is only promoted when external evidence shows it improved task performance. Model self-scoring alone is not sufficient.

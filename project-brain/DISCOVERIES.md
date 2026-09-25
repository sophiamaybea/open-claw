# Discoveries

_Last updated: 2026-09-25_

### DISC-001 — Two similarly named repositories serve different purposes
**Confidence:** HIGH  
`open-claw` contains agent Python; `openclaw` contains Clawhouse web/visual work.

### DISC-002 — open-claw is the active agent repository
**Confidence:** HIGH  
It received a write-access bootstrap commit on 2026-09-25 and contains the current agent package.

### DISC-003 — Existing runtime is local-first; target is cloud-first
**Confidence:** HIGH  
The Ollama client uses localhost while the project requirement is persistent cloud control from iPad/phone.

### DISC-004 — README vector-memory claim is not implemented in inspected memory.py
**Confidence:** HIGH for main branch  
The current module stores JSON/JSONL; no vector index/query code appears in the inspected implementation.

### DISC-005 — Current act() path is largely simulated
**Confidence:** HIGH  
Most thoughts become a formatted simulated action result rather than a typed external tool call.

### DISC-006 — Current recursive improvement is human-gated
**Confidence:** HIGH  
It writes an evolution recommendation and awaits human merge rather than mutating running code automatically.

### DISC-007 — Current state and history need separate representations
**Confidence:** HIGH  
The clean report is rewritten; chronological history stays in CHANGELOG.

### DISC-008 — Revenue needs a discovery→submission→payout state machine
**Confidence:** HIGH  
A listed reward is not money earned.

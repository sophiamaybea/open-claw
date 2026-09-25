# Failure Memory

_Last updated: 2026-09-25_

### FAIL-001 — README overstates vector memory
**Why:** `memory.py` currently implements JSON/JSONL persistence but no vector store/query layer.  
**Avoid:** Never promote documentation wording to WORKING without implementation/test evidence.

### FAIL-002 — act() is too simulated for autonomous problem solving
**Why:** Most actions return a string rather than invoking real tools.  
**Avoid:** Require typed action execution, receipts and external evaluators.

### FAIL-003 — Local-only runtime conflicts with cloud-first requirement
**Why:** Ollama defaults to localhost and needs local compute.  
**Avoid:** Judge predecessor code against explicit target constraints before reusing it wholesale.

### FAIL-004 — Potential evolution-directory path defect
**Evidence:** fetched `core.py` appears to use `"evolution\n"` as a path segment.  
**Confidence:** MEDIUM until executed.  
**Next:** confirm with tests, then repair if reproduced.

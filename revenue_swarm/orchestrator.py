from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

from .evaluator import rank
from .github_source import discover_all
from .models import Opportunity, Reflection, utc_now


SWARM = {
    "atlas": "generalist: boring maintenance, docs, compatibility, migrations",
    "ada": "generalist: Python, algorithms, ML, mathematics",
    "curie": "generalist: data, research, statistics, science",
    "turing": "generalist: debugging, tests, software bounties",
    "faraday": "generalist: performance, optimisation, engineering",
    "sagan": "red-team generalist: challenge assumptions and detect bad opportunities",
}


def _write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n")


def reflect_on_queue(opportunities: Iterable[Opportunity]) -> list[Reflection]:
    reflections: list[Reflection] = []
    for opportunity in opportunities:
        evidence = {
            "score": opportunity.score,
            "reward_usd": opportunity.reward_usd,
            "comments": opportunity.comments,
            "status": opportunity.status,
            "requires_human_gate": opportunity.requires_human_gate,
        }
        worked = list(opportunity.score_reasons[:3])
        failed: list[str] = []
        if opportunity.reward_usd is None:
            failed.append("no explicit reward evidence")
        if opportunity.requires_human_gate:
            failed.append("cannot proceed until authorised scope is verified")
        reflections.append(
            Reflection(
                opportunity_id=opportunity.id,
                agent=opportunity.discovered_by or "sagan",
                stage="DISCOVERY_REVIEW",
                evidence=evidence,
                what_worked=worked,
                what_failed=failed,
                next_change=(
                    "inspect rules/repository and verify claimability before solving"
                    if opportunity.status == "QUALIFIED"
                    else "deprioritise unless new evidence appears"
                ),
                confidence="MEDIUM" if opportunity.status == "QUALIFIED" else "LOW",
            )
        )
    return reflections


def run(output_dir: str = "revenue_swarm/state", limit: int = 40) -> dict:
    root = Path(output_dir)
    discovered = discover_all()
    ranked = rank(discovered)[:limit]
    reflections = reflect_on_queue(ranked)

    queue = [op.to_dict() for op in ranked]
    review = [r.to_dict() for r in reflections]
    summary = {
        "run_at": utc_now(),
        "agents": SWARM,
        "discovered": len(discovered),
        "queued": len(ranked),
        "qualified": sum(1 for op in ranked if op.status == "QUALIFIED"),
        "human_gated": sum(1 for op in ranked if op.requires_human_gate),
        "verified_revenue_usd": 0.0,
        "note": "Discovery is not earnings. Revenue only changes after PAYOUT_VERIFIED.",
    }

    _write_json(root / "opportunity_queue.json", queue)
    _write_json(root / "reflections.json", review)
    _write_json(root / "last_run.json", summary)
    return summary

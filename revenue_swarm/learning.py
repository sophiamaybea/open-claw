from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


OUTCOME_WEIGHT = {
    "INVALID": -1.5,
    "OUT_OF_SCOPE": -1.5,
    "REJECTED": -1.0,
    "NO_RESPONSE": -0.25,
    "SOLVED_VERIFIED": 0.35,
    "SUBMITTED": 0.1,
    "ACCEPTED": 1.0,
    "PAYOUT_VERIFIED": 2.0,
}


@dataclass
class StrategyStats:
    attempts: int = 0
    accepted: int = 0
    payouts: int = 0
    failures: int = 0
    evidence_score: float = 0.0
    verified_revenue_usd: float = 0.0

    @property
    def quality(self) -> float:
        return (1.0 + self.accepted + 2.0 * self.payouts) / (2.0 + self.attempts)


class EvidenceLearner:
    """Learn only from externally observable outcomes, never introspective scores."""

    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.data: dict[str, StrategyStats] = {}
        self._load()

    def _load(self) -> None:
        if not self.path.exists():
            return
        raw = json.loads(self.path.read_text())
        self.data = {name: StrategyStats(**stats) for name, stats in raw.items()}

    def _save(self) -> None:
        payload = {name: asdict(stats) for name, stats in self.data.items()}
        self.path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n")

    def record(self, strategy: str, outcome: str, payout_usd: float = 0.0) -> StrategyStats:
        outcome = outcome.upper()
        if outcome not in OUTCOME_WEIGHT:
            raise ValueError(f"unknown outcome: {outcome}")

        stats = self.data.setdefault(strategy, StrategyStats())
        stats.attempts += 1
        stats.evidence_score += OUTCOME_WEIGHT[outcome]

        if outcome in {"ACCEPTED", "PAYOUT_VERIFIED"}:
            stats.accepted += 1
        if outcome == "PAYOUT_VERIFIED":
            stats.payouts += 1
            stats.verified_revenue_usd += max(0.0, payout_usd)
        if outcome in {"INVALID", "OUT_OF_SCOPE", "REJECTED"}:
            stats.failures += 1

        self._save()
        return stats

    def snapshot(self) -> dict[str, Any]:
        return {
            name: {**asdict(stats), "quality": round(stats.quality, 4)}
            for name, stats in sorted(self.data.items())
        }

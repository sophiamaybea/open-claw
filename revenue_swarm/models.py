from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass(slots=True)
class Opportunity:
    id: str
    source: str
    source_url: str
    title: str
    body: str = ""
    repository: str = ""
    reward_usd: float | None = None
    reward_text: str = ""
    comments: int = 0
    created_at: str | None = None
    updated_at: str | None = None
    labels: list[str] = field(default_factory=list)
    discovered_by: str = ""
    discovered_at: str = field(default_factory=utc_now)
    score: float = 0.0
    score_reasons: list[str] = field(default_factory=list)
    status: str = "DISCOVERED"
    safety_class: str = "ordinary"
    requires_human_gate: bool = False

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class Reflection:
    opportunity_id: str
    agent: str
    stage: str
    evidence: dict[str, Any]
    what_worked: list[str] = field(default_factory=list)
    what_failed: list[str] = field(default_factory=list)
    next_change: str = ""
    confidence: str = "LOW"
    created_at: str = field(default_factory=utc_now)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

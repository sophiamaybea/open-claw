from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Iterable

from .models import Opportunity

MONEY_RE = re.compile(
    r"(?P<currency>[$\u00a3\u20ac])\\s?(?P<number>\\d{1,3}(?:,\\d{3})*(?:\\.\\d+)?)(?P<suffix>[kKmM]?)"
)
SECURITY_TERMS = {
    "bug bounty",
    "vulnerability",
    "exploit",
    "smart contract",
    "pentest",
    "security bounty",
}
CLARITY_TERMS = {
    "acceptance criteria",
    "expected behavior",
    "expected behaviour",
    "tests",
    "reproduce",
    "reproduction",
    "likely files",
    "requirements",
}
BORING_HIGH_VALUE_TERMS = {
    "documentation",
    "migration",
    "regression",
    "test",
    "cleanup",
    "refactor",
    "compatibility",
    "data",
    "parser",
    "cli",
}


def extract_reward(text: str) -> tuple[float | None, str]:
    candidates: list[tuple[float, str]] = []
    for match in MONEY_RE.finditer(text):
        raw = match.group(0)
        number = float(match.group("number").replace(",", ""))
        suffix = match.group("suffix").lower()
        if suffix == "k":
            number *= 1_000
        elif suffix == "m":
            number *= 1_000_000
        if match.group("currency") == "$":
            candidates.append((number, raw))
    if not candidates:
        return None, ""
    return max(candidates, key=lambda item: item[0])


def _age_days(created_at: str | None) -> float | None:
    if not created_at:
        return None
    try:
        created = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    except ValueError:
        return None
    return max(0.0, (datetime.now(timezone.utc) - created).total_seconds() / 86400)


def evaluate(opportunity: Opportunity) -> Opportunity:
    text = f"{opportunity.title}\\n{opportunity.body}".lower()
    if opportunity.reward_usd is None:
        opportunity.reward_usd, opportunity.reward_text = extract_reward(
            f"{opportunity.title}\\n{opportunity.body}"
        )

    score = 0.0
    reasons: list[str] = []

    if opportunity.reward_usd is not None:
        reward_points = min(35.0, 8.0 + 7.0 * max(0.0, len(str(int(opportunity.reward_usd))) - 1))
        score += reward_points
        reasons.append(f"explicit reward signal: ${opportunity.reward_usd:,.0f}")
    else:
        score -= 15.0
        reasons.append("no explicit USD reward found")

    clarity_hits = sorted(term for term in CLARITY_TERMS if term in text)
    if clarity_hits:
        bonus = min(24.0, 4.0 * len(clarity_hits))
        score += bonus
        reasons.append(f"objective scope/test signals: {', '.join(clarity_hits[:4])}")

    boring_hits = sorted(term for term in BORING_HIGH_VALUE_TERMS if term in text)
    if boring_hits:
        bonus = min(12.0, 2.0 * len(boring_hits))
        score += bonus
        reasons.append(f"repeatable technical-work signals: {', '.join(boring_hits[:4])}")

    age = _age_days(opportunity.created_at)
    if age is not None:
        if 3 <= age <= 60:
            score += 8.0
            reasons.append("open long enough to be real, but not obviously abandoned")
        elif age > 180:
            score -= 8.0
            reasons.append("very old opportunity; verify it is still funded")

    if opportunity.comments <= 2:
        score += 8.0
        reasons.append("low visible discussion/competition")
    elif opportunity.comments >= 15:
        score -= 8.0
        reasons.append("high visible discussion/competition")

    if any(term in text for term in SECURITY_TERMS):
        opportunity.safety_class = "authorised-security"
        opportunity.requires_human_gate = True
        score -= 5.0
        reasons.append("security work requires explicit scope validation before testing")

    if "kyc" in text:
        score -= 4.0
        reasons.append("KYC/eligibility friction")

    if "assigned" in text or "claimed" in text:
        score -= 15.0
        reasons.append("possible existing claimant; verify before spending effort")

    opportunity.score = round(max(0.0, min(100.0, score)), 2)
    opportunity.score_reasons = reasons
    if opportunity.score >= 45 and opportunity.reward_usd:
        opportunity.status = "QUALIFIED"
    return opportunity


def rank(opportunities: Iterable[Opportunity]) -> list[Opportunity]:
    return sorted((evaluate(op) for op in opportunities), key=lambda op: op.score, reverse=True)

"""Public-safe, credit-free opportunity ranking and outcome calibration.

This module never sends messages, visits sites, spends funds or uses API keys.
Inputs are previously discovered and HUMAN-VERIFIED public business signals.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
from pathlib import Path
from typing import Any

# Interpretable weights: an observed broken booking flow is more urgent than styling.
WEIGHTS = {
    "broken_booking_link": 30,
    "broken_contact_link": 28,
    "homepage_unreachable": 33,
    "homepage_error": 29,
    "https_unavailable": 17,
    "slow_server_response": 10,
    "accessibility_unlabelled_fields": 14,
    "accessibility_missing_alt": 7,
    "missing_spf": 8,
    "missing_dmarc": 8,
    "privacy_link_not_observed": 4,
    "stale_copyright": 3,
}
OFFERS = {
    "broken_booking_link": ("Booking flow repair", "Verify link and restore the customer's booking path"),
    "broken_contact_link": ("Enquiry flow repair", "Reproduce and repair a failed contact path"),
    "homepage_unreachable": ("Site recovery", "Diagnose outage and restore publicly reachable homepage"),
    "homepage_error": ("Site recovery", "Diagnose HTTP errors and repair the affected route"),
    "https_unavailable": ("HTTPS configuration", "Set up HTTPS and validate redirects"),
    "accessibility_unlabelled_fields": ("Accessible forms", "Inspect and fix accessible names for form fields"),
    "slow_server_response": ("Site performance investigation", "Measure bottleneck before making changes"),
}

def _tokens(value: Any) -> set[str]:
    if isinstance(value, (list, tuple, set)):
        parts = value
    elif isinstance(value, str):
        try:
            parsed = json.loads(value)
            parts = parsed if isinstance(parsed, list) else re.split(r"[,;|]", value)
        except json.JSONDecodeError:
            parts = re.split(r"[,;|]", value)
    else:
        parts = []
    tokens = set()
    for part in parts:
        if isinstance(part, dict):
            part = part.get("code") or part.get("issue") or part.get("type") or ""
        code = str(part).lower().strip().replace(" ", "_")
        if code:
            tokens.add(code)
    return tokens

def rank_candidate(row: dict[str, Any]) -> dict[str, Any]:
    """Evidence-based, conservative scoring; no asserted conversion probability."""
    issues = _tokens(row.get("issues") or row.get("issue_codes") or row.get("findings"))
    website = str(row.get("website") or row.get("website_url") or "").strip()
    evidence_url = str(row.get("source_url") or "").strip()
    known = sorted(issues & WEIGHTS.keys(), key=lambda name: (-WEIGHTS[name], name))
    score = min(100, sum(WEIGHTS[i] for i in known[:3]) + (8 if evidence_url else 0))
    best = known[0] if known else ""
    service, next_action = OFFERS.get(best, ("Manual research", "Verify the actual defect before pitching any service"))
    return {
        "business_name": str(row.get("business_name") or row.get("name") or "").strip(),
        "website": website,
        "evidence_url": evidence_url,
        "issues": known,
        "score": score,
        "service": service,
        "next_action": next_action,
        "needs_human_review": True,
        "confidence": "observed signal requiring manual verification" if known else "insufficient evidence",
        "source": str(row.get("source") or "").strip(),
        "location": str(row.get("location") or "").strip(),
    }

def posterior_conversion(customers: int, attempts: int) -> float:
    """Beta(1,19) conservative 5% prior, updated only by observed outcomes."""
    attempts = max(0, int(attempts))
    customers = min(attempts, max(0, int(customers)))
    return (1 + customers) / (20 + attempts)

def calibrate(candidates: list[dict[str, Any]], outcomes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Applies aggregate observed conversion to *ranked sectors*, not individuals."""
    stats: dict[str, list[int]] = {}
    for out in outcomes:
        service = str(out.get("service") or "")
        attempts = max(0, int(out.get("attempts") or 0))
        customers = min(attempts, max(0, int(out.get("customers") or 0)))
        if service not in stats:
            stats[service] = [0, 0]
        stats[service][0] += attempts
        stats[service][1] += customers
    for candidate in candidates:
        attempts, customers = stats.get(candidate["service"], [0, 0])
        candidate["observed_attempts"] = attempts
        candidate["observed_customers"] = customers
        candidate["posterior_conversion_scenario"] = round(posterior_conversion(customers, attempts), 4)
        candidate["calibrated_priority"] = round(
            candidate["score"] * (0.6 + 0.4 * min(2.0, candidate["posterior_conversion_scenario"] / 0.05)), 2
        )
        candidate["outcome_data_status"] = "observed" if attempts else "prior only, unvalidated"
    return sorted(candidates, key=lambda x: (-x["calibrated_priority"], x["business_name"]))

def load_records(path: str | Path) -> list[dict[str, Any]]:
    path = Path(path)
    if path.suffix.lower() == ".json":
        raw = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(raw, list):
            raise ValueError("JSON input must be an array of records")
        return raw
    with path.open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))

def export_json(records: list[dict[str, Any]], dest: str | Path):
    path = Path(dest)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(records, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

def prepare_queue(rows: list[dict[str, Any]], *, min_score: int = 12) -> list[dict[str, Any]]:
    dedup: dict[str, dict[str, Any]] = {}
    for row in rows:
        x = rank_candidate(row)
        if x["score"] < min_score or not x["website"].startswith(("https://", "http://")):
            continue
        key = x["website"].lower().rstrip("/")
        if key not in dedup or x["score"] > dedup[key]["score"]:
            dedup[key] = x
    return sorted(dedup.values(), key=lambda x: (-x["score"], x["business_name"]))

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Credit-free agency opportunity triage; no outreach or site changes.")
    parser.add_argument("input", help="Octominer JSON or CSV containing public business signals")
    parser.add_argument("--out", default="output/agency-opportunities.json")
    parser.add_argument("--outcomes", help="Optional CSV/JSON with service,attempts,customers (observed only)")
    parser.add_argument("--min-score", type=int, default=12)
    args = parser.parse_args(argv)
    candidates = prepare_queue(load_records(args.input), min_score=args.min_score)
    if args.outcomes:
        candidates = calibrate(candidates, load_records(args.outcomes))
    export_json(candidates, args.out)
    print(json.dumps({"ranked": len(candidates), "file": args.out, "outreach_sent": 0, "purchases": 0}))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())

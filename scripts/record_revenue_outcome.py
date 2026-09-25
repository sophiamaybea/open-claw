#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json

from revenue_swarm.learning import EvidenceLearner


def main() -> None:
    parser = argparse.ArgumentParser(description="Record external evidence for a Revenue Swarm strategy.")
    parser.add_argument("strategy")
    parser.add_argument(
        "outcome",
        choices=[
            "INVALID",
            "OUT_OF_SCOPE",
            "REJECTED",
            "NO_RESPONSE",
            "SOLVED_VERIFIED",
            "SUBMITTED",
            "ACCEPTED",
            "PAYOUT_VERIFIED",
        ],
    )
    parser.add_argument("--payout-usd", type=float, default=0.0)
    parser.add_argument(
        "--state",
        default="revenue_swarm/state/strategy_stats.json",
    )
    args = parser.parse_args()

    learner = EvidenceLearner(args.state)
    learner.record(args.strategy, args.outcome, payout_usd=args.payout_usd)
    print(json.dumps(learner.snapshot(), indent=2))


if __name__ == "__main__":
    main()

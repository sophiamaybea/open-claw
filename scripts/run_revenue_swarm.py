#!/usr/bin/env python3
from __future__ import annotations

import json

from revenue_swarm.orchestrator import run


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))

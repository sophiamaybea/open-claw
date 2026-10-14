"""Read-only public data sampling. NOT an executable DEX/CEX quote or order book."""
from __future__ import annotations
from datetime import datetime, timezone
from .engine import Snapshot
import json
import time
import urllib.request
import urllib.parse

USER_AGENT = "MicroCompound-Research/0.1 (read-only synthetic simulation)"

def get_json(url: str, timeout: int = 12):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"}, method="GET")
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)

def sample() -> list[Snapshot]:
    """Public sampled prices with explicit proxy limitations. Fail on unavailable feeds."""
    now = datetime.now(timezone.utc).isoformat()
    sol = get_json("https://api.binance.com/api/v3/ticker/24hr?symbol=SOLUSDT")
    sol_price = float(sol["lastPrice"])
    data = get_json("https://api.dexscreener.com/latest/dex/search?q=" + urllib.parse.quote("SOL meme"))
    pairs = [p for p in data.get("pairs", []) if p.get("chainId") == "solana" and p.get("priceUsd") and p.get("liquidity", {}).get("usd")]
    pairs.sort(key=lambda p: float(p.get("liquidity", {}).get("usd") or 0), reverse=True)
    if not pairs:
        raise RuntimeError("No accessible Solana meme discovery pairs; no fabricated fallback")
    p = pairs[0]
    t = p.get("txns", {}).get("m5", {})
    v = p.get("volume", {}).get("m5", 0)
    # The symbol is labelled LIVE-MEME internally; the actual pool address is not traded.
    return [
        Snapshot(now, "SOL/USDT", sol_price, "binance-public-ticker", 2_000_000, 100_000, 100, 100),
        Snapshot(now, "DEMO-MEME/USDC", float(p["priceUsd"]), "dexscreener-public-aggregate", float(p.get("liquidity", {}).get("usd", 0)), float(v or 0), int(t.get("buys") or 0), int(t.get("sells") or 0)),
    ]

def collect(ticks: int = 12, poll_seconds: float = 3) -> list[Snapshot]:
    collected: list[Snapshot] = []
    for i in range(ticks):
        try:
            batch = sample()
        except (Exception) as exc:
            # Explicit missing data, not substituted by fake or old snapshots.
            print(f"Public feed unavailable at sample {i+1}: {type(exc).__name__}: {exc}")
        else:
            collected.extend(batch)
        if i + 1 != ticks:
            time.sleep(max(0, poll_seconds))
    if not collected:
        raise RuntimeError("No public data available. Run fixture mode instead.")
    return collected

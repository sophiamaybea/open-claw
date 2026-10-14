"""Standard-library-only event simulator. No live trading or real wallet integration."""
from __future__ import annotations
from dataclasses import asdict, dataclass, field
from decimal import Decimal
from collections import deque
from datetime import datetime, timezone, timedelta
from typing import Any
import hashlib
import json
import math
import random

D = lambda value: Decimal(str(value))
ARMS = ("momentum", "scalper")

@dataclass(frozen=True)
class Snapshot:
    ts: str
    symbol: str
    price: float
    source: str
    liquidity_usd: float = 0.0
    volume_5m_usd: float = 0.0
    buys_5m: int = 0
    sells_5m: int = 0
    quote_age_ms: int = 0

@dataclass
class Position:
    symbol: str
    strategy: str
    qty: Decimal
    entry_price: Decimal
    entry_notional: Decimal
    entry_fee: Decimal
    opened_index: int

@dataclass
class Wallet:
    """A fictional USD ledger, deliberately not a blockchain key store."""
    cash_usd: Decimal = field(default_factory=lambda: D("3.00"))
    position: Position | None = None
    total_fees: Decimal = field(default_factory=lambda: D("0"))
    realised_pnl: Decimal = field(default_factory=lambda: D("0"))
    trades: list[dict[str, Any]] = field(default_factory=list)
    real_funds_connected: bool = False

    def nav(self, prices: dict[str, float]) -> Decimal:
        result = self.cash_usd
        if self.position:
            result += self.position.qty * D(prices.get(self.position.symbol, float(self.position.entry_price)))
        return result

    def buy(self, symbol: str, strategy: str, price: float, step: int, entry_cost_frac: Decimal, max_fraction: Decimal) -> bool:
        if self.position is not None or price <= 0 or not math.isfinite(price):
            return False
        notional = self.cash_usd * max_fraction
        fee = notional * entry_cost_frac
        # Require unspent cash to cover a plausible exit and prevent $0 dust fills.
        if notional <= D("0.01") or self.cash_usd < notional + fee + notional * entry_cost_frac:
            return False
        qty = notional / D(price)
        self.cash_usd -= notional + fee
        self.total_fees += fee
        self.position = Position(symbol, strategy, qty, D(price), notional, fee, step)
        assert self.cash_usd >= 0
        return True

    def sell(self, price: float, step: int, exit_cost_frac: Decimal) -> dict[str, Any] | None:
        p = self.position
        if p is None or not math.isfinite(price) or price <= 0:
            return None
        gross = p.qty * D(price)
        fee = gross * exit_cost_frac
        proceeds = gross - fee
        pnl = proceeds - p.entry_notional - p.entry_fee
        self.cash_usd += proceeds
        self.total_fees += fee
        self.realised_pnl += pnl
        event = {
            "strategy": p.strategy, "symbol": p.symbol, "entry_price": float(p.entry_price),
            "exit_price": price, "net_pnl_usd": round(float(pnl), 8),
            "total_cost_usd": round(float(p.entry_fee + fee), 8),
            "held_ticks": step - p.opened_index,
        }
        self.trades.append(event)
        self.position = None
        assert self.cash_usd >= 0
        return event

@dataclass(frozen=True)
class Configuration:
    initial_usd: float = 3.0
    max_position_fraction: float = 0.35
    max_drawdown_fraction: float = 0.20
    max_losses: int = 5
    max_quote_age_ms: int = 1500
    minimum_meme_liquidity_usd: float = 25000.0
    minimum_meme_volume_5m_usd: float = 10000.0
    minimum_meme_buys_5m: int = 10
    meme_roundtrip_cost_bps: float = 260.0
    scalp_roundtrip_cost_bps: float = 32.0
    hold_ticks: int = 4
    seed: int = 7

class DiscountedRouter:
    """Conservative discounted reward baseline; not an unimplemented Thompson sampler."""
    def __init__(self):
        self.value = {a: -5.0 for a in ARMS}
        self.observations = {a: 0 for a in ARMS}
        self.choices = {a: 0 for a in ARMS}
        self.rng = random.Random(7)

    def learn(self, arm: str, reward_bps: float):
        bounded = max(-1000.0, min(1000.0, reward_bps))
        self.value[arm] = 0.85 * self.value[arm] + 0.15 * bounded
        self.observations[arm] += 1

    def choose(self, proposals: dict[str, dict[str, Any]]) -> str:
        eligible = [a for a in ARMS if proposals[a]["eligible"]]
        if not eligible:
            return "HOLD"
        # Deterministic, auditable explore-then-discounted-score policy.
        chosen = min(eligible, key=lambda a: self.observations[a]) if min(self.observations[a] for a in eligible) < 3 else max(
            eligible, key=lambda a: self.value[a] + proposals[a]["gross_edge_bps"] - proposals[a]["cost_bps"]
        )
        if self.observations[chosen] >= 3 and self.value[chosen] + proposals[chosen]["gross_edge_bps"] - proposals[chosen]["cost_bps"] <= 0:
            return "HOLD"
        self.choices[chosen] += 1
        return chosen

def generate_fixture(minutes: int = 60, interval_seconds: int = 10, seed: int = 7) -> list[Snapshot]:
    """Synthetic deliberately non-predictive path, clearly labelled fixture."""
    r = random.Random(seed)
    start = datetime(2026, 1, 1, tzinfo=timezone.utc)
    sol, meme = 150.0, 0.004
    obs: list[Snapshot] = []
    for step in range(max(1, minutes * 60 // interval_seconds)):
        ts = (start + timedelta(seconds=step * interval_seconds)).isoformat()
        regime = math.sin(step / 31.0)
        sol *= math.exp((0.00005 * regime) + r.gauss(0, 0.00095))
        meme *= math.exp((0.004 * regime) + r.gauss(0, 0.013))
        obs.extend([
            Snapshot(ts, "SOL/USDT", sol, "synthetic-fixture", 2_000_000, 100_000, 100, 90),
            Snapshot(ts, "DEMO-MEME/USDC", meme, "synthetic-fixture", 60000, 18000, 75, 37),
        ])
    return obs

class Simulator:
    def __init__(self, cfg: Configuration):
        self.cfg = cfg
        self.wallets = {"primary": Wallet(D(cfg.initial_usd)), "momentum": Wallet(D(cfg.initial_usd)), "scalper": Wallet(D(cfg.initial_usd))}
        self.router = DiscountedRouter()
        self.history: dict[str, deque[float]] = {"SOL/USDT": deque(maxlen=12), "DEMO-MEME/USDC": deque(maxlen=12)}
        self.last_prices: dict[str, float] = {}
        self.decisions: list[dict[str, Any]] = []
        self.equity: list[dict[str, Any]] = []
        self.rejections: dict[str, int] = {}
        self.loss_streak = 0
        self.peak_nav = D(cfg.initial_usd)
        self.max_drawdown = 0.0
        self.step = 0
        self.halted = False
        self.rewarded_trades: dict[str, int] = {a: 0 for a in ARMS}

    def reject(self, reason: str):
        self.rejections[reason] = self.rejections.get(reason, 0) + 1

    def cost(self, arm: str) -> Decimal:
        return D(self.cfg.meme_roundtrip_cost_bps if arm == "momentum" else self.cfg.scalp_roundtrip_cost_bps) / D(20000)

    def proposal(self, arm: str, snap: Snapshot | None) -> dict[str, Any]:
        cost_bps = self.cfg.meme_roundtrip_cost_bps if arm == "momentum" else self.cfg.scalp_roundtrip_cost_bps
        base = {"eligible": False, "gross_edge_bps": 0.0, "cost_bps": cost_bps, "symbol": snap.symbol if snap else ""}
        if snap is None:
            return base
        if snap.quote_age_ms > self.cfg.max_quote_age_ms:
            self.reject("STALE_QUOTE")
            return base
        h = list(self.history.get(snap.symbol, []))
        if len(h) < 5 or h[-5] <= 0:
            return base
        change_bps = (snap.price / h[-5] - 1) * 10000
        if arm == "momentum":
            if snap.liquidity_usd < self.cfg.minimum_meme_liquidity_usd or snap.volume_5m_usd < self.cfg.minimum_meme_volume_5m_usd or snap.buys_5m < self.cfg.minimum_meme_buys_5m:
                self.reject("MEME_LIQUIDITY_OR_ACTIVITY")
                return base
            if snap.sells_5m == 0:
                self.reject("NO_SELL_ACTIVITY_PROXY")
                return base
            # This is not an actual sell-route verification; public aggregate feeds cannot prove sellability.
            edge = max(0.0, change_bps * 1.6)
            base.update(eligible=change_bps > 30 and edge > cost_bps + 30, gross_edge_bps=edge)
        else:
            # Mean-reversion sign convention: buy after a slight dip, strictly cost-aware.
            edge = max(0.0, -change_bps * 1.7)
            base.update(eligible=change_bps < -8 and edge > cost_bps + 15, gross_edge_bps=edge)
        return base

    def close_due(self, name: str, symbol_snapshots: dict[str, Snapshot], step: int, force: bool = False):
        w = self.wallets[name]
        p = w.position
        if p is None:
            return
        if not force and step - p.opened_index < self.cfg.hold_ticks:
            return
        snap = symbol_snapshots.get(p.symbol)
        if snap is None:
            if force:
                self.reject("UNMARKED_OPEN_POSITION")
            return
        event = w.sell(snap.price, step, self.cost(p.strategy))
        if event and name in ARMS:
            # Reward based only on realised net returns, no future information.
            reward = (D(event["net_pnl_usd"]) / max(D("0.0001"), p.entry_notional)) * 10000
            self.router.learn(name, float(reward))
            self.rewarded_trades[name] += 1
        if event and name == "primary":
            self.loss_streak = self.loss_streak + 1 if event["net_pnl_usd"] < 0 else 0

    def run(self, observations: list[Snapshot]) -> dict[str, Any]:
        pairs: dict[str, dict[str, Snapshot]] = {}
        for s in observations:
            if s.price <= 0 or not math.isfinite(s.price):
                self.reject("INVALID_PRICE")
                continue
            pairs.setdefault(s.ts, {})[s.symbol] = s
        for step, (ts, snapshots) in enumerate(sorted(pairs.items())):
            self.step = step
            for s in snapshots.values():
                self.last_prices[s.symbol] = s.price
                self.history.setdefault(s.symbol, deque(maxlen=12)).append(s.price)
            for name in ("primary", *ARMS):
                self.close_due(name, snapshots, step)
            nav = self.wallets["primary"].nav(self.last_prices)
            self.peak_nav = max(self.peak_nav, nav)
            dd = float((self.peak_nav - nav) / self.peak_nav) if self.peak_nav else 0.0
            self.max_drawdown = max(self.max_drawdown, dd)
            if dd >= self.cfg.max_drawdown_fraction or self.loss_streak >= self.cfg.max_losses:
                self.halted = True
                self.reject("CIRCUIT_BREAKER")
            proposals = {
                "momentum": self.proposal("momentum", snapshots.get("DEMO-MEME/USDC") or next((s for s in snapshots.values() if "MEME" in s.symbol), None)),
                "scalper": self.proposal("scalper", snapshots.get("SOL/USDT")),
            }
            # Each strategy has its own fully independent shadow account.
            for arm in ARMS:
                p = proposals[arm]
                if p["eligible"] and not self.halted:
                    snap = snapshots.get(p["symbol"])
                    if snap:
                        self.wallets[arm].buy(snap.symbol, arm, snap.price, step, self.cost(arm), D(self.cfg.max_position_fraction))
            selected = self.router.choose(proposals) if not self.halted else "HOLD"
            action, reason = "HOLD", "NONE"
            if selected != "HOLD" and self.wallets["primary"].position is None:
                p = proposals[selected]
                snap = snapshots.get(p["symbol"])
                if snap and self.wallets["primary"].buy(snap.symbol, selected, snap.price, step, self.cost(selected), D(self.cfg.max_position_fraction)):
                    action = "SIMULATED_BUY"
                else:
                    self.reject("INSUFFICIENT_VIRTUAL_CASH")
                    reason = "INSUFFICIENT_VIRTUAL_CASH"
            elif selected == "HOLD":
                reason = "NO_COST_ADJUSTED_CANDIDATE"
            else:
                reason = "POSITION_OPEN"
            self.decisions.append({"time": ts, "strategy": selected, "action": action, "reason": reason,
                                   "symbol": proposals[selected]["symbol"] if selected in ARMS else "",
                                   "gross_edge_bps": round(proposals[selected]["gross_edge_bps"], 2) if selected in ARMS else 0,
                                   "cost_bps": proposals[selected]["cost_bps"] if selected in ARMS else 0})
            self.equity.append({"time": ts, "primary": round(float(self.wallets["primary"].nav(self.last_prices)), 8),
                                "momentum": round(float(self.wallets["momentum"].nav(self.last_prices)), 8),
                                "scalper": round(float(self.wallets["scalper"].nav(self.last_prices)), 8)})
        # End-of-run liquidation is necessary to report fully realised NAV.
        for name in ("primary", *ARMS):
            self.close_due(name, {s: Snapshot("final", s, p, "last-observation") for s, p in self.last_prices.items()}, self.step, force=True)
        return self.report(observations)

    def report(self, observations: list[Snapshot]) -> dict[str, Any]:
        primary = self.wallets["primary"]
        nav = float(primary.cash_usd)
        arms = {a: round(float(self.wallets[a].cash_usd), 8) for a in ARMS}
        return {
            "project": "Micro Compound", "version": "0.1.0", "mode": "simulation-only",
            "market_data": "synthetic-fixture" if observations and all(s.source == "synthetic-fixture" for s in observations) else "sampled-public-observations",
            "warning": "All balances, orders and profits are simulated. No real funds or exchange orders.",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "initial_virtual_usd": self.cfg.initial_usd,
            "virtual_nav": round(nav, 8), "net_pnl": round(nav - self.cfg.initial_usd, 8),
            "max_drawdown_pct": round(self.max_drawdown * 100, 5),
            "total_costs": round(float(primary.total_fees), 8),
            "primary_trades": primary.trades,
            "decisions": self.decisions[-40:],
            "equity": self.equity,
            "shadow": arms,
            "router": {"values_bps": self.router.value, "observations": self.router.observations, "choices": self.router.choices},
            "rejections": self.rejections,
            "gate_provider": "deterministic only; no Jev integration",
            "halted": self.halted,
            "ticks": len(self.equity),
            "real_funds_connected": False,
            "limitations": ["No actual token sell-route check", "No exchange minimum orders", "No order book or delayed executable quotes", "Synthetic cost and latency assumptions", "No funded chain wallet", "No online learning beyond discounted router", "No genuine counterfactual market impact"],
            "config": asdict(self.cfg),
            "config_sha256": hashlib.sha256(json.dumps(asdict(self.cfg), sort_keys=True).encode()).hexdigest(),
        }

def export(report: dict[str, Any], output_dir: str) -> None:
    from pathlib import Path
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    (out / "latest.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    with (out / "decisions.jsonl").open("w", encoding="utf-8") as f:
        for d in report["decisions"]:
            f.write(json.dumps(d) + "\n")

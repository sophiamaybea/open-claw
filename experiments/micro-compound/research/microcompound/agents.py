"""Delayed-label online learning and bounded, paper-only research director.

No signing capability, no authenticated exchange operations and no wallet secrets.
Optional 'river' models, with an auditable pure-Python fallback if unavailable.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from collections import defaultdict
from decimal import Decimal
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import urllib.request
from typing import Any

from .engine import ARMS, Configuration, D, DiscountedRouter, Simulator, Snapshot, Wallet, generate_fixture, export


class IncrementalClassifier:
    """True incremental classifier; prequential prediction then train, after the trade exits."""
    def __init__(self, *, force_fallback: bool = False):
        self.samples = 0
        self.brier_total = 0.0
        self.predictions: list[dict[str, Any]] = []
        self.backend = 'online-logistic-python'
        self.weights = [0.0] * 5
        self.bias = 0.0
        self.model = None
        if not force_fallback:
            try:
                from river import compose, preprocessing, linear_model
                self.model = compose.Pipeline(preprocessing.StandardScaler(), linear_model.LogisticRegression())
                self.backend = 'river-logistic-regression'
            except ImportError:
                pass

    @staticmethod
    def _vector(x: dict[str, float]) -> list[float]:
        # Bounded normalised scalars to avoid exploding online updates.
        return [
            max(-2.0, min(2.0, x.get('price_change_bps', 0.0) / 300)),
            max(0.0, min(2.0, x.get('edge_bps', 0.0) / 500)),
            max(0.0, min(2.0, x.get('cost_bps', 0.0) / 300)),
            max(0.0, min(2.0, x.get('liquidity_log', 0.0) / 14)),
            max(0.0, min(2.0, x.get('activity', 0.0) / 150)),
        ]

    def predict_one(self, x: dict[str, float]) -> float:
        if self.model is not None:
            return float(self.model.predict_proba_one(x).get(True, 0.5))
        z = max(-30, min(30, self.bias + sum(w * v for w,v in zip(self.weights, self._vector(x)))))
        return 1.0 / (1.0 + math.exp(-z))

    def learn_one(self, x: dict[str, float], successful: bool, *, trade_id: str, exit_index: int):
        # The quality metric MUST be measured before fitting this label.
        prior = self.predict_one(x)
        y = float(successful)
        self.brier_total += (prior - y)**2
        self.predictions.append({'trade_id': trade_id, 'outcome_at_step': exit_index, 'prequential_probability': round(prior,6), 'win': bool(successful)})
        if self.model is not None:
            self.model.learn_one(x, bool(successful))
        else:
            residual = y - prior
            rate = .04
            self.bias += rate * residual
            self.weights = [max(-4,min(4,w + rate * residual * v)) for w,v in zip(self.weights, self._vector(x))]
        self.samples += 1

    def report(self) -> dict[str, Any]:
        return {'backend':self.backend, 'completed_labels':self.samples, 'prequential_brier':round(self.brier_total / self.samples, 6) if self.samples else None}


class LearningRouter(DiscountedRouter):
    """Evidence-gated online classifier plus EWMA router baseline. Never raises to enable trades."""
    def __init__(self, *, force_fallback=False):
        super().__init__()
        self.models = {arm: IncrementalClassifier(force_fallback=force_fallback) for arm in ARMS}
        self.latest: dict[str, dict[str,float]] = {}
        self.completed_labels: list[dict[str, Any]] = []
        self.model_driven_choices = 0
        self.model_evaluations = 0
        self.model_vetoes = 0

    def choose(self, proposals: dict[str, dict[str, Any]]) -> str:
        # Hard-eligibility from the original deterministic risk/cost rules always wins.
        eligible = [arm for arm in ARMS if proposals[arm]['eligible']]
        if not eligible:
            return 'HOLD'
        ready = [arm for arm in eligible if self.models[arm].samples >= 8]
        if not ready:
            return super().choose(proposals)
        # A model may veto a candidate or change relative score; it cannot make an
        # ineligible candidate tradable, increase portfolio risk, or override HOLD.
        scores = {arm: self.value[arm] + proposals[arm]['gross_edge_bps']
                  - proposals[arm]['cost_bps'] for arm in eligible}
        for arm in ready:
            probability = self.models[arm].predict_one(self.latest.get(arm, {}))
            self.model_evaluations += 1
            # Experimental weak adjustment with a deliberately bounded influence.
            scores[arm] += max(-35., min(35., (probability - .5) * 70))
            if probability < .48:
                scores[arm] = -float('inf')
                self.model_vetoes += 1
        best = max(scores, key=scores.get)
        if scores[best] <= 0:
            return 'HOLD'
        self.choices[best] += 1
        if best in ready:
            self.model_driven_choices += 1
        return best

    def observed_shadow_close(self, arm: str, x: dict[str, float], trade: dict, step: int):
        trade_id = hashlib.sha256(f'{arm}:{x.get("price_change_bps")}:{step}:{self.models[arm].samples}'.encode()).hexdigest()[:16]
        self.models[arm].learn_one(x, trade['net_pnl_usd'] > 0, trade_id=trade_id, exit_index=step)
        self.completed_labels.append({'trade_id':trade_id, 'arm':arm, 'exit_step':step, 'pnl':trade['net_pnl_usd']})


class LearningWallet(Wallet):
    def __init__(self, *args, name:str, engine:'LearningSimulator', **kwargs):
        super().__init__(*args, **kwargs)
        self.name = name
        self.engine = engine
        self.open_features: dict[str,float] | None = None
        self.last_open_step: int | None = None

    def buy(self, symbol, strategy, price, step, entry_cost_frac, max_fraction):
        ok = super().buy(symbol, strategy, price, step, entry_cost_frac, max_fraction)
        if ok:
            self.open_features = dict(self.engine.router.latest.get(strategy, {}))
            self.last_open_step = step
        return ok

    def sell(self, price, step, exit_cost_frac):
        p = self.position
        trade = super().sell(price, step, exit_cost_frac)
        if trade is not None and p is not None and self.name in ARMS:
            assert self.last_open_step is not None and step >= self.last_open_step
            assert self.open_features is not None
            # Final run liquidation on the entry tick has no future price; no valid label.
            if step > self.last_open_step:
                self.engine.router.observed_shadow_close(self.name, self.open_features, trade, step)
        self.open_features = None
        self.last_open_step = None
        return trade


class LearningSimulator(Simulator):
    def __init__(self, cfg:Configuration, *, force_fallback:bool=False):
        super().__init__(cfg)
        self.router = LearningRouter(force_fallback=force_fallback)
        self.wallets = {name:LearningWallet(D(cfg.initial_usd),name=name,engine=self) for name in ('primary',*ARMS)}

    def proposal(self, arm:str, snap:Snapshot|None) -> dict[str,Any]:
        p = super().proposal(arm,snap)
        h = list(self.history.get(snap.symbol, [])) if snap else []
        change = (h[-1]/h[-5]-1)*10000 if len(h)>=5 and h[-5]>0 else 0.0
        x = {
            'price_change_bps': max(-1500.,min(1500.,change)),
            'edge_bps':float(p['gross_edge_bps']),
            'cost_bps':float(p['cost_bps']),
            'liquidity_log':math.log1p(max(0,snap.liquidity_usd)) if snap else 0.0,
            'activity': min(400.,float((snap.buys_5m+snap.sells_5m) if snap else 0))
        }
        self.router.latest[arm] = x
        return p

    def report(self, observations):
        result = super().report(observations)
        result['version'] = '0.2.0'
        result['learning'] = {
            'observations_are_shadow_trades':True,
            'timing':'predict at entry; learn after shadow exit only',
            'models':{a:self.router.models[a].report() for a in ARMS},
            'model_driven_choices':self.router.model_driven_choices,
            'model_evaluations':self.router.model_evaluations,
            'model_vetoes':self.router.model_vetoes,
            'recent_labelled_exits':self.router.completed_labels[-15:],
            'prequential_metrics_not_in_sample':True,
        }
        result['limitations'] = [x for x in result['limitations'] if 'No online learning beyond discounted router' not in x]
        result['limitations'].extend(['Online win-rate probability is not a prediction of positive expectancy','Shadow trades share observed historical prices, not an impact-corrected alternate reality','River optional: pure-Python fallback is used if River is not installed'])
        return result


def research_memo(sweep:dict[str,Any]) -> dict[str,Any]:
    """Local deterministic director: no model tokens, no ability to edit code or submit an order."""
    rows=sweep['runs']
    n=len(rows)
    prof=sum(x['net_pnl']>0 for x in rows)
    all_neg=all(x['net_pnl']<=0 for x in rows)
    findings=[f'{prof}/{n} synthetic fixtures finished above starting virtual NAV after modelled costs.',
              'No observed replay is evidence of future profit or executable fills.']
    if all_neg: findings.append('No profitable synthetic run in this sweep. HOLD is the strongest comparator for this data.')
    if any(x['halted'] for x in rows): findings.append('At least one run tripped the simulated circuit breaker.')
    fee_panels = {str(f):[v['net_pnl'] for v in rows if v['cost_mult']==f] for f in sorted(set(x['cost_mult'] for x in rows))}
    for k,ps in fee_panels.items():
        findings.append(f'At {k}x modelled fees: {sum(ps)/len(ps):+.5f} average virtual net P&L over {len(ps)} runs.')
    return {'provider':'local-deterministic', 'generated_at':datetime.now(timezone.utc).isoformat(), 'mode':'paper-research',
            'findings':findings,
            'proposed_tests':['Obtain and archive executable bid/ask order-book snapshots, not ticker closes','Verify fee tiers and pair minimums before claiming tiny-ticket viability','Run separate blind holdout regimes and 2x/5x slippage stress before evaluating an online learner'],
            'policy':'research proposals only; changes require PR, CI and human review; never issue orders'}


def cloud_research_memo(sweep:dict[str,Any]) -> dict[str,Any]:
    """Optional Groq chat-completion. One bounded HTTP call ONLY when explicitly enabled.
    Disabled by default. A model cannot submit trades or patch this repository.
    """
    key=os.environ.get('GROQ_API_KEY','')
    if not key:
        return {**research_memo(sweep),'cloud_status':'not_configured'}
    prompt={'task':'Critique these PAPER-ONLY cryptocurrency simulation results. Output valid JSON with keys findings, proposed_tests. Do not promise returns, recommend trades, or request secrets.',
            'summaries':sweep['summary'],'worst_cases':sorted(sweep['runs'],key=lambda x:x['net_pnl'])[:4]}
    request=urllib.request.Request('https://api.groq.com/openai/v1/chat/completions',
        data=json.dumps({'model':os.environ.get('GROQ_MODEL','openai/gpt-oss-20b'), 'messages':[{'role':'system','content':'You are an independent, cautious experimental design critic. No execution tools, no orders.'}, {'role':'user','content':json.dumps(prompt)}], 'temperature':0,'max_completion_tokens':800}).encode(),
        headers={'Authorization':'Bearer '+key,'Content-Type':'application/json'},method='POST')
    try:
        with urllib.request.urlopen(request,timeout=15) as resp:
            parsed=json.load(resp)
        txt=parsed['choices'][0]['message']['content']
        memo=json.loads(txt)
        if not isinstance(memo,dict) or not isinstance(memo.get('findings'),list) or not isinstance(memo.get('proposed_tests'),list):
            raise ValueError('Model output not valid research memo schema')
        return {'provider':'groq', 'mode':'paper-research','findings':[str(i)[:400] for i in memo['findings'][:6]], 'proposed_tests':[str(i)[:400] for i in memo['proposed_tests'][:6]], 'policy':'advisory only: no orders, keys or code edits'}
    except (ValueError,KeyError,TimeoutError, OSError) as exc:
        return {**research_memo(sweep),'cloud_status':'failed_closed','cloud_error_type':type(exc).__name__}


def run_sweep(*, seeds=range(3,15), capitals=(1.,3.,10.), cost_mults=(1.,2.,5.),minutes=60,force_fallback=False)->dict[str,Any]:
    runs=[]
    for seed in seeds:
        path=generate_fixture(minutes=minutes,seed=seed)
        for initial in capitals:
            for cost_mult in cost_mults:
                cfg=Configuration(initial_usd=float(initial),seed=seed,meme_roundtrip_cost_bps=260.0*cost_mult,scalp_roundtrip_cost_bps=32.0*cost_mult)
                report=LearningSimulator(cfg,force_fallback=force_fallback).run(path)
                baseline=Simulator(cfg).run(path)
                runs.append({'model_evaluations':report['learning']['model_evaluations'],
                             'model_vetoes':report['learning']['model_vetoes'],
                             'legacy_router_pnl':baseline['net_pnl'],
                             'learning_minus_legacy_pnl':round(report['net_pnl']-baseline['net_pnl'],8),
                             'net_return_pct':round(100*report['net_pnl']/initial,5),
                             'seed':seed,'start_usd':initial,'cost_mult':cost_mult,'virtual_nav':report['virtual_nav'],
                             'net_pnl':report['net_pnl'],'primary_trades':len(report['primary_trades']),
                             'momentum_shadow':report['shadow']['momentum'],'scalper_shadow':report['shadow']['scalper'],
                             'halted':report['halted'],'learning':report['learning']})
    losses=[v['net_pnl'] for v in runs]
    relative=[v['net_return_pct'] for v in runs]
    summary={'run_count':len(runs),'model_evaluations':sum(x['model_evaluations'] for x in runs),
             'model_vetoes':sum(x['model_vetoes'] for x in runs),
             'unique_seeds':len(set(x['seed'] for x in runs)),
             'mean_pnl':round(sum(losses)/len(losses),8),
             'mean_return_pct':round(sum(relative)/len(relative),5),
             'beat_original_router_fraction':round(sum(x['learning_minus_legacy_pnl']>0 for x in runs)/len(runs),6),
             'beat_hold_fraction':round(sum(x['net_pnl']>0 for x in runs)/len(runs),6),
             'profitable_fraction':round(sum(x>0 for x in losses)/len(losses),6),
             'worst_pnl':min(losses),'best_pnl':max(losses),'data_source':'deterministic synthetic fixture',
             'execution_model':'approximate synthetic price+fixed costs; NOT executable prices',
             'real_money_usd':0, 'hold_baseline_pnl_usd':0,
             'interpretation':'Results are neither live returns nor evidence of profitable trading.'}
    payload={'experiment':'Micro Compound fast learning sweep','created_at':datetime.now(timezone.utc).isoformat(),'summary':summary,'runs':runs}
    payload['director']=research_memo(payload)
    return payload


def main():
    p=argparse.ArgumentParser(description='Micro Compound autonomous paper-only learner; never trades real funds')
    p.add_argument('--mode',choices=['sweep','fixture','public'],default='sweep')
    p.add_argument('--minutes',type=int,default=60)
    p.add_argument('--seeds',type=int,default=12,help='Number of deterministic independent fixture seeds')
    p.add_argument('--output',default='research-results')
    p.add_argument('--groq-review',action='store_true',help='Use 1 optional cloud model call; never required')
    p.add_argument('--force-fallback',action='store_true')
    args=p.parse_args()
    if args.minutes<2 or args.minutes>1440 or args.seeds<1 or args.seeds>300: p.error('Invalid minutes or seeds')
    out=Path(args.output)
    out.mkdir(parents=True,exist_ok=True)
    if args.mode=='sweep':
        data=run_sweep(seeds=range(3,args.seeds+3),minutes=args.minutes,force_fallback=args.force_fallback)
        if args.groq_review: data['director']=cloud_research_memo(data)
        (out/'learning-sweep.json').write_text(json.dumps(data,indent=2),encoding='utf-8')
        (out/'research-director.json').write_text(json.dumps(data['director'],indent=2),encoding='utf-8')
        # Representative run visualisable by the existing Python site's JSON report format
        single=LearningSimulator(Configuration(initial_usd=3.0),force_fallback=args.force_fallback).run(generate_fixture(minutes=args.minutes,seed=7))
        export(single,str(out))
        print(json.dumps({'summary':data['summary'],'director':data['director'],'output':str(out)},indent=2))
    elif args.mode=='fixture':
        single=LearningSimulator(Configuration(initial_usd=3.0),force_fallback=args.force_fallback).run(generate_fixture(minutes=args.minutes,seed=7))
        export(single,str(out))
        print(json.dumps({'virtual_nav':single['virtual_nav'],'learning':single['learning']},indent=2))
    else:
        from .feeds import collect
        observations=collect(ticks=12,poll_seconds=3.0)
        single=LearningSimulator(Configuration(initial_usd=3.0),force_fallback=args.force_fallback).run(observations)
        export(single,str(out))
        print(json.dumps({'virtual_nav':single['virtual_nav'],'source':single['market_data'],'learning':single['learning']},indent=2))

if __name__=='__main__': main()

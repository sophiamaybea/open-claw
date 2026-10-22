"""Exact bounded mathematical engine for bounty triage (SymPy, MIT + BSD ecosystem).

Any probabilities are INPUT ASSUMPTIONS, not estimates of real payout odds.
Decision labels are rules, NOT an ML model and NOT claims of Jev/Laya calibration.
"""
from __future__ import annotations
from fractions import Fraction
from decimal import Decimal, InvalidOperation
from math import isfinite
from itertools import combinations
from sympy import Rational, simplify, symbols, diff, integrate, solve, Eq

MAX_ITEMS=16
MAX_HOURS=200

class MathError(ValueError): pass

def rat(v, name="number"):
    if isinstance(v,bool) or not isinstance(v,(int,float,str,Decimal)):
        raise MathError(name+" must be a finite number")
    try:
        d=Decimal(str(v))
        if not d.is_finite(): raise MathError(name+" must be finite")
        if d.copy_abs()>Decimal("1000000000"): raise MathError(name+" out of range")
        return Rational(str(d))
    except (InvalidOperation,TypeError,ValueError) as e:
        raise MathError(name+" must be a finite decimal") from e

def value(v):
    return float(v.evalf(16)) if hasattr(v,"evalf") else float(v)

def require_range(v, name, minimum, maximum):
    x=rat(v,name)
    if x<minimum or x>maximum: raise MathError(f"{name} must be in [{minimum}, {maximum}]")
    return x

def score(item):
    if not isinstance(item,dict): raise MathError("Provide an object")
    reward=require_range(item.get("reward_usd",0),"reward_usd",0,1000000000)
    hours=require_range(item.get("hours",1),"hours",Rational("0.1"),10000)
    cost=require_range(item.get("cost_usd",0),"cost_usd",0,1000000000)
    p= require_range(item.get("acceptance_probability"),"acceptance_probability",0,1)
    eligibility=require_range(item.get("eligibility_probability"),"eligibility_probability",0,1)
    # Probabilities may not be independent! The formula is a scenario assumption.
    net=simplify(reward*p*eligibility-cost)
    hourly=simplify(net/hours)
    worst=simplify(-cost)
    best=simplify(reward-cost)
    return {
        "expected_net_usd":value(net),
        "expected_net_per_hour_usd":value(hourly),
        "maximum_cost_exposure_usd":value(cost),
        "scenario_range_usd":[value(worst),value(best)],
        "exact_expected_net":str(net),
        "exact_hourly_net":str(hourly),
        "inputs_are_assumptions":True,
        "probability_model":"user_assumed_independent_eligibility_and_acceptance",
        "notice":"An advertised reward is not verified funding or earnings. No success probability was inferred from a listing."
    }

def portfolio(body):
    if not isinstance(body,dict): raise MathError("Provide an object")
    items=body.get("items",[])
    if not isinstance(items,list) or len(items)>MAX_ITEMS:raise MathError("Maximum 16 candidate opportunities")
    budget=require_range(body.get("hour_budget",8),"hour_budget",0,MAX_HOURS)
    limit=float(budget)
    candidates=[]
    for i,x in enumerate(items):
        hrs=float(require_range(x.get("hours",1),"hours",Rational("0.1"),MAX_HOURS))
        sc=score(x)
        candidates.append((i,hrs,sc["expected_net_usd"],sc))
    if len(candidates)>MAX_ITEMS: raise MathError("Too many candidates")
    # Exact exhaustive finite search (<= 2^16 subsets), no integer-rounded hours.
    best=(0.0,0.0,[])
    for size in range(1,len(candidates)+1):
        for selection in combinations(candidates,size):
            hours=sum(x[1] for x in selection)
            if hours<=limit+1e-8:
                expected=sum(x[2] for x in selection)
                if expected>best[0]+1e-9 or abs(expected-best[0])<1e-9 and hours<best[1]:
                    best=(expected,hours,[x[0] for x in selection])
    return {
        "selected_indexes":best[2],
        "expected_net_usd":round(best[0],8),
        "hours_used":round(best[1],8),
        "hour_budget":limit,
        "algorithm":"exhaustive_optimal_subset_no_dependencies",
        "candidate_count":len(candidates),
        "assumptions":"Expected values are computed only from supplied hypothetical probabilities. No independence across opportunities, odds calibration or payout verification is implied.",
        "outcome_verified":False
    }

def bayesian(body):
    if not isinstance(body,dict): raise MathError("Provide an object")
    alpha=require_range(body.get("prior_alpha",1),"prior_alpha",Rational("0.01"),100000)
    beta=require_range(body.get("prior_beta",1),"prior_beta",Rational("0.01"),100000)
    successes=require_range(body.get("verified_successes",0),"verified_successes",0,100000)
    failures=require_range(body.get("verified_failures",0),"verified_failures",0,100000)
    if successes.q!=1 or failures.q!=1:raise MathError("Counts must be integers")
    a=alpha+successes;b=beta+failures
    mean=simplify(a/(a+b))
    variance=simplify(a*b/((a+b)**2*(a+b+1)))
    return {
        "posterior_alpha":value(a),"posterior_beta":value(b),
        "posterior_mean":value(mean),"posterior_variance":value(variance),
        "posterior_mean_exact":str(mean),
        "n_verified_outcomes":int(successes+failures),
        "method":"Beta-Binomial conjugate posterior",
        "notice":"Only independently verified, comparable outcome counts are valid inputs. This is not a prediction from bounty descriptions."
    }

def symbolic(body):
    if not isinstance(body,dict):raise MathError("Provide an object")
    # Finite named templates only. No sympify, eval, or arbitrary user expressions.
    name=str(body.get("template",""))
    if name=="ev_derivatives":
        r,p,e,c,h=symbols("r p e c h",real=True,positive=True)
        expression=(e*p*r-c)/h
        return {
            "expression":str(expression),
            "derivative_reward":str(diff(expression,r)),
            "derivative_acceptance":str(diff(expression,p)),
            "derivative_eligibility":str(diff(expression,e)),
            "derivative_hours":str(diff(expression,h)),
            "engine":"SymPy exact symbolic differentiation"
        }
    if name=="break_even_acceptance":
        r,e,c=symbols("r e c",real=True,positive=True)
        return {
            "expression":"e*p*r - c = 0",
            "acceptance_threshold":str(solve(Eq(e*symbols("p")*r-c,0),symbols("p"))[0]),
            "engine":"SymPy symbolic solve"
        }
    raise MathError("Unknown symbolic template (allowed: ev_derivatives, break_even_acceptance)")

def typed_decision(body):
    """Explicit rule-only, Jev-like response shape (NOT an open-weight Jev model)."""
    if not isinstance(body,dict):raise MathError("Provide an object")
    candidates=body.get("candidates",[])
    if not isinstance(candidates,list) or not (1<=len(candidates)<=MAX_ITEMS):raise MathError("candidates must have 1-16 items")
    ranked=[]
    for i,item in enumerate(candidates):
        if not isinstance(item,dict) or not isinstance(item.get("label"),str) or len(item["label"])>100:raise MathError("Invalid candidate label")
        sc=score(item)
        ranked.append({"index":i,"label":item["label"],"expected_net_per_hour_usd":sc["expected_net_per_hour_usd"]})
    ranked.sort(key=lambda x:(-x["expected_net_per_hour_usd"],x["index"]))
    return {
        "choice":ranked[0]["label"],"ranking":ranked,
        "decision_engine":"open_source_deterministic_rules_sympy",
        "is_jev_model":False,"is_laya_model":False,"calibrated_probabilities":False,
        "note":"This endpoint uses exact arithmetic and supplied hypotheses, not Jev/Laya inferred probabilities. Optional Laya open-weight model is a separate GPU deployment, not running here."
    }

def calculate(kind,body):
    return {"score":score,"portfolio":portfolio,"posterior":bayesian,"symbolic":symbolic,"decision":typed_decision}[kind](body)

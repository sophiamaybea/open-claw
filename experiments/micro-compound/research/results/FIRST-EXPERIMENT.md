# Micro Compound: first fast learning benchmark (14 October 2026)

**Research status: Synthetic fixture, no funds, no live data, no live orders.**

This is a transparent snapshot of the local experiment generated with:
```sh
cd experiments/micro-compound/research
python -m unittest discover -s tests -v
python -m microcompound.agents --mode sweep --seeds 12 --minutes 60 --output results
```

All **12 Python unit tests passed**. A 60-minute experiment is a fast *replay of a synthetic market path*, not an hour observing a real market.

| Metric | Result |
| --- | ---: |
| Stress scenarios | 108 |
| Independent pseudo-random seeds | 12 |
| Starting **virtual** balances | $1, $3, $10 |
| Cost multipliers | 1×, 2×, 5× |
| Positive net P&L | **0 / 108** |
| Better than HOLD baseline | **0 / 108** |
| Better than legacy router | **0 / 108** |
| Mean net synthetic return | **−5.19041%** |
| Mean nominal synthetic P&L across mixed capital sizes | −$0.24221897 |
| Real funds risked or used | **$0** |

**Important qualification:** the online classifier *trained* on completed shadow-trade outcomes, but the eight-label-per-eligible-arm gating meant it **did not make the trading decisions in the tested sweep**. So the result is NOT proof of adaptive ML benefit or failure in a real market; it is a baseline proving the execution, safety and reporting plumbing can run.

The cost assumptions are simplified fictional roundtrip percentages, not venue-specific executable bid/ask quotes. The experiment cannot establish a profitable strategy. Importantly, its results argue against funding the strategy before recording and replaying genuine market observations with live exchange minimum orders, fees, spread, slippage, latency and sellability.

The optional Groq review was not invoked; it requires a user-supplied API credential. River can optionally be installed; by default the learning component uses its documented pure-Python online logistic alternative.

**Next experimental gate:** real public *read-only* market data recording, minimum ticket and fee feasibility tests, a meaningful online-model intervention test with sufficient independent labelled observations, walk-forward holdouts and venue-specific adverse fill stress. Any future real trading would require owner confirmation after a separate review.

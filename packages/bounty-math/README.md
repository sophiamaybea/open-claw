# OpenClaw Bounty Math (SymPy + optional Laya route)

This isolated, stateless API is the **actual mathematical calculation layer** for Base44 Bounty Intelligence. It uses [SymPy](https://github.com/sympy/sympy), an open-source symbolic mathematics engine, rather than asking a language model to calculate numbers.

- `POST /v1/score` computes risk-conditioned expected net value and hourly value **from explicitly supplied assumptions**, using exact rational arithmetic.
- `POST /v1/portfolio` searches every subset of up to 16 opportunities to maximise net value under a time budget.
- `POST /v1/posterior` uses a Beta-Binomial Bayesian posterior from real, comparable, verified outcomes. Never apply it to mere advertised bounty labels.
- `POST /v1/symbolic` solves predefined symbolic threshold and sensitivity expressions. No arbitrary Python or SymPy expression evaluation is permitted.
- `POST /v1/decision` returns a typed choice / ranking similar in **shape** to Jev, but uses deterministic maths; it is **not** a Jev, Laya or calibrated neural model. The source is open.
- `GET /healthz` and `GET /v1/info` provide diagnostics.

## Open-source Jev alternative

The recommended optional system-one classifier is [Laya](https://github.com/NandhaKishorM/laya) (Apache-2.0, open weights). Laya answers typed `choice`, `score` and `noul` queries about documents in one model call. It is **not a computer algebra system**, and it does not replace SymPy, Wolfram, proofs, or independent verification. Its model weights are approximately 0.8 GB, too large for an economical 512 MB free Render service. Deploy it on a capable dedicated worker and expose an authenticated backend-only adapter after validating its calibration on your own historical bounty outcomes. **Not installed or invoked here.**

For exact maths (e.g. optimisation and symbolic differentiation), SymPy is the operational open-source engine. For more advanced algebra and numerical work, [SageMath](https://www.sagemath.org/) and [OR-Tools](https://github.com/google/or-tools) are future optional independent tools.

## Security / privacy / costs

The stateless HTTP API has no private data access or credentials and accepts numeric assumptions only. It uses strict limits on input size, candidate count, algorithm complexity and requests per minute. User identities, payload bodies and proposed bounty strategies must not be logged. Do not use this public API with confidential proprietary inputs. Add gateway authentication before sending private opportunity data. Free Render instances can sleep after idle time and are not an SLA.

This API does not connect itself to Supabase or the privileged `bea-openclaw` wallet/messaging Gateway.

## Tests and example

```sh
python -m pip install -r requirements.txt
python -m unittest discover -s tests -v
python server.py
curl -s http://127.0.0.1:8080/v1/info
curl -s -X POST http://127.0.0.1:8080/v1/score -H 'Content-Type: application/json' -d '{"reward_usd":500,"acceptance_probability":0.4,"eligibility_probability":0.8,"cost_usd":25,"hours":5}'
```

Three golden outputs were independently checked against Wolfram Language: **$27.00, $37.00 and $10.208333 per hour** for the example scenarios. These are synthetic illustrative inputs and do not predict actual payouts.

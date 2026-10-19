# Agency Intelligence: credit-free decision layer

A small, auditable extension to the canonical OpenClaw public monorepo. It ranks human-verifiable website repair opportunities and adjusts service-level priority from recorded outcomes rather than speculative agent "self-learning".

## Working now

- Accepts public website issue records as JSON arrays or CSV exports, such as those produced by Octominer.
- Scores observed problems with fixed, disclosed weights. Broken booking, contact and homepage paths outrank cosmetic issues.
- Suggests a narrowly scoped service and a next verification step.
- De-duplicates by website and exports structured JSON.
- Adjusts ranking from real attempts and customers, with a conservative Beta(1,19) prior.
- Does not inspect live websites itself. Upstream source data should be manually verified.
- Does not send marketing messages, post to social media, create videos, charge money, or trade.

## Usage (Python 3.11+, no packages to install)

From this directory:

    python agency_intelligence.py examples/businesses.json --out output/ranked.json
    python agency_intelligence.py examples/businesses.json --outcomes examples/outcomes.csv --out output/calibrated.json
    python -m unittest discover -s tests -v

Example JSON:

    [
      {
        "business_name": "Example Business",
        "website": "https://example.org",
        "issues": ["broken_booking_link", "accessibility_missing_alt"],
        "source_url": "https://example.org/booking",
        "location": "London",
        "source": "public website check"
      }
    ]

Outcome CSV fields: service,attempts,customers. Record only real observations. With no observations, output explicitly reads "prior only, unvalidated".

## Connection plan

    public discovery (Octominer or OSM)
      -> document public source URLs and detected issue codes
      -> deterministic opportunity triage (this package)
      -> HUMAN REVIEW and verification before contact
      -> private CRM and scoped service delivery
      -> actual wins / losses / revenue
      -> service-level aggregate calibration

The NexusGrowth Base44 app's new Agency OS user interface offers related tools: live HTML inspection, scoring scenarios, content drafting and an outcome ledger. As of 19 October 2026 this CLI and Base44 dashboard are independently operating. A direct integration or scheduled deployment is not claimed.

## Security and cost boundaries

- Public-safe data only. Do not commit contact lists, private CRM or secrets.
- Treat external text as untrusted input, never instructions to execute.
- Respect terms, privacy rules, robots and opt-outs. Do not send bulk unsolicited outreach.
- No automatic purchases, accounts, social posting, production code changes or payment actions.
- Rankings are hypotheses, not proof that somebody wants to buy.
- Zero LLM tokens for decisions. No scheduled jobs have been activated.

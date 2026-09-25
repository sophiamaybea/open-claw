# HIVE architecture

## Decision

HIVE is the **human control surface**, not the privileged OpenClaw runtime.

The frontend belongs in `open-claw/apps/hive` so it can evolve and deploy independently. Privileged orchestration, credentials, durable private memory access and consequential actions stay behind the private OpenClaw engine/control-plane boundary.

This deliberately avoids giving a public browser bundle direct access to OpenClaw's private Supabase memory.

## Boundary

```text
HIVE browser
  Next.js + React + R3F/Three + GLSL
        |
        | same-origin HTTPS
        v
Next.js BFF / API routes
  no private credentials in browser
        |
        | authenticated + permission-bounded
        v
PRIVATE OPENCLAW ENGINE
  orchestrator + policy + tools + Bees
        |
        +--> private operational memory
        |
        +--> audited external actions
```

## Source-of-truth rule

HIVE is a projection of state. It is not another source of truth.

- GitHub remains versioned operational/code truth.
- Private structured memory remains machine-queryable operational memory.
- The Living Project Brain remains the human-readable institutional view.
- Secrets stay in a dedicated secret boundary.

The UI may cache presentation state, but it must never silently become canonical storage for missions, permissions, money or machine memory.

## Browser data policy

The browser may receive safe projections such as:

- Bee identity, role and safe status
- mission summaries
- opportunity summaries
- verified economic stages
- safe audit summaries
- user-owned visual preferences
- public-safe evidence references
- opaque command IDs and statuses

The browser must not receive:

- database passwords or privileged Supabase keys
- wallet or payment credentials
- GitHub write tokens
- raw private memory merely because it exists
- reusable engine credentials
- unrestricted tool credentials
- confidential security findings that the current viewer is not authorised to inspect

## Gateway contract v1

### Read

`GET /v1/hive/snapshot`

Returns the safe current projection needed to render HIVE.

`GET /v1/hive/health`

Returns coarse engine and memory health without exposing secrets or private database topology.

For v1, a compact snapshot is deliberately acceptable. It is simpler to secure, validate and debug than beginning with a large real-time event fabric. Realtime can be added when the data shows it is useful.

### Act

`POST /v1/hive/commands`

Commands are typed requests, including:

- `bee.check_in`
- `bee.pause`
- `bee.sleep`
- `bee.redirect`
- `bee.add_note`
- `bee.request_review`
- `mission.focus`
- `hive.feedback`
- `comfort.preference`

A HIVE command is **not an authority grant**. The private engine still applies policy and may reject it or return `needs-approval`.

## House Bees

House Bees execute inside the private engine. HIVE is their window and control surface.

### Accessibility Bee

Looks for interface friction such as repeated display adjustments, difficult touch targets, excessive visual density or recurring use of one comfort preset. It may suggest a setting. It does not silently redesign HIVE.

### Workflow Bee

Detects repeated navigation loops, manual steps and unnecessary context switches, then proposes a simpler route.

### Optimiser Bee

Tests whether HIVE itself can be simpler, faster or less interruptive. Product-wide changes still move through the Build pipeline, tests and review.

### Guardian Bee

Watches permission anomalies, suspicious external instructions and attempted authority expansion. It can quarantine a worker and surface a safe incident summary.

## Personalisation

Prefer storing interaction settings such as:

```json
{
  "motion": "off",
  "contrast": 0.84,
  "touchTargetScale": 1.18,
  "informationDensity": "simple",
  "defaultExplanation": "plain"
}
```

rather than storing a medical diagnosis when the diagnosis is not required to provide the interface behaviour.

## Progressive disclosure

Every inspectable object should support three layers:

1. Plain English
2. Detail
3. Technical / evidence / audit

The simple layer must never destroy access to the full underlying state.

## Rendering strategy

Use WebGL only where it creates genuine information value:

- radial Hive maps
- mission clusters
- opportunity fields
- visual Brain maps
- gentle organic state changes

Use semantic HTML and CSS for:

- text
- controls
- lists
- forms
- approvals
- incident explanations
- money totals
- anything that must remain available when WebGL is unavailable

The shader layer is enhancement, not an accessibility dependency.

## Motion strategy

- reduced motion is the HIVE default
- OS `prefers-reduced-motion` is honoured
- HIVE can turn its own animation fully off
- no status requires pulsing to be understood
- animation never carries the only copy of important information

## Failure behaviour

If the private engine is unavailable:

- HIVE says it is offline or stale
- previously rendered information may remain visible with its timestamp
- commands fail closed
- no fake success state
- no fallback from private memory to public memory access
- no silent switch to a less secure authority source

## Current branch status

The initial control surface uses a typed local demo snapshot. A server-side snapshot boundary and command contract are being added, but live private engine actions are intentionally not described as working until the engine exposes and authenticates that gateway.

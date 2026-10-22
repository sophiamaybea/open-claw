# Base44 Bounty Bridge: isolated OpenClaw runtime adapter

**Status:** implemented source bridge; **not deployed or connected**. Part of the existing public `sophiamaybea/open-claw` monorepo, not a new OpenClaw repository.

This component connects the Base44 Bounty Intelligence frontend to **a separate, research-only OpenClaw Gateway**. It does not run OpenClaw itself: use the official `openclaw/openclaw` container image and onboarding guide for that runtime. It deliberately does **not** connect to the privileged `bea-openclaw` mail/wallet gateway.

## How it works

1. A human in the Base44 app selects an opportunity and presses **Send to separate OpenClaw Gateway**.
2. Authenticated Base44 backend function `openclaw-dispatch` sends a signed HTTPS request to this bridge (`POST /bounty/research`).
3. The bridge authenticates `Authorization: Bearer <BOUNTY_BRIDGE_TOKEN>`, validates a strict public GitHub issue URL, and fetches the canonical GitHub issue over the GitHub REST API. It does not fetch arbitrary URLs (SSRF boundary).
4. The bridge sends only that issue's public text and an instruction to prepare a draft evidence report to an **isolated, read-only OpenClaw Gateway** at `/v1/chat/completions`, targeting the configured `openclaw/bounty_research` agent. No tools, files, email, wallets or command execution are exposed to this research agent.
5. A job may be queried via `GET /bounty/status/<requestId>`. Results are in-memory only and expire within 24 hours. Production persistence and retries remain future work.

## Local tests

```sh
cd integrations/base44-bounty-bridge
npm test
```

## Configuration

Required bridge secrets (provision in the hosting platform, **never** commit):

- `BOUNTY_BRIDGE_TOKEN`: random secret with at least 32 characters, used only between Base44 and this bridge.
- `OPENCLAW_GATEWAY_URL`: **private** loopback URL such as `http://127.0.0.1:18789`, or private HTTPS gateway. Do not expose the Gateway to the Internet.
- `OPENCLAW_GATEWAY_TOKEN`: full-operator secret for the isolated research-only Gateway. Never reuse the mail/wallet Gateway token.
- `OPENCLAW_BOUNTY_MODEL` (optional): fixed OpenClaw agent model name (default `openclaw/bounty_research`).
- `GITHUB_TOKEN` (optional): scoped, read-only for public issue API rate limits.
- `PORT` / `HOST` (default 8081 / loopback), `MAX_PARALLEL` (default 2).

Required Base44 server secrets:

- `OPENCLAW_BOUNTY_WEBHOOK_URL=https://<your-bridge>/bounty/research`
- `OPENCLAW_BOUNTY_WEBHOOK_TOKEN=<same BOUNTY_BRIDGE_TOKEN>`

Security notes:

- The official Gateway's shared bearer token has **full operator authority**, including its chat HTTP endpoint. This is why the project **must use a separate locked-down research-only Gateway**, never the existing privileged `bea-openclaw` runtime with Gmail and wallet tools. Set an explicit tool allowlist with **no exec, shell, file writes, messaging, wallets, browser actions, nodes, cron or session spawning**, sandbox isolation and a separate workspace. Even a quoted GitHub issue can contain malicious prompt-injection instructions.
- Configure Gateway `gateway.http.endpoints.chatCompletions.enabled=true`, which is off by default. Use the official OpenClaw security guide and PIN a tested version instead of floating `latest` in production.
- The bridge is an ingress to a single-user operator runtime, not a multi-tenant service. Bearer authentication is necessary but is not sufficient by itself to make a full-operator gateway safe.
- Run the public bridge behind TLS and a host firewall / proxy rate limiter. Keep the Gateway private. Use two separate processes/instances and secret stores.
- This adapter never submits bounty applications, spends money, tests remote systems, validates funding, or asserts paid rewards.

## Deployment

The `Dockerfile` is deliberately standalone. For Render use **Docker context** `integrations/base44-bounty-bridge` and Dockerfile `integrations/base44-bounty-bridge/Dockerfile` according to the Render interface's conventions. Choose workspace, plan, secrets and private network deliberately. The Bridge cannot function until a separately configured OpenClaw research Gateway is accessible through a private route. No deployment has been initiated by this source commit.

Canonical repos used: [OpenClaw](https://github.com/openclaw/openclaw), [OpenManus](https://github.com/FoundationAgents/OpenManus), [Crawl4AI](https://github.com/unclecode/crawl4ai), [GPT Researcher](https://github.com/assafelovic/gpt-researcher), [GraphRAG](https://github.com/microsoft/graphrag), [Foundry](https://github.com/foundry-rs/foundry), [Slither](https://github.com/crytic/slither). **Referenced does not mean installed or executed**. Slither is AGPL-3.0; review obligations before linking/redistributing.

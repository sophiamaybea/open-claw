# Cloudflare Agent Setup — Micro Compound
**Status:** Prepared for connection, NOT deployed. No Cloudflare credentials are stored here.

This project was prepared following Cloudflare's own agent instructions from:
https://developers.cloudflare.com/agent-setup/prompt.md
Source cross-check: `cloudflare/cloudflare-docs/src/content/agent-setup/prompt.md`.

## How this project is designed
- `worker.mjs` imports the existing **paper-only** simulation in `../core.mjs`.
- A UTC `* * * * *` Cron Trigger requests public one-minute BTC/ETH/SOL candles. All decisions stay in a hypothetical $3 portfolio and are persisted in D1.
- A second UTC `17 */3 * * *` trigger looks up publicly advertised open GitHub bounties. Its reward amounts are **UNVERIFIED**.
- `GET /` is a read-only live dashboard and `GET /api/status`, `/api/bounties`, `/health` are read-only endpoints.
- No real exchange orders, Coinbase credentials, wallet signing, account linking, or transfer API routes exist. Promotion affects only paper portfolios.
- D1 version numbers protect against concurrent stale-state overwrites; missing Coinbase data or D1 conflict fails closed.
- Historical context is loaded without fabricating prior trades.

## Set up your coding agent with Cloudflare
The official Cloudflare instructions for Codex are:
```bash
npx -y skills add cloudflare/skills --skill '*' --yes --global
codex mcp add cloudflare --url https://mcp.cloudflare.com/mcp
codex mcp login cloudflare
```
Cloudflare login requires you to approve OAuth in your browser. Never paste a token or private key into ChatGPT.

**Current environment limitation:** These commands cannot establish an OAuth session inside ChatGPT and the agent's underlying ephemeral environment has no Codex CLI or outbound npm registry access. The repo is ready to be opened by Codex or another supported tool with Cloudflare MCP connection. Do not claim that the skills/MCP are installed until verified in that environment. Cloudflare has no available native ChatGPT app connected at present.

Cloudflare CLI `cf` is optional, and was not installed because the user has not requested it.

## Deploy once the Cloudflare OAuth connection exists
1. Log in to the Cloudflare free account via its official OAuth flow, not by sending account keys in chat.
2. In the project directory (`experiments/micro-compound-agents/cloudflare`), run `npm install`.
3. Create a free D1 database: `npx wrangler d1 create microcompound-paper`.
4. Copy its exact **database_id** UUID into `wrangler.jsonc`. The current string is a deliberate placeholder; deployment before replacing it should fail.
5. Apply the SQL migration: `npx wrangler d1 migrations apply DB --remote`.
6. Verify `npm run check` and then deploy with `npx wrangler deploy`.
7. The resulting `workers.dev` URL is the public live dashboard. Confirm the `/health` response and then wait for the first scheduled cron; dashboard does not invent results before first run.
8. Inspect Worker logs and D1 usage before considering the first week complete.

## Pricing and operations
Cloudflare Cron Triggers support every minute and D1 has a free tier. This prototype makes ~1440 scheduled requests/day plus dashboard visitors, and only a few D1 operations per minute. Cloudflare free-tier CPU and D1 limits still apply, and the Coinbase public endpoint may rate-limit or block Cloudflare egress. No claim of 100% uptime, profitable performance, or a completed deployment is made.

Documentation:
- https://developers.cloudflare.com/workers/configuration/cron-triggers/
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/workers/wrangler/commands/d1/
- https://developers.cloudflare.com/workers/wrangler/configuration/

## How to stop
Disable Cron Triggers in `wrangler.jsonc` (set `crons: []` and redeploy), or disable/delete the Worker in your Cloudflare dashboard. Do not connect the paper system to real trading.

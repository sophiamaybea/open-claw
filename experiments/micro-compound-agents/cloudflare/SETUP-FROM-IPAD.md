# Set up Cloudflare Worker from an iPad (existing account)

## What your screenshot establishes
- Account: the Cloudflare account visible in your screenshot; a deployed Worker called **open-claw**, with a recent deployment marked **Ready**.
- **Bindings 0**: no D1 database attached in this Worker deployment.
- **workers.dev Disabled**: no public `workers.dev` subdomain for this Worker.
- **Invocations 0** at screenshot time: no real production invocations seen. This is NOT evidence the paper agent is connected or running.
- **Do not overwrite `open-claw`** until its currently deployed code and other responsibilities are known. Create a NEW Worker named `micro-compound-paper-agents` in the same account instead.

## Already prepared and tested
- `worker-paste-ready.mjs` is a ONE-FILE Worker script assembled from `../core.mjs` and `worker.mjs`, parses successfully, with no imports and no live trading functions.
- `migrations/0001_init.sql` creates the `agent_documents` table that the Worker needs.
- `wrangler.jsonc` is a separate CLI deployment alternative, not needed for browser paste. Its D1 UUID placeholder is intentional.
- The worker produces a public read-only dashboard at `GET /` and JSON endpoints `/api/status`, `/api/bounties`, `/health`. The Worker does not run real trades or transfers.

## Step 1: create D1 (free tier, no paid plan chosen)
1. Cloudflare dashboard, left sidebar **Storage & databases → D1 SQL Database** (menu names may vary).
2. **Create database**, name `microcompound-paper`, choose region/default where available.
3. Open database **Console** and run these 2 statements (the exact same content is in `migrations/0001_init.sql`):

```sql
CREATE TABLE IF NOT EXISTS agent_documents (
  name TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agent_documents_updated
  ON agent_documents(updated_at);
```
Verify that the table is present. If billing is requested, STOP rather than enrolling in paid hosting.

## Step 2: create a separate Worker
1. **Workers & Pages → Create → Worker**, name `micro-compound-paper-agents`.
2. Deploy the harmless initial Worker template and click **Edit code**.
3. Open the prepared source in GitHub: `worker-paste-ready.mjs` (linked below), choose **Raw** to view it as plain text, copy all.
4. Replace the template with that full script and select **Deploy**. The dashboard HTML can render without D1, but its API will fail until the binding is configured, by design.

Source:
https://github.com/sophiamaybea/open-claw/blob/main/experiments/micro-compound-agents/cloudflare/worker-paste-ready.mjs

## Step 3: attach the database
1. On the new Worker: **Settings → Bindings → Add binding**.
2. Type **D1 Database**; variable name must be `DB` (exact uppercase).
3. Choose the previously created `microcompound-paper` database; save and deploy if prompted.

## Step 4: enable public dashboard and scheduled triggers
1. **Settings → Domains & Routes → workers.dev**: enable the subdomain for **the new Worker only**.
2. **Settings → Triggers / Cron Triggers**: add `* * * * *` (paper observation once/minute).
3. Add `17 */3 * * *` (public GitHub bounty scan every three hours).
4. Save and deploy. Cron Triggers may take several minutes to propagate. Triggers run on UTC.

## Step 5: verify without inventing success
- Open your new `https://micro-compound-paper-agents.<account>.workers.dev/health`; expect `mode: PAPER_ONLY`.
- Open `/api/status`; until first cron it correctly returns `NOT_INITIALIZED`, not profit.
- After the minute cron fires, the first cycle should load context-only OHLCV (no fabricated historical trades). It should return `BOOTSTRAPPED`, then `PAPER_RUNNING` on later cycles.
- View the root URL `/` for the dashboard, plus `/api/bounties` after the bounty scan.
- Check Worker Observability logs for error details. Coinbase may rate-limit or fail to respond and Cloudflare free CPU execution limits can be exceeded; do not assume uninterrupted service.
- **Never claim working one-minute agents until actual cron runs and new data are visible**.

## Safe policy
- No Coinbase trading token, no wallet secrets, no real account funding, no spending.
- A paper strategy promotion never authorises a live order.
- If Cloudflare asks for payment or billable upgrades, do not proceed until the owner explicitly approves.
- Keep the previous GitHub research engine as a fallback until Cloudflare results are verified.

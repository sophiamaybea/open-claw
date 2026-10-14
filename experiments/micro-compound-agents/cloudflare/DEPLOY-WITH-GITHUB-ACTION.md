# Deploy Cloudflare Micro Compound without repeating manual binding or Worker steps

The official project for direct agent-access to Cloudflare is [cloudflare/mcp](https://github.com/cloudflare/mcp). It connects an authorised AI coding agent to Cloudflare's API through OAuth. It does NOT automatically make Cloudflare tools available inside ordinary ChatGPT conversations.

For an iPad-only workflow, [cloudflare/wrangler-action](https://github.com/cloudflare/wrangler-action) is the practical alternative. A checked-in GitHub Actions workflow can run the remaining database migration, binding and Worker deployment once it has **scoped, encrypted credentials**.

## What has ALREADY been prepared
- Your existing database is named `microcompound-paper` with D1 UUID recorded in `wrangler.jsonc`.
- Your existing Worker `open-claw` remains untouched. The deployed Worker created by this action will be `micro-compound-paper-agents`, with D1 binding `DB`.
- Your Worker code, one-minute paper cron, three-hour bounty discovery cron and read-only dashboard are committed at `experiments/micro-compound-agents/cloudflare/`.
- Workflow: [Deploy Micro Compound Cloudflare Paper Worker](https://github.com/sophiamaybea/open-claw/actions/workflows/microcompound-cloudflare-deploy.yml).
- This workflow runs **ONLY on explicit manual dispatch**. It does not start automatically without your instruction.

## ONE-TIME account authorization (never share tokens in chat)
1. In Cloudflare dashboard, open **API Tokens**. Create a restricted API token for **your own Cloudflare account only**. Follow Cloudflare's official GitHub Actions token guide: https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/.
2. Grant only the necessary permissions for **Workers Scripts Edit and D1 Edit**, and any additional account read/worker cron permissions Cloudflare expressly requires. Do **not** give this token financial service or unrelated account permissions. If possible, set an expiration.
3. In your GitHub repository, open **Settings → Secrets and variables → Actions → New repository secret** (desktop website mode on iPad may help).
4. Add the Cloudflare token as a secret named **`CLOUDFLARE_API_TOKEN`**.
5. Add your Cloudflare **Account ID** as another secret named **`CLOUDFLARE_ACCOUNT_ID`**. Cloudflare account ID is not the D1 database UUID; find it on your Cloudflare account overview or Workers settings.
6. Open the workflow above; tap **Run workflow**. It validates code, creates any missing D1 tables, deploys the separate `micro-compound-paper-agents` Worker and sets its scheduled triggers.
7. Inspect the actual GitHub Actions run logs to verify success; get the Worker URL from the Wrangler deploy output. Verify `GET /health`, then `GET /api/status` after the first minute trigger, and the root dashboard.

## IMPORTANT
- Never paste the API token into this chat or a public repository file. GitHub Actions secrets are encrypted at rest and are not printed by this workflow.
- The Cloudflare API token grants account-management privileges within its scope. Limit it and revoke it if unneeded.
- No real trades, funding, transfers, wallets or exchange credentials are part of this workflow.
- The Worker uses a **free-tier-compatible** design but Cloudflare may enforce account/usage limits; if any step requires a paid plan, cancel until explicitly approved.
- This setup is not deployed until the workflow has been run and you see successful Cloudflare deployment. The ChatGPT connection to GitHub can inspect and edit code, but not administer Cloudflare account credentials or directly use Cloudflare MCP without a user-authenticated Cloudflare connector.

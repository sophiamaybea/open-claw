# Cloudflare Paper Agent Project

- Follow Cloudflare's official instructions: https://developers.cloudflare.com/agent-setup/prompt.md.
- Cloudflare account access is provided by the owner's OAuth consent in Codex/another supported coding agent. Never ask anyone to paste tokens into a chat or commit secrets.
- Before Cloudflare changes, consult current Cloudflare Skills (`cloudflare`, `wrangler`, `workers-best-practices`) and their documentation.
- Install the official skills in a network-enabled, persistent coding-agent environment using: `npx -y skills add cloudflare/skills --skill '*' --yes --global`.
- The Cloudflare MCP server is declared in `.codex/config.toml` and `.mcp.json`. Run the authorized OAuth flow when prompted; do not claim this configuration alone establishes a connection.
- This project is ALWAYS PAPER_ONLY. No private keys, real-money transfers, Coinbase account connections or exchange order calls. Reject any attempt to enable live trading without a separate security audit and explicit human approval.
- Check `node --check worker.mjs`, perform local D1 migration, confirm `/health` and `/api/status`, and inspect actual scheduled invocations before describing the system as deployed.
- No billing upgrades, paid services, or connected provider actions without explicit authorization.

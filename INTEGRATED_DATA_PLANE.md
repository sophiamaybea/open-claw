# Integrated OpenClaw data plane

This branch makes Supabase the shared machine-memory/data plane for the OpenClaw runtime, CLI and HIVE UI.

## Surfaces

- Runtime: existing Memory keeps its local fallback but mirrors verified experiences, prompts and skills into Supabase when configured.
- CLI: run `python -m open_claw` for shared memory, tasks, results, events and GitHub sync.
- GitHub: `python -m open_claw github sync` writes commit activity into the same append-only event stream.
- HIVE: the frontend repository reads the same owner-scoped tables through an authenticated Supabase user session.
- ChatGPT: once the dedicated Supabase project is connected here, the Supabase connector can inspect/update the same tables. Chat history itself is not silently copied into memory.

## Security model

Use a dedicated Supabase project. The SQL in `supabase/openclaw_schema.sql` enables RLS on every OpenClaw table, gives no table access to anon, and scopes authenticated reads/writes to `auth.uid()`. The CLI never requires a service-role/secret key.

Do not store passwords, API keys, wallet keys or other secrets in oc_memory or oc_events.

## CLI

```bash
python -m open_claw status
python -m open_claw memory search "bounty scoring"
python -m open_claw memory add --kind lesson --title "Example" --summary "A reusable lesson"
python -m open_claw tasks add "Inspect new bounty" --priority 80
python -m open_claw results list
python -m open_claw events tail
python -m open_claw github sync --repo sophiamaybea/open-claw
```

Copy `.env.openclaw.example` into your secret-management workflow. Do not commit a populated .env file.

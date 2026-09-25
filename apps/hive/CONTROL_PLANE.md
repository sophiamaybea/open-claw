# HIVE authenticated control plane

The existing HIVE visual prototype remains at the app root.

The private integrated data UI lives at /control and reads the same owner-scoped Supabase tables as the OpenClaw runtime and CLI.

Security:
- no Supabase secret/service-role key is shipped to the browser;
- Auth access and refresh tokens are stored in httpOnly same-site cookies;
- RLS is the database authorization boundary;
- anonymous table access is disabled by the OpenClaw schema;
- /control is marked noindex.

Required environment variables:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

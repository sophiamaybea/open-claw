-- OpenClaw shared data plane for a DEDICATED Supabase project.
-- Do not apply this to an unrelated application database.
-- All browser/CLI access is authenticated and owner-scoped by RLS.

create extension if not exists pgcrypto;

create table if not exists public.oc_agents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  role text,
  status text not null default 'idle' check (status in ('idle','working','blocked','offline','retired')),
  capabilities jsonb not null default '[]'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, name)
);

create table if not exists public.oc_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  status text not null default 'queued' check (status in ('queued','running','blocked','done','failed','cancelled')),
  priority integer not null default 50 check (priority between 0 and 100),
  source text not null default 'cli',
  assigned_agent_id uuid references public.oc_agents(id) on delete set null,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.oc_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  task_id uuid references public.oc_tasks(id) on delete set null,
  agent_id uuid references public.oc_agents(id) on delete set null,
  status text not null default 'running' check (status in ('running','succeeded','failed','cancelled')),
  model text,
  input jsonb not null default '{}'::jsonb,
  output_summary text,
  error text,
  cost_usd numeric(12,6),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.oc_results (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  task_id uuid references public.oc_tasks(id) on delete set null,
  run_id uuid references public.oc_runs(id) on delete set null,
  result_type text not null default 'result',
  title text not null,
  content jsonb not null default '{}'::jsonb,
  verification_status text not null default 'unverified' check (verification_status in ('unverified','verified','rejected','needs_review')),
  score numeric(8,4),
  created_at timestamptz not null default now()
);

create table if not exists public.oc_memory (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  summary text,
  content jsonb not null default '{}'::jsonb,
  source text not null default 'runtime',
  source_ref text,
  confidence numeric(4,3) not null default 0.500 check (confidence between 0 and 1),
  status text not null default 'active' check (status in ('active','hypothesis','superseded','deprecated','quarantined')),
  freshness_class text not null default 'durable' check (freshness_class in ('live','short','medium','durable')),
  last_verified_at timestamptz,
  supersedes_id uuid references public.oc_memory(id) on delete set null,
  search_tsv tsvector generated always as (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(summary,''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.oc_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source text not null,
  source_ref text,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.oc_artifacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  task_id uuid references public.oc_tasks(id) on delete set null,
  result_id uuid references public.oc_results(id) on delete set null,
  kind text not null,
  uri text not null,
  sha256 text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.oc_links (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  from_type text not null,
  from_id uuid not null,
  relation text not null,
  to_type text not null,
  to_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists oc_tasks_owner_status_updated_idx on public.oc_tasks(owner_id, status, updated_at desc);
create index if not exists oc_runs_owner_started_idx on public.oc_runs(owner_id, started_at desc);
create index if not exists oc_results_owner_created_idx on public.oc_results(owner_id, created_at desc);
create index if not exists oc_memory_owner_updated_idx on public.oc_memory(owner_id, updated_at desc);
create index if not exists oc_memory_search_idx on public.oc_memory using gin(search_tsv);
create index if not exists oc_events_owner_created_idx on public.oc_events(owner_id, created_at desc);
create unique index if not exists oc_events_source_ref_unique
  on public.oc_events(owner_id, source, source_ref)
  where source_ref is not null;
create index if not exists oc_links_from_idx on public.oc_links(owner_id, from_type, from_id);
create index if not exists oc_links_to_idx on public.oc_links(owner_id, to_type, to_id);

alter table public.oc_agents enable row level security;
alter table public.oc_tasks enable row level security;
alter table public.oc_runs enable row level security;
alter table public.oc_results enable row level security;
alter table public.oc_memory enable row level security;
alter table public.oc_events enable row level security;
alter table public.oc_artifacts enable row level security;
alter table public.oc_links enable row level security;

revoke all on public.oc_agents, public.oc_tasks, public.oc_runs, public.oc_results,
  public.oc_memory, public.oc_events, public.oc_artifacts, public.oc_links from anon;

grant select, insert, update, delete on public.oc_agents, public.oc_tasks, public.oc_runs,
  public.oc_results, public.oc_memory, public.oc_artifacts, public.oc_links to authenticated;
grant select, insert on public.oc_events to authenticated;

do $$
declare t text;
begin
  foreach t in array array['oc_agents','oc_tasks','oc_runs','oc_results','oc_memory','oc_artifacts','oc_links']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_owner_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_owner_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_owner_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_owner_delete', t);

    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = owner_id)', t || '_owner_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = owner_id)', t || '_owner_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id)', t || '_owner_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = owner_id)', t || '_owner_delete', t);
  end loop;
end $$;

drop policy if exists oc_events_owner_select on public.oc_events;
drop policy if exists oc_events_owner_insert on public.oc_events;
create policy oc_events_owner_select on public.oc_events
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy oc_events_owner_insert on public.oc_events
  for insert to authenticated with check ((select auth.uid()) = owner_id);

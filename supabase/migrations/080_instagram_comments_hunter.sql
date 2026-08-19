-- Comments Hunter e fundacao multifuente do Instagram.
-- Mantem origem, execucao, conteudo e evidencia separados para permitir novos
-- coletores (hashtags, locais, concorrentes e mencoes) sem misturar contratos.

create table if not exists public.instagram_sources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null
    check (source_type in ('profile', 'post', 'reel', 'hashtag', 'place', 'mention', 'competitor', 'import')),
  name text not null,
  config jsonb not null default '{}'::jsonb,
  status text not null default 'active'
    check (status in ('active', 'paused', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists instagram_sources_org_status_idx
  on public.instagram_sources (org_id, status, created_at desc);

alter table public.instagram_sources enable row level security;
drop policy if exists instagram_sources_all on public.instagram_sources;
create policy instagram_sources_all on public.instagram_sources for all
  using (public.eh_super_admin() or public.pertence_a_org(org_id))
  with check (public.eh_super_admin() or public.pertence_a_org(org_id));

create table if not exists public.instagram_discovery_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid references public.instagram_sources(id) on delete set null,
  request_id text not null,
  mode text not null
    check (mode in ('comments', 'profiles', 'hashtags', 'places', 'mentions', 'competitors')),
  status text not null default 'queued'
    check (status in ('queued', 'running', 'completed', 'partial', 'failed', 'budget_stopped')),
  input jsonb not null default '{}'::jsonb,
  stats jsonb not null default '{}'::jsonb,
  result jsonb,
  estimated_cost_usd numeric(12, 6) not null default 0,
  actual_cost_usd numeric(12, 6) not null default 0,
  stop_reason text,
  error text,
  month_ref text not null,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, request_id)
);

create index if not exists instagram_discovery_jobs_org_created_idx
  on public.instagram_discovery_jobs (org_id, created_at desc);
create index if not exists instagram_discovery_jobs_user_month_idx
  on public.instagram_discovery_jobs (user_id, month_ref, status);

alter table public.instagram_discovery_jobs enable row level security;
drop policy if exists instagram_discovery_jobs_select on public.instagram_discovery_jobs;
create policy instagram_discovery_jobs_select on public.instagram_discovery_jobs for select
  using (public.eh_super_admin() or public.pertence_a_org(org_id));

create table if not exists public.instagram_job_steps (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.instagram_discovery_jobs(id) on delete cascade,
  org_id uuid not null references public.orgs(id) on delete cascade,
  step_type text not null
    check (step_type in ('discover_content', 'collect_comments', 'enrich_profiles', 'qualify')),
  actor_id text,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'completed', 'failed', 'skipped', 'cached')),
  input jsonb not null default '{}'::jsonb,
  apify_run_id text,
  apify_dataset_id text,
  requested_count integer not null default 0,
  returned_count integer not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists instagram_job_steps_job_idx
  on public.instagram_job_steps (job_id, created_at);

alter table public.instagram_job_steps enable row level security;
drop policy if exists instagram_job_steps_select on public.instagram_job_steps;
create policy instagram_job_steps_select on public.instagram_job_steps for select
  using (public.eh_super_admin() or public.pertence_a_org(org_id));

create table if not exists public.instagram_contents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid references public.instagram_sources(id) on delete set null,
  job_id uuid references public.instagram_discovery_jobs(id) on delete set null,
  instagram_content_id text,
  shortcode text,
  content_type text not null check (content_type in ('post', 'reel', 'carousel')),
  owner_username text not null,
  url text not null,
  caption text,
  posted_at timestamptz,
  location jsonb,
  metrics jsonb not null default '{}'::jsonb,
  raw_payload jsonb,
  collected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, url)
);

create index if not exists instagram_contents_org_owner_idx
  on public.instagram_contents (org_id, owner_username, posted_at desc);

alter table public.instagram_contents enable row level security;
drop policy if exists instagram_contents_select on public.instagram_contents;
create policy instagram_contents_select on public.instagram_contents for select
  using (public.eh_super_admin() or public.pertence_a_org(org_id));

create table if not exists public.instagram_engagement_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid references public.instagram_sources(id) on delete set null,
  job_id uuid references public.instagram_discovery_jobs(id) on delete cascade,
  content_id uuid references public.instagram_contents(id) on delete set null,
  instagram_event_id text,
  event_type text not null check (event_type in ('comment', 'reply', 'mention')),
  actor_username text not null,
  actor_instagram_id text,
  actor_full_name text,
  actor_avatar_url text,
  text text not null,
  likes_count integer not null default 0,
  replies_count integer not null default 0,
  occurred_at timestamptz,
  intent_label text not null,
  intent_score integer not null check (intent_score between 0 and 100),
  intent_signals jsonb not null default '[]'::jsonb,
  is_spam boolean not null default false,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  unique (org_id, instagram_event_id)
);

create index if not exists instagram_engagement_events_job_intent_idx
  on public.instagram_engagement_events (job_id, intent_score desc);
create index if not exists instagram_engagement_events_org_actor_idx
  on public.instagram_engagement_events (org_id, actor_username, occurred_at desc);

alter table public.instagram_engagement_events enable row level security;
drop policy if exists instagram_engagement_events_select on public.instagram_engagement_events;
create policy instagram_engagement_events_select on public.instagram_engagement_events for select
  using (public.eh_super_admin() or public.pertence_a_org(org_id));

create table if not exists public.instagram_profile_evidence (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.instagram_discovery_jobs(id) on delete cascade,
  content_id uuid references public.instagram_contents(id) on delete set null,
  event_id uuid references public.instagram_engagement_events(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  username text not null,
  evidence_type text not null check (evidence_type in ('comment', 'reply', 'mention', 'profile_signal')),
  excerpt text not null,
  source_url text,
  intent_label text,
  intent_score integer check (intent_score between 0 and 100),
  lead_score integer check (lead_score between 0 and 100),
  decision text not null check (decision in ('qualified', 'candidate', 'rejected', 'duplicate')),
  rejection_reason text,
  profile_snapshot jsonb,
  observed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists instagram_profile_evidence_job_score_idx
  on public.instagram_profile_evidence (job_id, lead_score desc nulls last, created_at);
create index if not exists instagram_profile_evidence_lead_idx
  on public.instagram_profile_evidence (lead_id, created_at desc);

alter table public.instagram_profile_evidence enable row level security;
drop policy if exists instagram_profile_evidence_select on public.instagram_profile_evidence;
create policy instagram_profile_evidence_select on public.instagram_profile_evidence for select
  using (public.eh_super_admin() or public.pertence_a_org(org_id));

alter table public.instagram_profiles
  add column if not exists discovery_source text not null default 'profile_search',
  add column if not exists last_active_at timestamptz,
  add column if not exists intent_score integer check (intent_score between 0 and 100),
  add column if not exists authenticity_score integer check (authenticity_score between 0 and 100);

comment on table public.instagram_discovery_jobs is
  'Orquestracao auditavel dos coletores Instagram, incluindo custo previsto e real por trabalho.';
comment on table public.instagram_engagement_events is
  'Interacoes publicas coletadas, com intencao calculada sem transformar todo comentarista em lead.';
comment on table public.instagram_profile_evidence is
  'Prova rastreavel que explica por que um perfil foi qualificado, rejeitado ou marcado como repetido.';

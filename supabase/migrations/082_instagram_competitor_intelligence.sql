-- Fase 3 do Instagram Prospect Engine: inteligencia historica de concorrentes.

create table if not exists public.instagram_competitors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid references public.instagram_sources(id) on delete set null,
  username text not null,
  label text,
  niche text not null,
  city text,
  state text,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  monitoring_interval_hours integer not null default 168
    check (monitoring_interval_hours between 24 and 720),
  last_analyzed_at timestamptz,
  next_analysis_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, username)
);

create index if not exists instagram_competitors_org_status_idx
  on public.instagram_competitors (org_id, status, updated_at desc);

alter table public.instagram_competitors enable row level security;
drop policy if exists instagram_competitors_all on public.instagram_competitors;
create policy instagram_competitors_all on public.instagram_competitors for all
  using (public.eh_super_admin() or public.pertence_a_org(org_id))
  with check (public.eh_super_admin() or public.pertence_a_org(org_id));

create table if not exists public.instagram_competitor_snapshots (
  id uuid primary key default gen_random_uuid(),
  competitor_id uuid not null references public.instagram_competitors(id) on delete cascade,
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.instagram_discovery_jobs(id) on delete set null,
  followers_count integer not null default 0,
  following_count integer not null default 0,
  posts_count integer not null default 0,
  follower_delta integer not null default 0,
  follower_growth_percent numeric(10, 4) not null default 0,
  posts_delta integer not null default 0,
  engagement_rate numeric(10, 4) not null default 0,
  engagement_delta numeric(10, 4) not null default 0,
  posting_frequency_weekly numeric(10, 2) not null default 0,
  average_likes numeric(12, 2) not null default 0,
  median_likes numeric(12, 2) not null default 0,
  average_comments numeric(12, 2) not null default 0,
  median_comments numeric(12, 2) not null default 0,
  content_score integer not null default 0 check (content_score between 0 and 100),
  profile_pic_url text,
  full_name text,
  biography text,
  business_category text,
  format_counts jsonb not null default '{}'::jsonb,
  hashtags jsonb not null default '[]'::jsonb,
  locations jsonb not null default '[]'::jsonb,
  top_posts jsonb not null default '[]'::jsonb,
  comment_summary jsonb not null default '{}'::jsonb,
  profile_snapshot jsonb,
  captured_at timestamptz not null default now()
);

create index if not exists instagram_competitor_snapshots_competitor_idx
  on public.instagram_competitor_snapshots (competitor_id, captured_at desc);
create index if not exists instagram_competitor_snapshots_org_idx
  on public.instagram_competitor_snapshots (org_id, captured_at desc);

alter table public.instagram_competitor_snapshots enable row level security;
drop policy if exists instagram_competitor_snapshots_select on public.instagram_competitor_snapshots;
create policy instagram_competitor_snapshots_select on public.instagram_competitor_snapshots for select
  using (public.eh_super_admin() or public.pertence_a_org(org_id));

create table if not exists public.instagram_competitor_insights (
  id uuid primary key default gen_random_uuid(),
  competitor_id uuid not null references public.instagram_competitors(id) on delete cascade,
  snapshot_id uuid references public.instagram_competitor_snapshots(id) on delete cascade,
  org_id uuid not null references public.orgs(id) on delete cascade,
  job_id uuid references public.instagram_discovery_jobs(id) on delete set null,
  insight_type text not null check (insight_type in (
    'recurring_commenter', 'purchase_intent', 'objection', 'question_topic', 'hashtag', 'location'
  )),
  key text not null,
  title text not null,
  evidence text,
  score numeric(8, 2) not null default 0,
  occurrences integer not null default 1,
  data jsonb not null default '{}'::jsonb,
  observed_at timestamptz not null default now()
);

create index if not exists instagram_competitor_insights_competitor_idx
  on public.instagram_competitor_insights (competitor_id, insight_type, score desc, observed_at desc);

alter table public.instagram_competitor_insights enable row level security;
drop policy if exists instagram_competitor_insights_select on public.instagram_competitor_insights;
create policy instagram_competitor_insights_select on public.instagram_competitor_insights for select
  using (public.eh_super_admin() or public.pertence_a_org(org_id));

create table if not exists public.instagram_competitor_alerts (
  id uuid primary key default gen_random_uuid(),
  competitor_id uuid not null references public.instagram_competitors(id) on delete cascade,
  snapshot_id uuid references public.instagram_competitor_snapshots(id) on delete cascade,
  org_id uuid not null references public.orgs(id) on delete cascade,
  alert_type text not null check (alert_type in (
    'purchase_intent', 'recurring_commenter', 'follower_growth',
    'engagement_jump', 'objection_spike', 'new_hashtag'
  )),
  severity text not null check (severity in ('info', 'opportunity', 'warning')),
  title text not null,
  description text not null,
  score numeric(8, 2) not null default 0,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists instagram_competitor_alerts_org_unread_idx
  on public.instagram_competitor_alerts (org_id, created_at desc) where read_at is null;
create index if not exists instagram_competitor_alerts_competitor_idx
  on public.instagram_competitor_alerts (competitor_id, score desc, created_at desc);

alter table public.instagram_competitor_alerts enable row level security;
drop policy if exists instagram_competitor_alerts_all on public.instagram_competitor_alerts;
create policy instagram_competitor_alerts_all on public.instagram_competitor_alerts for all
  using (public.eh_super_admin() or public.pertence_a_org(org_id))
  with check (public.eh_super_admin() or public.pertence_a_org(org_id));

alter table public.instagram_job_steps
  drop constraint if exists instagram_job_steps_step_type_check;
alter table public.instagram_job_steps
  add constraint instagram_job_steps_step_type_check
  check (step_type in (
    'discover_sources', 'discover_content', 'collect_comments', 'enrich_profiles',
    'analyze_content', 'analyze_audience', 'qualify'
  ));

comment on table public.instagram_competitor_snapshots is
  'Serie historica de audiencia, conteudo e engajamento para comparacao real entre coletas.';
comment on table public.instagram_competitor_alerts is
  'Oportunidades e mudancas relevantes detectadas pelo monitoramento de concorrentes.';

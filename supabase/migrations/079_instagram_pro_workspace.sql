-- Workspace profissional de prospeccao no Instagram.
-- Separa perfis coletados dos leads do CRM, registra cada decisao da busca e
-- adiciona uma fila de abordagem assistida (a API oficial nao permite cold DM).

alter table public.apify_search_cache
  add column if not exists requested_depth integer not null default 0
    check (requested_depth >= 0),
  add column if not exists exhausted boolean not null default false;

create or replace function public.claim_apify_search_cache_v3(
  p_query_key text,
  p_target_depth integer,
  p_ttl_hours integer default 168
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.apify_search_cache%rowtype;
  v_now timestamptz := clock_timestamp();
begin
  if nullif(trim(p_query_key), '') is null
     or p_target_depth < 1
     or p_ttl_hours < 1
     or p_ttl_hours > 720 then
    raise exception 'invalid apify cache claim';
  end if;

  insert into public.apify_search_cache (query_key)
  values (p_query_key)
  on conflict (query_key) do nothing;

  select * into v_row
  from public.apify_search_cache
  where query_key = p_query_key
  for update;

  if v_row.refreshed_at >= v_now - make_interval(hours => p_ttl_hours)
     and (v_row.searched_depth >= p_target_depth or v_row.exhausted) then
    return jsonb_build_object(
      'decision', 'cache',
      'items', v_row.items,
      'searched_depth', v_row.searched_depth,
      'requested_depth', v_row.requested_depth,
      'exhausted', v_row.exhausted
    );
  end if;

  if v_row.refreshing_until is not null and v_row.refreshing_until > v_now then
    return jsonb_build_object('decision', 'wait');
  end if;

  update public.apify_search_cache
  set refreshing_until = v_now + interval '8 minutes', updated_at = v_now
  where query_key = p_query_key;
  return jsonb_build_object('decision', 'refresh');
end;
$$;

create or replace function public.store_apify_search_cache_v3(
  p_query_key text,
  p_requested_depth integer,
  p_items jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actual_depth integer;
begin
  if jsonb_typeof(p_items) <> 'array' or p_requested_depth < 1 then
    raise exception 'invalid apify cache payload';
  end if;

  v_actual_depth := jsonb_array_length(p_items);
  insert into public.apify_search_cache (
    query_key, items, searched_depth, requested_depth, exhausted,
    refreshed_at, refreshing_until, updated_at
  ) values (
    p_query_key, p_items, v_actual_depth, p_requested_depth,
    v_actual_depth < p_requested_depth,
    clock_timestamp(), null, clock_timestamp()
  )
  on conflict (query_key) do update
  set items = excluded.items,
      searched_depth = excluded.searched_depth,
      requested_depth = excluded.requested_depth,
      exhausted = excluded.exhausted,
      refreshed_at = excluded.refreshed_at,
      refreshing_until = null,
      updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.claim_apify_search_cache_v3(text, integer, integer)
  from public, anon, authenticated;
revoke all on function public.store_apify_search_cache_v3(text, integer, jsonb)
  from public, anon, authenticated;
grant execute on function public.claim_apify_search_cache_v3(text, integer, integer)
  to service_role;
grant execute on function public.store_apify_search_cache_v3(text, integer, jsonb)
  to service_role;

alter table public.redes_buscas
  add column if not exists meta_qualificados integer,
  add column if not exists candidatos_solicitados integer,
  add column if not exists consultas jsonb not null default '[]'::jsonb,
  add column if not exists motivo_parada text;

create table if not exists public.instagram_profiles (
  lead_id uuid primary key references public.leads(id) on delete cascade,
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null,
  instagram_user_id text,
  full_name text,
  biography text,
  profile_pic_url text,
  external_url text,
  bio_links jsonb not null default '[]'::jsonb,
  followers_count bigint,
  following_count bigint,
  posts_count bigint,
  verified boolean not null default false,
  private boolean not null default false,
  professional boolean not null default false,
  account_type text,
  business_category text,
  business_email text,
  business_phone text,
  business_address jsonb,
  last_post_at timestamptz,
  avg_likes numeric(12, 2),
  avg_comments numeric(12, 2),
  engagement_rate numeric(8, 4),
  recent_posts jsonb not null default '[]'::jsonb,
  related_profiles jsonb not null default '[]'::jsonb,
  raw_payload jsonb,
  collected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, username)
);

create index if not exists instagram_profiles_org_followers_idx
  on public.instagram_profiles (org_id, followers_count desc);
create index if not exists instagram_profiles_org_collected_idx
  on public.instagram_profiles (org_id, collected_at desc);

alter table public.instagram_profiles enable row level security;
drop policy if exists instagram_profiles_select on public.instagram_profiles;
create policy instagram_profiles_select on public.instagram_profiles for select
  using (public.eh_super_admin() or public.pertence_a_org(org_id));

create table if not exists public.instagram_search_results (
  id uuid primary key default gen_random_uuid(),
  search_id uuid not null references public.redes_buscas(id) on delete cascade,
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null,
  lead_id uuid references public.leads(id) on delete set null,
  decision text not null check (decision in ('approved', 'rejected', 'duplicate')),
  rejection_reason text,
  rank integer not null default 0,
  is_new boolean not null default false,
  score integer,
  profile_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (search_id, username)
);

create index if not exists instagram_search_results_search_rank_idx
  on public.instagram_search_results (search_id, rank);
create index if not exists instagram_search_results_org_created_idx
  on public.instagram_search_results (org_id, created_at desc);

alter table public.instagram_search_results enable row level security;
drop policy if exists instagram_search_results_select on public.instagram_search_results;
create policy instagram_search_results_select on public.instagram_search_results for select
  using (public.eh_super_admin() or public.pertence_a_org(org_id));

-- Substitui somente o CHECK do canal, preservando os demais constraints da tabela.
do $$
declare
  v_constraint text;
begin
  select c.conname into v_constraint
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and t.relname = 'campanhas'
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%canal%';

  if v_constraint is not null then
    execute format('alter table public.campanhas drop constraint %I', v_constraint);
  end if;
end $$;

alter table public.campanhas
  add constraint campanhas_canal_check
  check (canal in ('email', 'whatsapp', 'instagram_assisted'));

alter table public.campanhas
  add column if not exists ig_config jsonb;

create table if not exists public.instagram_outreach_tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  campanha_id uuid not null references public.campanhas(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  message_text text not null,
  state text not null default 'pending'
    check (state in ('pending', 'ready', 'opened', 'sent', 'replied', 'interested', 'converted', 'skipped')),
  assigned_to uuid references auth.users(id) on delete set null,
  opened_at timestamptz,
  sent_at timestamptz,
  replied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campanha_id, lead_id)
);

create index if not exists instagram_outreach_tasks_campaign_state_idx
  on public.instagram_outreach_tasks (campanha_id, state, created_at);
create index if not exists instagram_outreach_tasks_org_state_idx
  on public.instagram_outreach_tasks (org_id, state, created_at desc);

alter table public.instagram_outreach_tasks enable row level security;
drop policy if exists instagram_outreach_tasks_all on public.instagram_outreach_tasks;
create policy instagram_outreach_tasks_all on public.instagram_outreach_tasks for all
  using (public.eh_super_admin() or public.pertence_a_org(org_id))
  with check (public.eh_super_admin() or public.pertence_a_org(org_id));

comment on table public.instagram_profiles is
  'Snapshot enriquecido do perfil Instagram associado ao lead, sem perder dados na tabela generica.';
comment on table public.instagram_search_results is
  'Auditoria completa dos perfis analisados, aprovados, repetidos e rejeitados em cada busca.';
comment on table public.instagram_outreach_tasks is
  'Fila de Direct assistido. O operador abre o perfil, envia manualmente e registra o resultado.';

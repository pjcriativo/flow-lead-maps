-- Instagram Client Hunter: cotas por plano, reserva atomica de uso, catálogo
-- compartilhado e base de oportunidades. Nenhuma coleta paga acontece no SQL.

alter table public.planos
  add column if not exists instagram_nivel text not null default 'basico',
  add column if not exists limite_instagram_leads integer not null default 30,
  add column if not exists limite_instagram_audiencia integer not null default 100,
  add column if not exists limite_instagram_concorrentes integer not null default 1,
  add column if not exists limite_instagram_cacadas integer not null default 3,
  add column if not exists limite_instagram_cruzamentos integer not null default 0,
  add column if not exists limite_instagram_enriquecimentos integer not null default 10,
  add column if not exists limite_instagram_marcas integer not null default 1,
  add column if not exists teto_instagram_usd numeric(12, 4) not null default 0.75,
  add column if not exists monitoramento_instagram text not null default 'manual';

alter table public.planos drop constraint if exists planos_instagram_nivel_check;
alter table public.planos add constraint planos_instagram_nivel_check
  check (instagram_nivel in ('basico', 'pro', 'agencia'));
alter table public.planos drop constraint if exists planos_monitoramento_instagram_check;
alter table public.planos add constraint planos_monitoramento_instagram_check
  check (monitoramento_instagram in ('manual', 'weekly', 'daily'));

update public.planos
set has_instagram_search = true,
    instagram_nivel = case
      when lower(nome) like '%agência%' or lower(nome) like '%agencia%' or lower(nome) like '%enterprise%' then 'agencia'
      when lower(nome) like '%pro%' then 'pro'
      else 'basico'
    end,
    limite_instagram_leads = case
      when lower(nome) like '%agência%' or lower(nome) like '%agencia%' or lower(nome) like '%enterprise%' then 1500
      when lower(nome) like '%pro%' then 300 else 30 end,
    limite_instagram_audiencia = case
      when lower(nome) like '%agência%' or lower(nome) like '%agencia%' or lower(nome) like '%enterprise%' then 10000
      when lower(nome) like '%pro%' then 2000 else 100 end,
    limite_instagram_concorrentes = case
      when lower(nome) like '%agência%' or lower(nome) like '%agencia%' or lower(nome) like '%enterprise%' then 25
      when lower(nome) like '%pro%' then 5 else 1 end,
    limite_instagram_cacadas = case
      when lower(nome) like '%agência%' or lower(nome) like '%agencia%' or lower(nome) like '%enterprise%' then 100
      when lower(nome) like '%pro%' then 20 else 3 end,
    limite_instagram_cruzamentos = case
      when lower(nome) like '%agência%' or lower(nome) like '%agencia%' or lower(nome) like '%enterprise%' then 20
      when lower(nome) like '%pro%' then 3 else 0 end,
    limite_instagram_enriquecimentos = case
      when lower(nome) like '%agência%' or lower(nome) like '%agencia%' or lower(nome) like '%enterprise%' then 2000
      when lower(nome) like '%pro%' then 300 else 10 end,
    limite_instagram_marcas = case
      when lower(nome) like '%agência%' or lower(nome) like '%agencia%' or lower(nome) like '%enterprise%' then 10 else 1 end,
    teto_instagram_usd = case
      when lower(nome) like '%agência%' or lower(nome) like '%agencia%' or lower(nome) like '%enterprise%' then 15
      when lower(nome) like '%pro%' then 4 else 0.75 end,
    monitoramento_instagram = case
      when lower(nome) like '%agência%' or lower(nome) like '%agencia%' or lower(nome) like '%enterprise%' then 'daily'
      when lower(nome) like '%pro%' then 'weekly' else 'manual' end;

create table if not exists public.instagram_plan_usage (
  org_id uuid not null references public.orgs(id) on delete cascade,
  month_ref date not null,
  leads integer not null default 0 check (leads >= 0),
  audience_profiles integer not null default 0 check (audience_profiles >= 0),
  competitors integer not null default 0 check (competitors >= 0),
  hunts integer not null default 0 check (hunts >= 0),
  overlap_runs integer not null default 0 check (overlap_runs >= 0),
  enrichments integer not null default 0 check (enrichments >= 0),
  brands integer not null default 0 check (brands >= 0),
  cost_usd numeric(12, 6) not null default 0 check (cost_usd >= 0),
  updated_at timestamptz not null default now(),
  primary key (org_id, month_ref)
);

alter table public.instagram_plan_usage enable row level security;
drop policy if exists instagram_plan_usage_select on public.instagram_plan_usage;
create policy instagram_plan_usage_select on public.instagram_plan_usage for select
  using (public.eh_super_admin() or public.pertence_a_org(org_id));

create table if not exists public.instagram_usage_reservations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  request_id text not null,
  action text not null,
  month_ref date not null,
  reserved jsonb not null default '{}'::jsonb,
  actual jsonb,
  status text not null default 'reserved' check (status in ('reserved', 'completed', 'failed')),
  created_at timestamptz not null default now(),
  finalized_at timestamptz,
  unique (org_id, request_id)
);

alter table public.instagram_usage_reservations enable row level security;
drop policy if exists instagram_usage_reservations_select on public.instagram_usage_reservations;
create policy instagram_usage_reservations_select on public.instagram_usage_reservations for select
  using (public.eh_super_admin() or public.pertence_a_org(org_id));

create or replace function public.instagram_plan_status(p_org uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan public.planos%rowtype;
  v_usage public.instagram_plan_usage%rowtype;
  v_month date := date_trunc('month', now())::date;
begin
  if auth.role() <> 'service_role' and not public.eh_super_admin() and not public.pertence_a_org(p_org) then
    raise exception 'forbidden';
  end if;
  select p.* into v_plan from public.planos p join public.orgs o on o.plano_id = p.id where o.id = p_org;
  if v_plan.id is null then raise exception 'plan_not_found'; end if;
  insert into public.instagram_plan_usage(org_id, month_ref) values (p_org, v_month)
    on conflict (org_id, month_ref) do nothing;
  select * into v_usage from public.instagram_plan_usage where org_id = p_org and month_ref = v_month;
  return jsonb_build_object(
    'planId', v_plan.id, 'planName', v_plan.nome, 'tier', v_plan.instagram_nivel,
    'monitoring', v_plan.monitoramento_instagram,
    'limits', jsonb_build_object(
      'leads', v_plan.limite_instagram_leads,
      'audienceProfiles', v_plan.limite_instagram_audiencia,
      'competitors', v_plan.limite_instagram_concorrentes,
      'hunts', v_plan.limite_instagram_cacadas,
      'overlaps', v_plan.limite_instagram_cruzamentos,
      'enrichments', v_plan.limite_instagram_enriquecimentos,
      'brands', v_plan.limite_instagram_marcas,
      'monthlyCostUsd', v_plan.teto_instagram_usd
    ),
    'used', jsonb_build_object(
      'leads', v_usage.leads, 'audienceProfiles', v_usage.audience_profiles,
      'competitors', v_usage.competitors, 'hunts', v_usage.hunts,
      'overlaps', v_usage.overlap_runs, 'enrichments', v_usage.enrichments,
      'brands', v_usage.brands, 'monthlyCostUsd', v_usage.cost_usd
    ),
    'features', jsonb_build_object(
      'audience', v_plan.limite_instagram_audiencia > 0,
      'overlap', v_plan.limite_instagram_cruzamentos > 0,
      'reports', v_plan.instagram_nivel in ('pro', 'agencia'),
      'multiBrand', v_plan.limite_instagram_marcas > 1
    ),
    'monthRef', to_char(v_month, 'YYYY-MM')
  );
end;
$$;

create or replace function public.instagram_reserve_usage(
  p_org uuid,
  p_user uuid,
  p_request_id text,
  p_action text,
  p_leads integer default 0,
  p_audience_profiles integer default 0,
  p_competitors integer default 0,
  p_hunts integer default 0,
  p_overlaps integer default 0,
  p_enrichments integer default 0,
  p_brands integer default 0,
  p_cost_usd numeric default 0
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan public.planos%rowtype;
  v_usage public.instagram_plan_usage%rowtype;
  v_existing public.instagram_usage_reservations%rowtype;
  v_month date := date_trunc('month', now())::date;
  v_reserved jsonb;
begin
  if auth.role() <> 'service_role' and not public.eh_super_admin() then raise exception 'forbidden'; end if;
  if coalesce(trim(p_request_id), '') = '' then raise exception 'request_id_required'; end if;
  select * into v_existing from public.instagram_usage_reservations
    where org_id = p_org and request_id = p_request_id;
  if v_existing.id is not null then
    return jsonb_build_object('ok', true, 'idempotent', true, 'reservationId', v_existing.id, 'status', v_existing.status);
  end if;
  select p.* into v_plan from public.planos p join public.orgs o on o.plano_id = p.id where o.id = p_org;
  if v_plan.id is null or not coalesce(v_plan.has_instagram_search, false) then
    return jsonb_build_object('ok', false, 'reason', 'feature_not_in_plan');
  end if;
  insert into public.instagram_plan_usage(org_id, month_ref) values (p_org, v_month)
    on conflict (org_id, month_ref) do nothing;
  select * into v_usage from public.instagram_plan_usage
    where org_id = p_org and month_ref = v_month for update;
  if v_usage.leads + greatest(p_leads, 0) > v_plan.limite_instagram_leads then return jsonb_build_object('ok', false, 'reason', 'leads_limit', 'status', public.instagram_plan_status(p_org)); end if;
  if v_usage.audience_profiles + greatest(p_audience_profiles, 0) > v_plan.limite_instagram_audiencia then return jsonb_build_object('ok', false, 'reason', 'audience_limit', 'status', public.instagram_plan_status(p_org)); end if;
  if v_usage.competitors + greatest(p_competitors, 0) > v_plan.limite_instagram_concorrentes then return jsonb_build_object('ok', false, 'reason', 'competitors_limit', 'status', public.instagram_plan_status(p_org)); end if;
  if v_usage.hunts + greatest(p_hunts, 0) > v_plan.limite_instagram_cacadas then return jsonb_build_object('ok', false, 'reason', 'hunts_limit', 'status', public.instagram_plan_status(p_org)); end if;
  if v_usage.overlap_runs + greatest(p_overlaps, 0) > v_plan.limite_instagram_cruzamentos then return jsonb_build_object('ok', false, 'reason', 'overlap_not_in_plan', 'status', public.instagram_plan_status(p_org)); end if;
  if v_usage.enrichments + greatest(p_enrichments, 0) > v_plan.limite_instagram_enriquecimentos then return jsonb_build_object('ok', false, 'reason', 'enrichments_limit', 'status', public.instagram_plan_status(p_org)); end if;
  if v_usage.brands + greatest(p_brands, 0) > v_plan.limite_instagram_marcas then return jsonb_build_object('ok', false, 'reason', 'brands_limit', 'status', public.instagram_plan_status(p_org)); end if;
  if v_usage.cost_usd + greatest(p_cost_usd, 0) > v_plan.teto_instagram_usd then return jsonb_build_object('ok', false, 'reason', 'cost_limit', 'status', public.instagram_plan_status(p_org)); end if;
  v_reserved := jsonb_build_object(
    'leads', greatest(p_leads, 0), 'audienceProfiles', greatest(p_audience_profiles, 0),
    'competitors', greatest(p_competitors, 0), 'hunts', greatest(p_hunts, 0),
    'overlaps', greatest(p_overlaps, 0), 'enrichments', greatest(p_enrichments, 0),
    'brands', greatest(p_brands, 0), 'monthlyCostUsd', greatest(p_cost_usd, 0)
  );
  update public.instagram_plan_usage set
    leads = leads + greatest(p_leads, 0), audience_profiles = audience_profiles + greatest(p_audience_profiles, 0),
    competitors = competitors + greatest(p_competitors, 0), hunts = hunts + greatest(p_hunts, 0),
    overlap_runs = overlap_runs + greatest(p_overlaps, 0), enrichments = enrichments + greatest(p_enrichments, 0),
    brands = brands + greatest(p_brands, 0), cost_usd = cost_usd + greatest(p_cost_usd, 0), updated_at = now()
  where org_id = p_org and month_ref = v_month;
  insert into public.instagram_usage_reservations(org_id, user_id, request_id, action, month_ref, reserved)
    values (p_org, p_user, p_request_id, p_action, v_month, v_reserved)
    returning * into v_existing;
  return jsonb_build_object('ok', true, 'idempotent', false, 'reservationId', v_existing.id, 'status', public.instagram_plan_status(p_org));
end;
$$;

create or replace function public.instagram_finalize_usage(
  p_org uuid,
  p_request_id text,
  p_status text,
  p_leads integer default 0,
  p_audience_profiles integer default 0,
  p_competitors integer default 0,
  p_hunts integer default 0,
  p_overlaps integer default 0,
  p_enrichments integer default 0,
  p_brands integer default 0,
  p_cost_usd numeric default 0
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_res public.instagram_usage_reservations%rowtype;
  v_actual jsonb;
begin
  if auth.role() <> 'service_role' and not public.eh_super_admin() then raise exception 'forbidden'; end if;
  select * into v_res from public.instagram_usage_reservations
    where org_id = p_org and request_id = p_request_id for update;
  if v_res.id is null then return jsonb_build_object('ok', false, 'reason', 'reservation_not_found'); end if;
  if v_res.status <> 'reserved' then return jsonb_build_object('ok', true, 'idempotent', true); end if;
  v_actual := jsonb_build_object(
    'leads', greatest(p_leads, 0), 'audienceProfiles', greatest(p_audience_profiles, 0),
    'competitors', greatest(p_competitors, 0), 'hunts', greatest(p_hunts, 0),
    'overlaps', greatest(p_overlaps, 0), 'enrichments', greatest(p_enrichments, 0),
    'brands', greatest(p_brands, 0), 'monthlyCostUsd', greatest(p_cost_usd, 0)
  );
  update public.instagram_plan_usage set
    leads = greatest(0, leads - (v_res.reserved->>'leads')::int + greatest(p_leads, 0)),
    audience_profiles = greatest(0, audience_profiles - (v_res.reserved->>'audienceProfiles')::int + greatest(p_audience_profiles, 0)),
    competitors = greatest(0, competitors - (v_res.reserved->>'competitors')::int + greatest(p_competitors, 0)),
    hunts = greatest(0, hunts - (v_res.reserved->>'hunts')::int + greatest(p_hunts, 0)),
    overlap_runs = greatest(0, overlap_runs - (v_res.reserved->>'overlaps')::int + greatest(p_overlaps, 0)),
    enrichments = greatest(0, enrichments - (v_res.reserved->>'enrichments')::int + greatest(p_enrichments, 0)),
    brands = greatest(0, brands - (v_res.reserved->>'brands')::int + greatest(p_brands, 0)),
    cost_usd = greatest(0, cost_usd - (v_res.reserved->>'monthlyCostUsd')::numeric + greatest(p_cost_usd, 0)),
    updated_at = now()
  where org_id = p_org and month_ref = v_res.month_ref;
  update public.instagram_usage_reservations set actual = v_actual,
    status = case when p_status = 'completed' then 'completed' else 'failed' end,
    finalized_at = now() where id = v_res.id;
  return jsonb_build_object('ok', true, 'status', public.instagram_plan_status(p_org));
end;
$$;

revoke all on function public.instagram_reserve_usage(uuid, uuid, text, text, integer, integer, integer, integer, integer, integer, integer, numeric) from public, anon, authenticated;
revoke all on function public.instagram_finalize_usage(uuid, text, text, integer, integer, integer, integer, integer, integer, integer, numeric) from public, anon, authenticated;
grant execute on function public.instagram_reserve_usage(uuid, uuid, text, text, integer, integer, integer, integer, integer, integer, integer, numeric) to service_role;
grant execute on function public.instagram_finalize_usage(uuid, text, text, integer, integer, integer, integer, integer, integer, integer, numeric) to service_role;
grant execute on function public.instagram_plan_status(uuid) to authenticated, service_role;

create or replace function public.instagram_release_competitor(p_org uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' and not public.eh_super_admin() then raise exception 'forbidden'; end if;
  update public.instagram_plan_usage
  set competitors = greatest(0, competitors - 1), updated_at = now()
  where org_id = p_org and month_ref = date_trunc('month', now())::date;
end;
$$;
revoke all on function public.instagram_release_competitor(uuid) from public, anon, authenticated;
grant execute on function public.instagram_release_competitor(uuid) to service_role;

create table if not exists public.instagram_profile_catalog (
  id uuid primary key default gen_random_uuid(),
  identity_key text not null unique,
  instagram_user_id text,
  username text not null,
  full_name text,
  biography text,
  profile_pic_url text,
  followers_count integer,
  following_count integer,
  posts_count integer,
  professional boolean,
  business_category text,
  external_url text,
  public_payload jsonb not null default '{}'::jsonb,
  collected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists instagram_profile_catalog_user_id_idx
  on public.instagram_profile_catalog(instagram_user_id) where instagram_user_id is not null;
create index if not exists instagram_profile_catalog_username_idx on public.instagram_profile_catalog(lower(username));
alter table public.instagram_profile_catalog enable row level security;

create table if not exists public.instagram_audience_memberships (
  id uuid primary key default gen_random_uuid(),
  source_username text not null,
  member_identity_key text not null references public.instagram_profile_catalog(identity_key) on delete cascade,
  relationship text not null check (relationship in ('follower', 'following', 'commenter')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  source_collected_at timestamptz not null default now(),
  unique (source_username, member_identity_key, relationship)
);
create index if not exists instagram_audience_source_idx
  on public.instagram_audience_memberships(source_username, relationship, last_seen_at desc);
create index if not exists instagram_audience_member_idx
  on public.instagram_audience_memberships(member_identity_key, source_username);
alter table public.instagram_audience_memberships enable row level security;

create table if not exists public.instagram_opportunities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  profile_identity_key text not null references public.instagram_profile_catalog(identity_key) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  score integer not null default 0 check (score between 0 and 100),
  temperature text not null default 'frio' check (temperature in ('quente', 'morno', 'frio')),
  reasons jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  suggested_approach text,
  status text not null default 'new' check (status in ('new', 'saved', 'contacted', 'won', 'lost', 'ignored')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, profile_identity_key)
);
create index if not exists instagram_opportunities_org_score_idx
  on public.instagram_opportunities(org_id, score desc, last_seen_at desc);
alter table public.instagram_opportunities enable row level security;
drop policy if exists instagram_opportunities_all on public.instagram_opportunities;
create policy instagram_opportunities_all on public.instagram_opportunities for all
  using (public.eh_super_admin() or public.pertence_a_org(org_id))
  with check (public.eh_super_admin() or public.pertence_a_org(org_id));

alter table public.instagram_discovery_jobs drop constraint if exists instagram_discovery_jobs_mode_check;
alter table public.instagram_discovery_jobs add constraint instagram_discovery_jobs_mode_check
  check (mode in ('comments', 'profiles', 'hashtags', 'places', 'mentions', 'competitors', 'audience', 'overlap'));
alter table public.instagram_job_steps drop constraint if exists instagram_job_steps_step_type_check;
alter table public.instagram_job_steps add constraint instagram_job_steps_step_type_check
  check (step_type in ('discover_sources', 'discover_content', 'collect_comments', 'collect_audience',
    'enrich_profiles', 'analyze_content', 'analyze_audience', 'qualify'));

-- O contador começa refletindo o estoque já existente neste mês para impedir que
-- contas ativas ganhem uma cota extra ao entrar a migração.
insert into public.instagram_plan_usage(org_id, month_ref, leads, competitors, hunts, cost_usd)
select o.id, date_trunc('month', now())::date,
  coalesce((select count(*) from public.instagram_profiles ip where ip.org_id = o.id and ip.collected_at >= date_trunc('month', now())), 0)::int,
  coalesce((select count(*) from public.instagram_competitors ic where ic.org_id = o.id and ic.status <> 'archived'), 0)::int,
  (
    coalesce((select count(*) from public.instagram_discovery_jobs j where j.org_id = o.id and j.created_at >= date_trunc('month', now())), 0)
    + coalesce((select count(*) from public.redes_buscas r where r.org_id = o.id and r.fonte = 'instagram' and r.criado_em >= date_trunc('month', now()) and r.status <> 'parada_teto'), 0)
  )::int,
  (
    coalesce((select sum(j.actual_cost_usd) from public.instagram_discovery_jobs j where j.org_id = o.id and j.created_at >= date_trunc('month', now())), 0)
    + coalesce((select sum(r.custo_usd) from public.redes_buscas r where r.org_id = o.id and r.fonte = 'instagram' and r.criado_em >= date_trunc('month', now())), 0)
  )
from public.orgs o
on conflict (org_id, month_ref) do update set
  leads = greatest(public.instagram_plan_usage.leads, excluded.leads),
  competitors = greatest(public.instagram_plan_usage.competitors, excluded.competitors),
  hunts = greatest(public.instagram_plan_usage.hunts, excluded.hunts),
  cost_usd = greatest(public.instagram_plan_usage.cost_usd, excluded.cost_usd),
  updated_at = now();

comment on table public.instagram_profile_catalog is
  'Catálogo global de dados públicos do Instagram; evita pagar novamente pela mesma identidade.';
comment on table public.instagram_usage_reservations is
  'Reserva idempotente e atômica das cotas Instagram antes de qualquer coleta externa.';

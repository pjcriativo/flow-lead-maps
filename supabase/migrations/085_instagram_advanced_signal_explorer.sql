-- Fase 6 do Instagram Prospect Engine: Reels, mencoes, importacao e expansao relacionada.

alter table public.instagram_discovery_jobs
  drop constraint if exists instagram_discovery_jobs_mode_check;
alter table public.instagram_discovery_jobs
  add constraint instagram_discovery_jobs_mode_check
  check (mode in (
    'comments',
    'profiles',
    'hashtags',
    'places',
    'mentions',
    'competitors',
    'reels',
    'imports',
    'related'
  ));

alter table public.instagram_profile_evidence
  drop constraint if exists instagram_profile_evidence_evidence_type_check;
alter table public.instagram_profile_evidence
  add constraint instagram_profile_evidence_evidence_type_check
  check (evidence_type in (
    'comment',
    'reply',
    'mention',
    'profile_signal',
    'hashtag_post',
    'place_post',
    'reel',
    'mention_post',
    'import_profile',
    'related_profile'
  ));

create index if not exists instagram_discovery_jobs_org_advanced_mode_idx
  on public.instagram_discovery_jobs (org_id, mode, created_at desc)
  where mode in ('reels', 'mentions', 'imports', 'related');

comment on index public.instagram_discovery_jobs_org_advanced_mode_idx is
  'Historico e dashboard das fontes avancadas do Signal Explorer.';

create or replace function public.instagram_dashboard_advanced_v1(p_days integer default 30)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with
  context as (
    select
      public.org_do_usuario(auth.uid()) as org_id,
      greatest(7, least(coalesce(p_days, 30), 365)) as days
    where auth.uid() is not null
  ),
  runs as (
    select
      j.id,
      j.mode as source,
      case j.mode
        when 'reels' then 'Reels Intelligence'
        when 'mentions' then 'Mention Hunter'
        when 'imports' then 'Importacao de perfis'
        when 'related' then 'Perfis relacionados'
      end as label,
      j.status,
      j.created_at,
      coalesce(j.actual_cost_usd, 0)::numeric as cost,
      coalesce(nullif(j.stats->>'contentItems', '')::integer, 0) as collected,
      coalesce(nullif(j.stats->>'uniqueProfiles', '')::integer, 0) as unique_profiles,
      coalesce(nullif(j.stats->>'enrichedProfiles', '')::integer, 0) as enriched,
      coalesce(nullif(j.stats->>'qualified', '')::integer, 0) as qualified,
      coalesce(nullif(j.stats->>'newLeads', '')::integer, 0) as new_leads,
      coalesce(nullif(j.stats->>'duplicates', '')::integer, 0) as duplicates,
      coalesce(j.input->>'niche', '') as niche,
      coalesce(j.input->>'city', '') as city
    from public.instagram_discovery_jobs j
    join context c on c.org_id = j.org_id
    where j.created_at >= clock_timestamp() - make_interval(days => c.days)
      and j.mode in ('reels', 'mentions', 'imports', 'related')
  ),
  source_totals as (
    select
      source,
      min(label) as label,
      count(*)::integer as runs,
      count(*) filter (where status in ('completed', 'partial'))::integer as successful_runs,
      sum(collected)::integer as collected,
      sum(unique_profiles)::integer as unique_profiles,
      sum(enriched)::integer as enriched,
      sum(qualified)::integer as qualified,
      sum(new_leads)::integer as new_leads,
      sum(duplicates)::integer as duplicates,
      round(sum(cost), 6) as cost
    from runs group by source
  ),
  totals as (
    select
      coalesce(sum(collected), 0)::integer as collected,
      coalesce(sum(unique_profiles), 0)::integer as unique_profiles,
      coalesce(sum(enriched), 0)::integer as enriched,
      coalesce(sum(qualified), 0)::integer as qualified,
      coalesce(sum(new_leads), 0)::integer as new_leads,
      coalesce(sum(duplicates), 0)::integer as duplicates,
      coalesce(round(sum(cost), 6), 0) as cost
    from runs
  ),
  daily as (
    select created_at::date as day, sum(collected)::integer as collected,
      sum(qualified)::integer as qualified, sum(new_leads)::integer as new_leads,
      round(sum(cost), 6) as cost
    from runs group by created_at::date
  )
  select jsonb_build_object(
    'version', 1,
    'days', coalesce((select days from context), greatest(7, least(coalesce(p_days, 30), 365))),
    'generatedAt', clock_timestamp(),
    'overview', jsonb_build_object(
      'profiles', 0, 'followers', 0, 'contactable', 0, 'averageEngagement', 0,
      'averageScore', 0, 'scoreCoverage', 0
    ),
    'funnel', (select to_jsonb(totals) from totals),
    'allCost', (select cost from totals),
    'intelligenceOpportunities', 0,
    'sources', coalesce((select jsonb_agg(jsonb_build_object(
      'id', source, 'label', label, 'kind', 'acquisition', 'runs', runs,
      'successfulRuns', successful_runs, 'collected', collected,
      'uniqueProfiles', unique_profiles, 'enriched', enriched, 'qualified', qualified,
      'newLeads', new_leads, 'duplicates', duplicates, 'cost', cost
    ) order by new_leads desc, qualified desc) from source_totals), '[]'::jsonb),
    'timeline', coalesce((select jsonb_agg(jsonb_build_object(
      'date', day, 'collected', collected, 'qualified', qualified,
      'newLeads', new_leads, 'cost', cost
    ) order by day) from daily), '[]'::jsonb),
    'rejections', '[]'::jsonb,
    'intentSignals', '[]'::jsonb,
    'scoreDistribution', '[]'::jsonb,
    'audienceDistribution', '[]'::jsonb,
    'campaign', jsonb_build_object(
      'queued', 0, 'opened', 0, 'sent', 0, 'replied', 0, 'interested', 0, 'converted', 0
    ),
    'topNiches', '[]'::jsonb,
    'topCities', '[]'::jsonb,
    'recentRuns', coalesce((select jsonb_agg(row_data order by created_at desc) from (
      select created_at, jsonb_build_object(
        'id', id, 'source', source, 'label', label, 'kind', 'acquisition',
        'status', status, 'createdAt', created_at, 'collected', collected,
        'qualified', qualified, 'newLeads', new_leads, 'cost', cost,
        'niche', niche, 'city', city
      ) as row_data from runs order by created_at desc limit 12
    ) recent), '[]'::jsonb)
  );
$$;

revoke all on function public.instagram_dashboard_advanced_v1(integer) from public, anon;
grant execute on function public.instagram_dashboard_advanced_v1(integer) to authenticated;

comment on function public.instagram_dashboard_advanced_v1(integer) is
  'Agregados exatos das fontes avancadas, mesclados ao dashboard principal no cliente.';

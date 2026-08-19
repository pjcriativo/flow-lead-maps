-- Fase 5 do Instagram Prospect Engine: dashboard analitico multifuente.
-- A agregacao acontece no PostgreSQL para manter numeros exatos mesmo quando
-- a base ultrapassa os limites de paginacao do cliente.

create index if not exists instagram_profile_evidence_org_created_idx
  on public.instagram_profile_evidence (org_id, created_at desc);

create index if not exists instagram_discovery_jobs_org_mode_created_idx
  on public.instagram_discovery_jobs (org_id, mode, created_at desc);

create index if not exists instagram_profiles_org_source_collected_idx
  on public.instagram_profiles (org_id, discovery_source, collected_at desc);

create index if not exists redes_buscas_org_fonte_created_idx
  on public.redes_buscas (org_id, fonte, criado_em desc);

create or replace function public.instagram_dashboard_v1(p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_days integer := greatest(7, least(coalesce(p_days, 30), 365));
  v_since timestamptz;
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'nao_autenticado';
  end if;

  v_org := public.org_do_usuario(auth.uid());
  if v_org is null then
    raise exception 'organizacao_nao_encontrada';
  end if;
  v_since := clock_timestamp() - make_interval(days => v_days);

  with
  search_result_totals as (
    select
      r.search_id,
      count(*)::integer as enriched,
      count(*) filter (where r.decision = 'approved')::integer as qualified,
      count(*) filter (where r.decision = 'duplicate')::integer as duplicates,
      count(*) filter (where r.is_new)::integer as new_leads
    from public.instagram_search_results r
    where r.org_id = v_org and r.created_at >= v_since
    group by r.search_id
  ),
  normalized_runs as (
    select
      b.id,
      'profile_search'::text as source,
      'Busca de perfis'::text as source_label,
      'acquisition'::text as source_kind,
      b.status,
      b.criado_em as created_at,
      coalesce(b.custo_usd, 0)::numeric as cost,
      greatest(coalesce(b.encontrados, 0), coalesce(s.enriched, 0))::integer as collected,
      coalesce(s.enriched, b.encontrados, 0)::integer as unique_profiles,
      coalesce(s.enriched, 0)::integer as enriched,
      coalesce(s.qualified, b.inseridos, 0)::integer as qualified,
      coalesce(s.new_leads, b.inseridos, 0)::integer as new_leads,
      coalesce(s.duplicates, 0)::integer as duplicates,
      coalesce(b.pedido->>'nicho', b.pedido->'campos'->>'nicho', '') as niche,
      coalesce(b.pedido->>'cidade', b.pedido->'campos'->>'cidade', '') as city
    from public.redes_buscas b
    left join search_result_totals s on s.search_id = b.id
    where b.org_id = v_org and b.fonte = 'instagram' and b.criado_em >= v_since

    union all

    select
      j.id,
      j.mode as source,
      case j.mode
        when 'comments' then 'Comments Hunter'
        when 'hashtags' then 'Radar de hashtags'
        when 'places' then 'Radar de locais'
        when 'competitors' then 'Concorrentes'
        else initcap(j.mode)
      end as source_label,
      case when j.mode = 'competitors' then 'intelligence' else 'acquisition' end as source_kind,
      j.status,
      j.created_at,
      coalesce(j.actual_cost_usd, 0)::numeric as cost,
      case
        when j.mode = 'comments' then coalesce(nullif(j.stats->>'comments', '')::integer, 0)
        when j.mode in ('hashtags', 'places') then coalesce(nullif(j.stats->>'contentItems', '')::integer, 0)
        when j.mode = 'competitors' then coalesce(nullif(j.stats->>'comments', '')::integer, 0)
        else 0
      end as collected,
      case
        when j.mode = 'comments' then coalesce(nullif(j.stats->>'uniqueCommenters', '')::integer, 0)
        when j.mode in ('hashtags', 'places') then coalesce(nullif(j.stats->>'uniqueProfiles', '')::integer, 0)
        when j.mode = 'competitors' then coalesce(nullif(j.stats->>'uniqueCommenters', '')::integer, 0)
        else 0
      end as unique_profiles,
      case
        when j.mode in ('comments', 'hashtags', 'places')
          then coalesce(nullif(j.stats->>'enrichedProfiles', '')::integer, 0)
        else 0
      end as enriched,
      case
        when j.mode in ('comments', 'hashtags', 'places')
          then coalesce(nullif(j.stats->>'qualified', '')::integer, 0)
        when j.mode = 'competitors'
          then coalesce(nullif(j.stats->>'opportunities', '')::integer, 0)
        else 0
      end as qualified,
      case when j.mode in ('comments', 'hashtags', 'places')
        then coalesce(nullif(j.stats->>'newLeads', '')::integer, 0) else 0 end as new_leads,
      case when j.mode in ('comments', 'hashtags', 'places')
        then coalesce(nullif(j.stats->>'duplicates', '')::integer, 0) else 0 end as duplicates,
      coalesce(j.input->>'niche', '') as niche,
      coalesce(j.input->>'city', '') as city
    from public.instagram_discovery_jobs j
    where j.org_id = v_org
      and j.created_at >= v_since
      and j.mode in ('comments', 'hashtags', 'places', 'competitors')
  ),
  source_totals as (
    select
      source,
      min(source_label) as label,
      min(source_kind) as kind,
      count(*)::integer as runs,
      count(*) filter (where status in ('completed', 'partial', 'concluida'))::integer as successful_runs,
      sum(collected)::integer as collected,
      sum(unique_profiles)::integer as unique_profiles,
      sum(enriched)::integer as enriched,
      sum(qualified)::integer as qualified,
      sum(new_leads)::integer as new_leads,
      sum(duplicates)::integer as duplicates,
      round(sum(cost), 6) as cost
    from normalized_runs
    group by source
  ),
  acquisition_totals as (
    select
      coalesce(sum(collected), 0)::integer as collected,
      coalesce(sum(unique_profiles), 0)::integer as unique_profiles,
      coalesce(sum(enriched), 0)::integer as enriched,
      coalesce(sum(qualified), 0)::integer as qualified,
      coalesce(sum(new_leads), 0)::integer as new_leads,
      coalesce(sum(duplicates), 0)::integer as duplicates,
      coalesce(round(sum(cost), 6), 0) as cost
    from normalized_runs
    where source_kind = 'acquisition'
  ),
  daily as (
    select
      created_at::date as day,
      sum(collected) filter (where source_kind = 'acquisition')::integer as collected,
      sum(qualified) filter (where source_kind = 'acquisition')::integer as qualified,
      sum(new_leads) filter (where source_kind = 'acquisition')::integer as new_leads,
      round(sum(cost), 6) as cost
    from normalized_runs
    group by created_at::date
    order by created_at::date
  ),
  rejection_totals as (
    select reason, sum(amount)::integer as amount
    from (
      select coalesce(nullif(rejection_reason, ''), 'nao_informado') as reason, count(*)::integer as amount
      from public.instagram_search_results
      where org_id = v_org and created_at >= v_since and decision = 'rejected'
      group by 1
      union all
      select coalesce(nullif(rejection_reason, ''), 'nao_informado') as reason, count(*)::integer as amount
      from public.instagram_profile_evidence
      where org_id = v_org and created_at >= v_since and decision = 'rejected'
      group by 1
    ) rejected
    group by reason
    order by amount desc
  ),
  intent_totals as (
    select intent_label as label, count(*)::integer as amount
    from public.instagram_profile_evidence
    where org_id = v_org and created_at >= v_since and nullif(intent_label, '') is not null
    group by intent_label
    order by amount desc
  ),
  score_ranges as (
    select range, count(*)::integer as amount
    from (
      select case
        when coalesce(lead_score, 0) >= 80 then '80-100'
        when coalesce(lead_score, 0) >= 60 then '60-79'
        when coalesce(lead_score, 0) >= 40 then '40-59'
        else '0-39'
      end as range
      from public.instagram_profiles where org_id = v_org
    ) scores
    group by range
  ),
  audience_ranges as (
    select range, count(*)::integer as amount
    from (
      select case
        when coalesce(followers_count, 0) < 1000 then 'Ate 1 mil'
        when followers_count < 5000 then '1-5 mil'
        when followers_count < 20000 then '5-20 mil'
        else '20 mil+'
      end as range
      from public.instagram_profiles where org_id = v_org
    ) audience
    group by range
  ),
  campaign_totals as (
    select
      count(*)::integer as queued,
      count(*) filter (where state in ('opened', 'sent', 'replied', 'interested', 'converted'))::integer as opened,
      count(*) filter (where state in ('sent', 'replied', 'interested', 'converted'))::integer as sent,
      count(*) filter (where state in ('replied', 'interested', 'converted'))::integer as replied,
      count(*) filter (where state in ('interested', 'converted'))::integer as interested,
      count(*) filter (where state = 'converted')::integer as converted
    from public.instagram_outreach_tasks
    where org_id = v_org and created_at >= v_since
  ),
  top_niches as (
    select coalesce(nullif(l.category, ''), 'Sem nicho') as label, count(*)::integer as amount
    from public.instagram_profiles p
    join public.leads l on l.id = p.lead_id
    where p.org_id = v_org
    group by 1 order by amount desc limit 6
  ),
  top_cities as (
    select coalesce(nullif(l.city, ''), 'Sem cidade') as label, count(*)::integer as amount
    from public.instagram_profiles p
    join public.leads l on l.id = p.lead_id
    where p.org_id = v_org
    group by 1 order by amount desc limit 6
  )
  select jsonb_build_object(
    'version', 1,
    'days', v_days,
    'generatedAt', clock_timestamp(),
    'overview', (
      select jsonb_build_object(
        'profiles', count(*),
        'followers', coalesce(sum(followers_count), 0),
        'contactable', count(*) filter (where business_email is not null or business_phone is not null or external_url is not null),
        'averageEngagement', coalesce(round(avg(engagement_rate), 2), 0),
        'averageScore', coalesce(round(avg(lead_score), 1), 0),
        'scoreCoverage', case when count(*) = 0 then 0 else round(100.0 * count(lead_score) / count(*), 1) end
      ) from public.instagram_profiles where org_id = v_org
    ),
    'funnel', (select to_jsonb(acquisition_totals) from acquisition_totals),
    'allCost', (select coalesce(round(sum(cost), 6), 0) from normalized_runs),
    'intelligenceOpportunities', (
      select coalesce(sum(qualified), 0) from normalized_runs where source_kind = 'intelligence'
    ),
    'sources', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', source, 'label', label, 'kind', kind, 'runs', runs,
        'successfulRuns', successful_runs, 'collected', collected,
        'uniqueProfiles', unique_profiles, 'enriched', enriched,
        'qualified', qualified, 'newLeads', new_leads,
        'duplicates', duplicates, 'cost', cost
      ) order by new_leads desc, qualified desc, cost asc) from source_totals
    ), '[]'::jsonb),
    'timeline', coalesce((
      select jsonb_agg(jsonb_build_object(
        'date', day, 'collected', coalesce(collected, 0), 'qualified', coalesce(qualified, 0),
        'newLeads', coalesce(new_leads, 0), 'cost', cost
      ) order by day) from daily
    ), '[]'::jsonb),
    'rejections', coalesce((select jsonb_agg(to_jsonb(rejection_totals)) from rejection_totals), '[]'::jsonb),
    'intentSignals', coalesce((select jsonb_agg(to_jsonb(intent_totals)) from intent_totals), '[]'::jsonb),
    'scoreDistribution', coalesce((select jsonb_agg(to_jsonb(score_ranges)) from score_ranges), '[]'::jsonb),
    'audienceDistribution', coalesce((select jsonb_agg(to_jsonb(audience_ranges)) from audience_ranges), '[]'::jsonb),
    'campaign', (select to_jsonb(campaign_totals) from campaign_totals),
    'topNiches', coalesce((select jsonb_agg(to_jsonb(top_niches)) from top_niches), '[]'::jsonb),
    'topCities', coalesce((select jsonb_agg(to_jsonb(top_cities)) from top_cities), '[]'::jsonb),
    'recentRuns', coalesce((
      select jsonb_agg(row_data order by created_at desc)
      from (
        select created_at, jsonb_build_object(
          'id', id, 'source', source, 'label', source_label, 'kind', source_kind,
          'status', status, 'createdAt', created_at, 'collected', collected,
          'qualified', qualified, 'newLeads', new_leads, 'cost', cost,
          'niche', niche, 'city', city
        ) as row_data
        from normalized_runs order by created_at desc limit 12
      ) latest
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.instagram_dashboard_v1(integer) from public, anon;
grant execute on function public.instagram_dashboard_v1(integer) to authenticated;

comment on function public.instagram_dashboard_v1(integer) is
  'Dashboard exato do Instagram por organizacao e periodo, separando aquisicao de inteligencia competitiva.';

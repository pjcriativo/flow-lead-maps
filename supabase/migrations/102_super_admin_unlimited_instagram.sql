-- Super Admin nao recebe bloqueios comerciais no Instagram/Flow Business.
-- Limites nulos nos snapshots significam ilimitado; o consumo continua sendo medido.

create or replace function public.org_dono_eh_super_admin(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.orgs o
    join public.profiles p on p.id = o.dono_user_id
    where o.id = p_org and coalesce(p.is_super_admin, false)
  )
$$;

revoke all on function public.org_dono_eh_super_admin(uuid) from public, anon, authenticated;
grant execute on function public.org_dono_eh_super_admin(uuid) to service_role;

create or replace function public.flow_business_enforce_stock_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer;
  v_used integer;
  v_resource text := tg_argv[0];
begin
  if new.org_id is null then raise exception 'org_required'; end if;
  if public.org_dono_eh_super_admin(new.org_id) then return new; end if;
  if v_resource = 'accounts' and new.meta_ig_user_id is not null and exists (
    select 1 from public.ig_instancias
    where org_id = new.org_id and meta_ig_user_id = new.meta_ig_user_id
  ) then return new; end if;
  perform pg_advisory_xact_lock(
    hashtextextended('flow_business_limit:' || v_resource || ':' || new.org_id::text, 0)
  );

  if v_resource = 'accounts' then
    select p.limite_flow_business_contas into v_limit
    from public.orgs o join public.planos p on p.id = o.plano_id where o.id = new.org_id;
    select count(*) into v_used from public.ig_instancias where org_id = new.org_id;
  elsif v_resource = 'crm' then
    select p.limite_flow_business_crm into v_limit
    from public.orgs o join public.planos p on p.id = o.plano_id where o.id = new.org_id;
    select count(*) into v_used from public.instagram_crm_cards where org_id = new.org_id;
  elsif v_resource = 'cadences' then
    select p.limite_flow_business_cadencias into v_limit
    from public.orgs o join public.planos p on p.id = o.plano_id where o.id = new.org_id;
    select count(*) into v_used from public.instagram_cadences where org_id = new.org_id;
  elsif v_resource = 'flows' then
    select p.limite_flow_business_fluxos into v_limit
    from public.orgs o join public.planos p on p.id = o.plano_id where o.id = new.org_id;
    select count(*) into v_used from public.instagram_flows where org_id = new.org_id;
  else
    raise exception 'invalid_flow_business_resource';
  end if;

  if v_limit is null then raise exception 'plan_not_found'; end if;
  if v_used >= v_limit then
    raise exception 'flow_business_limit:%:%/%', v_resource, v_used, v_limit;
  end if;
  return new;
end;
$$;

create or replace function public.flow_business_set_session_automation(
  p_instance_id uuid,
  p_enabled boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := public.org_do_usuario(auth.uid());
  v_instance public.ig_instancias%rowtype;
  v_dms_month integer;
begin
  if auth.uid() is null or v_org is null then raise exception 'forbidden'; end if;

  select * into v_instance
  from public.ig_instancias
  where id = p_instance_id and org_id = v_org
  for update;

  if v_instance.id is null or v_instance.provider <> 'session_worker' then
    raise exception 'session_account_required';
  end if;
  if p_enabled and v_instance.status <> 'conectado' then
    raise exception 'connected_account_required';
  end if;

  select p.limite_flow_business_dms_mes into v_dms_month
  from public.orgs o join public.planos p on p.id = o.plano_id
  where o.id = v_org;

  if p_enabled and not public.org_dono_eh_super_admin(v_org)
    and coalesce(v_dms_month, 0) <= 0 then
    raise exception 'flow_not_available_on_plan';
  end if;
  if p_enabled and not exists (
    select 1 from public.instagram_flows f
    where f.org_id = v_org and f.account_id = p_instance_id
      and f.status = 'active' and f.trigger_type = 'comment_keyword'
  ) then raise exception 'active_comment_flow_required'; end if;

  insert into public.instagram_automation_accounts(
    instance_id, org_id, enabled, last_polled_at, next_poll_at,
    consecutive_failures, paused_reason, lease_owner, lease_until
  ) values (
    p_instance_id, v_org, p_enabled,
    case when p_enabled then now() else null end,
    now(), 0, null, null, null
  ) on conflict (instance_id) do update set
    enabled = excluded.enabled,
    last_polled_at = case
      when excluded.enabled then now()
      else instagram_automation_accounts.last_polled_at
    end,
    next_poll_at = now(),
    consecutive_failures = 0,
    paused_reason = null,
    lease_owner = null,
    lease_until = null,
    updated_at = now();
end;
$$;

create or replace function public.flow_business_claim_automation_job(
  p_instance_id uuid,
  p_worker_id text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.instagram_automation_jobs%rowtype;
  v_instance public.ig_instancias%rowtype;
  v_month_limit integer;
  v_day_limit integer;
  v_effective_day_limit integer;
  v_month_used integer;
  v_day_used integer;
  v_last_sent timestamptz;
  v_min_gap interval;
  v_unlimited boolean;
begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required'; end if;

  select i.* into v_instance
  from public.ig_instancias i
  join public.instagram_automation_accounts a on a.instance_id = i.id
  where i.id = p_instance_id and a.enabled = true and a.lease_owner = p_worker_id
    and a.lease_until >= now()
  for update of i;
  if v_instance.id is null then return null; end if;

  perform pg_advisory_xact_lock(hashtextextended(
    'instagram_automation_limit:' || v_instance.org_id::text, 0
  ));
  v_unlimited := public.org_dono_eh_super_admin(v_instance.org_id);

  select p.limite_flow_business_dms_mes, p.limite_flow_business_dms_dia
  into v_month_limit, v_day_limit
  from public.orgs o join public.planos p on p.id = o.plano_id
  where o.id = v_instance.org_id;

  v_effective_day_limit := least(coalesce(v_day_limit, 0), case
    when v_instance.connected_at is null or v_instance.connected_at > now() - interval '3 days' then 3
    when v_instance.connected_at > now() - interval '7 days' then 5
    when v_instance.connected_at > now() - interval '21 days' then 10
    else coalesce(v_day_limit, 0)
  end);

  select count(*) filter (where sent_at >= date_trunc('month', now())),
    count(*) filter (where sent_at >= date_trunc('day', now()))
  into v_month_used, v_day_used
  from public.instagram_automation_jobs
  where org_id = v_instance.org_id and status = 'completed' and sent_at is not null;

  if not v_unlimited and (
    coalesce(v_month_limit, 0) <= v_month_used
    or coalesce(v_effective_day_limit, 0) <= v_day_used
  ) then
    update public.instagram_automation_accounts
    set paused_reason = case
          when coalesce(v_month_limit, 0) <= v_month_used then 'monthly_limit'
          else 'daily_limit'
        end,
        next_poll_at = case
          when coalesce(v_month_limit, 0) <= v_month_used
            then date_trunc('month', now()) + interval '1 month'
          else date_trunc('day', now()) + interval '1 day'
        end,
        updated_at = now()
    where instance_id = p_instance_id;
    return null;
  end if;

  select max(sent_at) into v_last_sent
  from public.instagram_automation_jobs
  where instance_id = p_instance_id and status = 'completed' and sent_at is not null;
  v_min_gap := case
    when v_instance.connected_at is null
      or v_instance.connected_at > now() - interval '7 days' then interval '30 minutes'
    else interval '10 minutes'
  end;
  if v_last_sent is not null and v_last_sent + v_min_gap > now() then
    update public.instagram_automation_accounts
    set next_poll_at = greatest(next_poll_at, v_last_sent + v_min_gap), updated_at = now()
    where instance_id = p_instance_id;
    return null;
  end if;

  select * into v_job
  from public.instagram_automation_jobs
  where instance_id = p_instance_id and status = 'queued' and available_at <= now()
  order by created_at
  for update skip locked
  limit 1;
  if v_job.id is null then return null; end if;

  update public.instagram_automation_jobs
  set status = 'processing', attempts = attempts + 1,
      locked_at = now(), locked_by = trim(p_worker_id), updated_at = now()
  where id = v_job.id;
  update public.instagram_automation_accounts
  set paused_reason = null, updated_at = now()
  where instance_id = p_instance_id
    and paused_reason in ('daily_limit','monthly_limit');
  update public.instagram_flow_runs set status = 'running', updated_at = now()
  where id = v_job.flow_run_id;

  return jsonb_build_object(
    'id', v_job.id,
    'instanceId', v_job.instance_id,
    'flowId', v_job.flow_id,
    'eventId', v_job.event_id,
    'payload', v_job.payload
  );
end;
$$;

create or replace function public.flow_business_automation_snapshot()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_org uuid := public.org_do_usuario(auth.uid());
  v_unlimited boolean;
begin
  if auth.uid() is null or v_org is null then raise exception 'forbidden'; end if;
  v_unlimited := public.org_dono_eh_super_admin(v_org);

  return jsonb_build_object(
    'limits', (
      select jsonb_build_object(
        'monthly', case when v_unlimited then null else p.limite_flow_business_dms_mes end,
        'daily', case when v_unlimited then null else p.limite_flow_business_dms_dia end,
        'monitorMinutes', p.intervalo_flow_business_monitor_minutos
      ) from public.orgs o join public.planos p on p.id = o.plano_id where o.id = v_org
    ),
    'usage', jsonb_build_object(
      'monthly', (select count(*) from public.instagram_automation_jobs
        where org_id = v_org and status = 'completed'
          and sent_at >= date_trunc('month', now())),
      'daily', (select count(*) from public.instagram_automation_jobs
        where org_id = v_org and status = 'completed'
          and sent_at >= date_trunc('day', now())),
      'queued', (select count(*) from public.instagram_automation_jobs
        where org_id = v_org and status = 'queued')
    ),
    'accounts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'instanceId', a.instance_id, 'enabled', a.enabled,
        'lastPolledAt', a.last_polled_at, 'lastSuccessAt', a.last_success_at,
        'nextPollAt', a.next_poll_at, 'consecutiveFailures', a.consecutive_failures,
        'pausedReason', a.paused_reason
      ) order by i.criada_em desc)
      from public.instagram_automation_accounts a
      join public.ig_instancias i on i.id = a.instance_id
      where a.org_id = v_org
    ), '[]'::jsonb),
    'recentEvents', coalesce((
      select jsonb_agg(row_data order by row_data->>'createdAt' desc)
      from (
        select jsonb_build_object(
          'id', e.id, 'username', e.commenter_username, 'commentText', e.comment_text,
          'matchedKeyword', e.matched_keyword, 'status', e.status,
          'errorCode', e.error_code, 'createdAt', e.created_at
        ) row_data
        from public.instagram_automation_events e
        where e.org_id = v_org order by e.created_at desc limit 30
      ) recent
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.flow_business_publish_flow(p_flow_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_flow public.instagram_flows%rowtype;
  v_actions integer;
  v_has_outbound boolean;
  v_has_unsupported boolean;
begin
  select * into v_flow from public.instagram_flows where id = p_flow_id for update;
  if v_flow.id is null or (auth.role() <> 'service_role' and not public.eh_super_admin()
    and not public.pertence_a_org(v_flow.org_id)) then raise exception 'forbidden'; end if;
  if not public.org_dono_eh_super_admin(v_flow.org_id) and not exists (
    select 1 from public.orgs o join public.planos p on p.id = o.plano_id
    where o.id = v_flow.org_id and p.limite_flow_business_fluxos > 0
      and p.limite_flow_business_dms_mes > 0
  ) then raise exception 'flow_not_available_on_plan'; end if;
  select count(*) into v_actions from public.instagram_flow_nodes
  where flow_id = p_flow_id and node_type <> 'trigger';
  if v_actions < 1 then raise exception 'flow_without_actions'; end if;
  select exists(select 1 from public.instagram_flow_nodes where flow_id = p_flow_id
    and node_type <> 'trigger' and subtype not in (
      'send_message','add_tag','move_crm','create_task'
    )) into v_has_unsupported;
  if v_has_unsupported then raise exception 'flow_contains_unavailable_action'; end if;
  if v_flow.account_id is null or not exists (
    select 1 from public.ig_instancias where id = v_flow.account_id
      and org_id = v_flow.org_id and provider = 'session_worker' and status = 'conectado'
  ) then raise exception 'connected_account_required'; end if;

  select exists(select 1 from public.instagram_flow_nodes where flow_id = p_flow_id
    and subtype = 'send_message') into v_has_outbound;
  if v_has_outbound and v_flow.trigger_type <> 'comment_keyword' then
    raise exception 'comment_trigger_required';
  end if;
  if v_flow.trigger_type <> 'comment_keyword' then raise exception 'trigger_not_available'; end if;
  if (select count(*) from public.instagram_flow_nodes
      where flow_id = p_flow_id and subtype = 'send_message') <> 1 then
    raise exception 'comment_flow_requires_one_message';
  end if;
  if nullif(trim(v_flow.trigger_config->>'keyword'), '') is null then
    raise exception 'comment_keyword_required';
  end if;
  if exists (
    select 1 from public.instagram_flow_nodes where flow_id = p_flow_id
      and subtype = 'send_message' and nullif(trim(config->>'text'), '') is null
  ) then raise exception 'flow_message_empty'; end if;

  update public.instagram_flows
  set status = 'active', published_at = now(), updated_at = now()
  where id = p_flow_id;
end;
$$;

create or replace function public.flow_business_sync_instagram_profile_to_crm()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer;
  v_used integer;
  v_assigned_to uuid;
  v_unlimited boolean := public.org_dono_eh_super_admin(new.org_id);
begin
  perform pg_advisory_xact_lock(hashtextextended('flow_business_crm:' || new.org_id::text, 0));
  select p.limite_flow_business_crm into v_limit
  from public.orgs o join public.planos p on p.id = o.plano_id where o.id = new.org_id;
  select count(*) into v_used from public.instagram_crm_cards where org_id = new.org_id;
  if not v_unlimited and (v_limit is null or v_used >= v_limit) then return new; end if;

  select assigned_to into v_assigned_to from public.leads where id = new.lead_id;
  insert into public.instagram_crm_cards(
    org_id, lead_id, assigned_to, source, temperature, created_at, updated_at
  ) values (
    new.org_id, new.lead_id, v_assigned_to, coalesce(new.discovery_source, 'instagram'),
    case when coalesce(new.lead_score, 0) >= 75 then 'quente'
      when coalesce(new.lead_score, 0) >= 45 then 'morno' else 'frio' end,
    coalesce(new.collected_at, now()), now()
  ) on conflict (org_id, lead_id) do nothing;
  return new;
end;
$$;

create or replace function public.flow_business_plan_snapshot(p_org uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.role() = 'service_role' or public.eh_super_admin() or public.pertence_a_org(p_org)
    then jsonb_build_object(
      'limits', jsonb_build_object(
        'accounts', case when public.org_dono_eh_super_admin(p_org) then null else p.limite_flow_business_contas end,
        'crmContacts', case when public.org_dono_eh_super_admin(p_org) then null else p.limite_flow_business_crm end,
        'cadences', case when public.org_dono_eh_super_admin(p_org) then null else p.limite_flow_business_cadencias end,
        'flows', case when public.org_dono_eh_super_admin(p_org) then null else p.limite_flow_business_fluxos end
      ),
      'used', jsonb_build_object(
        'accounts', (select count(*) from public.ig_instancias where org_id = p_org),
        'crmContacts', (select count(*) from public.instagram_crm_cards where org_id = p_org),
        'cadences', (select count(*) from public.instagram_cadences where org_id = p_org),
        'flows', (select count(*) from public.instagram_flows where org_id = p_org)
      ),
      'features', jsonb_build_object(
        'officialAccounts', public.org_dono_eh_super_admin(p_org) or p.limite_flow_business_contas > 0,
        'automations', public.org_dono_eh_super_admin(p_org) or p.limite_flow_business_fluxos > 0,
        'teamAssignment', public.org_dono_eh_super_admin(p_org) or p.instagram_nivel in ('pro','agencia')
      )
    )
    else null
  end
  from public.orgs o
  join public.planos p on p.id = o.plano_id
  where o.id = p_org
$$;

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
  v_unlimited boolean := public.org_dono_eh_super_admin(p_org);
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
    'unlimited', v_unlimited,
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
      'audience', v_unlimited or v_plan.limite_instagram_audiencia > 0,
      'overlap', v_unlimited or v_plan.limite_instagram_cruzamentos > 0,
      'reports', v_unlimited or v_plan.instagram_nivel in ('pro', 'agencia'),
      'multiBrand', v_unlimited or v_plan.limite_instagram_marcas > 1
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
  v_unlimited boolean := public.org_dono_eh_super_admin(p_org);
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.eh_super_admin() then
    raise exception 'forbidden';
  end if;
  if coalesce(trim(p_request_id), '') = '' then raise exception 'request_id_required'; end if;
  if coalesce(trim(p_action), '') = '' then raise exception 'action_required'; end if;
  if p_user is null or not exists (
    select 1 from public.memberships where org_id = p_org and user_id = p_user
  ) then raise exception 'membership_required'; end if;

  select * into v_existing from public.instagram_usage_reservations
  where org_id = p_org and request_id = p_request_id;
  if v_existing.id is not null then
    if v_existing.user_id is distinct from p_user or v_existing.action is distinct from p_action then
      return jsonb_build_object('ok', false, 'reason', 'request_id_conflict');
    end if;
    if v_existing.status <> 'reserved' then
      return jsonb_build_object('ok', false, 'reason', 'request_already_finalized');
    end if;
    return jsonb_build_object('ok', true, 'idempotent', true,
      'reservationId', v_existing.id, 'status', public.instagram_plan_status(p_org));
  end if;

  select p.* into v_plan from public.planos p
  join public.orgs o on o.plano_id = p.id where o.id = p_org;
  if v_plan.id is null or (not v_unlimited and not coalesce(v_plan.has_instagram_search, false)) then
    return jsonb_build_object('ok', false, 'reason', 'feature_not_in_plan');
  end if;
  insert into public.instagram_plan_usage(org_id, month_ref) values (p_org, v_month)
  on conflict (org_id, month_ref) do nothing;
  select * into v_usage from public.instagram_plan_usage
  where org_id = p_org and month_ref = v_month for update;

  if not v_unlimited then
    if v_usage.leads + greatest(p_leads, 0) > v_plan.limite_instagram_leads then return jsonb_build_object('ok', false, 'reason', 'leads_limit', 'status', public.instagram_plan_status(p_org)); end if;
    if v_usage.audience_profiles + greatest(p_audience_profiles, 0) > v_plan.limite_instagram_audiencia then return jsonb_build_object('ok', false, 'reason', 'audience_limit', 'status', public.instagram_plan_status(p_org)); end if;
    if v_usage.competitors + greatest(p_competitors, 0) > v_plan.limite_instagram_concorrentes then return jsonb_build_object('ok', false, 'reason', 'competitors_limit', 'status', public.instagram_plan_status(p_org)); end if;
    if v_usage.hunts + greatest(p_hunts, 0) > v_plan.limite_instagram_cacadas then return jsonb_build_object('ok', false, 'reason', 'hunts_limit', 'status', public.instagram_plan_status(p_org)); end if;
    if v_usage.overlap_runs + greatest(p_overlaps, 0) > v_plan.limite_instagram_cruzamentos then return jsonb_build_object('ok', false, 'reason', 'overlap_not_in_plan', 'status', public.instagram_plan_status(p_org)); end if;
    if v_usage.enrichments + greatest(p_enrichments, 0) > v_plan.limite_instagram_enriquecimentos then return jsonb_build_object('ok', false, 'reason', 'enrichments_limit', 'status', public.instagram_plan_status(p_org)); end if;
    if v_usage.brands + greatest(p_brands, 0) > v_plan.limite_instagram_marcas then return jsonb_build_object('ok', false, 'reason', 'brands_limit', 'status', public.instagram_plan_status(p_org)); end if;
    if v_usage.cost_usd + greatest(p_cost_usd, 0) > v_plan.teto_instagram_usd then return jsonb_build_object('ok', false, 'reason', 'cost_limit', 'status', public.instagram_plan_status(p_org)); end if;
  end if;

  v_reserved := jsonb_build_object(
    'leads', greatest(p_leads, 0), 'audienceProfiles', greatest(p_audience_profiles, 0),
    'competitors', greatest(p_competitors, 0), 'hunts', greatest(p_hunts, 0),
    'overlaps', greatest(p_overlaps, 0), 'enrichments', greatest(p_enrichments, 0),
    'brands', greatest(p_brands, 0), 'monthlyCostUsd', greatest(p_cost_usd, 0)
  );
  update public.instagram_plan_usage set
    leads = leads + greatest(p_leads, 0),
    audience_profiles = audience_profiles + greatest(p_audience_profiles, 0),
    competitors = competitors + greatest(p_competitors, 0),
    hunts = hunts + greatest(p_hunts, 0),
    overlap_runs = overlap_runs + greatest(p_overlaps, 0),
    enrichments = enrichments + greatest(p_enrichments, 0),
    brands = brands + greatest(p_brands, 0),
    cost_usd = cost_usd + greatest(p_cost_usd, 0), updated_at = now()
  where org_id = p_org and month_ref = v_month;
  insert into public.instagram_usage_reservations(org_id, user_id, request_id, action, month_ref, reserved)
  values (p_org, p_user, p_request_id, p_action, v_month, v_reserved)
  returning * into v_existing;
  return jsonb_build_object('ok', true, 'idempotent', false,
    'reservationId', v_existing.id, 'status', public.instagram_plan_status(p_org));
end;
$$;

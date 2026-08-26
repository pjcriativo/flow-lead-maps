-- Flow Business: execucao segura de automacoes via conector de sessao.
-- Nenhum fluxo e executado sem publicacao explicita e monitoramento habilitado pela organizacao.

alter table public.planos
  add column if not exists limite_flow_business_dms_mes integer not null default 0,
  add column if not exists limite_flow_business_dms_dia integer not null default 0,
  add column if not exists intervalo_flow_business_monitor_minutos integer not null default 15;

update public.planos
set limite_flow_business_dms_mes = case
      when instagram_nivel = 'agencia' then 1000
      when instagram_nivel = 'pro' then 250
      else 0
    end,
    limite_flow_business_dms_dia = case
      when instagram_nivel = 'agencia' then 40
      when instagram_nivel = 'pro' then 15
      else 0
    end,
    intervalo_flow_business_monitor_minutos = case
      when instagram_nivel = 'agencia' then 5
      when instagram_nivel = 'pro' then 10
      else 60
    end;

alter table public.planos
  drop constraint if exists planos_flow_business_dms_mes_nonnegative,
  add constraint planos_flow_business_dms_mes_nonnegative
    check (limite_flow_business_dms_mes >= 0),
  drop constraint if exists planos_flow_business_dms_dia_nonnegative,
  add constraint planos_flow_business_dms_dia_nonnegative
    check (limite_flow_business_dms_dia >= 0),
  drop constraint if exists planos_flow_business_monitor_interval_check,
  add constraint planos_flow_business_monitor_interval_check
    check (intervalo_flow_business_monitor_minutos between 2 and 1440);

create table if not exists public.instagram_automation_accounts (
  instance_id uuid primary key references public.ig_instancias(id) on delete cascade,
  org_id uuid not null references public.orgs(id) on delete cascade,
  enabled boolean not null default false,
  last_polled_at timestamptz,
  last_success_at timestamptz,
  next_poll_at timestamptz not null default now(),
  consecutive_failures integer not null default 0 check (consecutive_failures >= 0),
  paused_reason text,
  lease_owner text,
  lease_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, instance_id),
  foreign key (org_id, instance_id)
    references public.ig_instancias(org_id, id) on delete cascade
);

create index if not exists instagram_automation_accounts_due_idx
  on public.instagram_automation_accounts(enabled, next_poll_at)
  where enabled = true;

create table if not exists public.instagram_automation_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  instance_id uuid not null references public.ig_instancias(id) on delete cascade,
  flow_id uuid references public.instagram_flows(id) on delete set null,
  conversation_id uuid references public.ig_conversas(id) on delete set null,
  card_id uuid references public.instagram_crm_cards(id) on delete set null,
  external_media_id text not null,
  external_comment_id text not null,
  external_commenter_id text not null,
  commenter_username text not null,
  commenter_name text,
  comment_text text not null,
  matched_keyword text,
  status text not null default 'received' check (status in (
    'received','unmatched','queued','processed','failed','skipped'
  )),
  error_code text,
  occurred_at timestamptz not null,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (instance_id, external_comment_id),
  foreign key (org_id, instance_id)
    references public.ig_instancias(org_id, id) on delete cascade
);

create index if not exists instagram_automation_events_org_created_idx
  on public.instagram_automation_events(org_id, created_at desc);
create index if not exists instagram_automation_events_flow_status_idx
  on public.instagram_automation_events(flow_id, status, created_at desc);

create table if not exists public.instagram_automation_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  instance_id uuid not null references public.ig_instancias(id) on delete cascade,
  flow_id uuid not null references public.instagram_flows(id) on delete cascade,
  flow_run_id uuid not null references public.instagram_flow_runs(id) on delete cascade,
  event_id uuid not null references public.instagram_automation_events(id) on delete cascade,
  conversation_id uuid references public.ig_conversas(id) on delete set null,
  card_id uuid references public.instagram_crm_cards(id) on delete set null,
  idempotency_key text not null unique,
  action_type text not null default 'send_dm' check (action_type = 'send_dm'),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in (
    'queued','processing','completed','failed','skipped','review'
  )),
  attempts integer not null default 0 check (attempts >= 0),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  external_result_id text,
  error_code text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id)
);

create index if not exists instagram_automation_jobs_claim_idx
  on public.instagram_automation_jobs(instance_id, status, available_at, created_at)
  where status = 'queued';
create index if not exists instagram_automation_jobs_org_created_idx
  on public.instagram_automation_jobs(org_id, created_at desc);

do $$
declare
  t text;
begin
  foreach t in array array[
    'instagram_automation_accounts','instagram_automation_events','instagram_automation_jobs'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format(
      'create policy %I on public.%I for select using (public.eh_super_admin() or public.pertence_a_org(org_id))',
      t || '_select', t
    );
    execute format('grant select on public.%I to authenticated', t);
    execute format('revoke insert, update, delete on public.%I from authenticated, anon', t);
  end loop;
end $$;

drop trigger if exists instagram_automation_accounts_touch_updated_at
  on public.instagram_automation_accounts;
create trigger instagram_automation_accounts_touch_updated_at
before update on public.instagram_automation_accounts
for each row execute function public.flow_business_touch_updated_at();

drop trigger if exists instagram_automation_jobs_touch_updated_at
  on public.instagram_automation_jobs;
create trigger instagram_automation_jobs_touch_updated_at
before update on public.instagram_automation_jobs
for each row execute function public.flow_business_touch_updated_at();

insert into public.instagram_automation_accounts(instance_id, org_id, enabled, next_poll_at)
select id, org_id, false, now()
from public.ig_instancias
where provider = 'session_worker'
on conflict (instance_id) do nothing;

create or replace function public.flow_business_normalize_match_text(p_value text)
returns text
language sql
immutable
set search_path = public
as $$
  select trim(regexp_replace(
    translate(
      lower(coalesce(p_value, '')),
      'áàâãäéèêëíìîïóòôõöúùûüç',
      'aaaaaeeeeiiiiooooouuuuc'
    ),
    '[^[:alnum:]_]+', ' ', 'g'
  ))
$$;

create or replace function public.flow_business_comment_matches_keyword(
  p_comment text,
  p_keyword text
) returns boolean
language sql
immutable
set search_path = public
as $$
  select length(public.flow_business_normalize_match_text(p_keyword)) > 0
    and (' ' || public.flow_business_normalize_match_text(p_comment) || ' ')
      like ('% ' || public.flow_business_normalize_match_text(p_keyword) || ' %')
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

  if p_enabled and coalesce(v_dms_month, 0) <= 0 then
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

create or replace function public.flow_business_claim_automation_accounts(
  p_worker_id text,
  p_limit integer default 2
) returns table(
  instance_id uuid,
  username text,
  since_at timestamptz,
  media_limit integer,
  comments_limit integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required'; end if;
  if nullif(trim(p_worker_id), '') is null then raise exception 'invalid_worker'; end if;

  -- Se o processo caiu depois do envio, nao existe prova segura para repetir.
  -- Esses jobs vao para revisao humana em vez de gerar Direct duplicado.
  update public.instagram_automation_jobs
  set status = 'review', error_code = 'delivery_unknown', updated_at = now()
  where status = 'processing' and locked_at < now() - interval '5 minutes';

  return query
  with candidates as (
    select a.instance_id, i.username_ig,
      coalesce(a.last_polled_at, now()) as previous_poll,
      p.intervalo_flow_business_monitor_minutos as interval_minutes,
      case when p.instagram_nivel = 'agencia' then 8 else 4 end as selected_media_limit,
      case when p.instagram_nivel = 'agencia' then 30 else 15 end as selected_comments_limit
    from public.instagram_automation_accounts a
    join public.ig_instancias i on i.id = a.instance_id and i.org_id = a.org_id
    join public.orgs o on o.id = a.org_id
    join public.planos p on p.id = o.plano_id
    where a.enabled = true
      and i.provider = 'session_worker'
      and i.status = 'conectado'
      and a.next_poll_at <= now()
      and (a.lease_until is null or a.lease_until < now())
      and exists (
        select 1 from public.instagram_flows f
        where f.account_id = a.instance_id and f.org_id = a.org_id
          and f.status = 'active' and f.trigger_type = 'comment_keyword'
      )
    order by a.next_poll_at, a.instance_id
    for update of a skip locked
    limit least(greatest(coalesce(p_limit, 2), 1), 5)
  ), claimed as (
    update public.instagram_automation_accounts a
    set lease_owner = trim(p_worker_id),
        lease_until = now() + interval '90 seconds',
        last_polled_at = now(),
        next_poll_at = now() + make_interval(mins => candidates.interval_minutes),
        updated_at = now()
    from candidates
    where a.instance_id = candidates.instance_id
    returning a.instance_id, candidates.username_ig, candidates.previous_poll,
      candidates.selected_media_limit, candidates.selected_comments_limit
  )
  select claimed.instance_id, claimed.username_ig, claimed.previous_poll,
    claimed.selected_media_limit, claimed.selected_comments_limit
  from claimed;
end;
$$;

create or replace function public.flow_business_finish_automation_account(
  p_instance_id uuid,
  p_worker_id text,
  p_success boolean,
  p_error_code text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_failures integer;
  v_pause boolean;
begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required'; end if;

  select consecutive_failures + case when p_success then 0 else 1 end
  into v_failures
  from public.instagram_automation_accounts
  where instance_id = p_instance_id and lease_owner = p_worker_id
  for update;

  if v_failures is null then return; end if;
  v_pause := not p_success and (
    coalesce(p_error_code, '') in (
      'challenge_required','login_required','feedback_required','rate_limited'
    ) or v_failures >= 3
  );

  update public.instagram_automation_accounts
  set lease_owner = null,
      lease_until = null,
      last_success_at = case when p_success then now() else last_success_at end,
      consecutive_failures = case when p_success then 0 else v_failures end,
      enabled = case when v_pause then false else enabled end,
      paused_reason = case when v_pause then coalesce(p_error_code, 'repeated_failures')
        when p_success and paused_reason in ('daily_limit','monthly_limit') then paused_reason
        when p_success then null else paused_reason end,
      updated_at = now()
  where instance_id = p_instance_id;

  update public.ig_instancias
  set status = case
        when v_pause and p_error_code in ('challenge_required','login_required') then 'erro'
        else status
      end,
      error_message = case when p_success then null else p_error_code end,
      atualizado_em = now()
  where id = p_instance_id;
end;
$$;

create or replace function public.flow_business_record_session_comment(
  p_instance_id uuid,
  p_external_media_id text,
  p_external_comment_id text,
  p_external_commenter_id text,
  p_commenter_username text,
  p_commenter_name text,
  p_comment_text text,
  p_occurred_at timestamptz,
  p_raw_payload jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_instance public.ig_instancias%rowtype;
  v_flow public.instagram_flows%rowtype;
  v_event_id uuid;
  v_user_id uuid;
  v_lead_id uuid;
  v_card_id uuid;
  v_conversation_id uuid;
  v_run_id uuid;
  v_job_id uuid;
  v_keyword text;
  v_message text;
  v_username text := lower(trim(leading '@' from coalesce(p_commenter_username, '')));
begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required'; end if;
  if nullif(trim(p_external_media_id), '') is null
    or nullif(trim(p_external_comment_id), '') is null
    or nullif(trim(p_external_commenter_id), '') is null
    or nullif(v_username, '') is null
    or nullif(trim(p_comment_text), '') is null
  then raise exception 'invalid_comment_event'; end if;

  select i.* into v_instance
  from public.ig_instancias i
  join public.instagram_automation_accounts a on a.instance_id = i.id
  where i.id = p_instance_id and i.provider = 'session_worker'
    and i.status = 'conectado' and a.enabled = true
  for update of i;
  if v_instance.id is null then
    return jsonb_build_object('accepted', false, 'reason', 'account_not_enabled');
  end if;

  insert into public.instagram_automation_events(
    org_id, instance_id, external_media_id, external_comment_id,
    external_commenter_id, commenter_username, commenter_name,
    comment_text, occurred_at, raw_payload
  ) values (
    v_instance.org_id, v_instance.id, trim(p_external_media_id),
    trim(p_external_comment_id), trim(p_external_commenter_id), v_username,
    nullif(trim(p_commenter_name), ''), trim(p_comment_text),
    coalesce(p_occurred_at, now()), coalesce(p_raw_payload, '{}'::jsonb)
  ) on conflict (instance_id, external_comment_id) do nothing
  returning id into v_event_id;

  if v_event_id is null then
    return jsonb_build_object('accepted', true, 'duplicate', true);
  end if;

  select f.* into v_flow
  from public.instagram_flows f
  where f.org_id = v_instance.org_id
    and f.account_id = v_instance.id
    and f.status = 'active'
    and f.trigger_type = 'comment_keyword'
    and public.flow_business_comment_matches_keyword(
      p_comment_text, f.trigger_config->>'keyword'
    )
  order by length(f.trigger_config->>'keyword') desc, f.updated_at desc
  limit 1;
  v_keyword := v_flow.trigger_config->>'keyword';

  if v_flow.id is null then
    update public.instagram_automation_events set status = 'unmatched', processed_at = now()
    where id = v_event_id;
    return jsonb_build_object('accepted', true, 'duplicate', false, 'matched', false);
  end if;

  select n.config->>'text' into v_message
  from public.instagram_flow_nodes n
  where n.flow_id = v_flow.id and n.subtype = 'send_message'
  order by n.position_y, n.position_x
  limit 1;
  if nullif(trim(v_message), '') is null then
    update public.instagram_automation_events
    set status = 'failed', error_code = 'flow_message_empty', processed_at = now()
    where id = v_event_id;
    return jsonb_build_object('accepted', true, 'duplicate', false,
      'matched', true, 'queued', false, 'reason', 'flow_message_empty');
  end if;

  perform pg_advisory_xact_lock(hashtextextended(
    'instagram_commenter:' || v_instance.org_id::text || ':' || v_username, 0
  ));
  select lead_id into v_lead_id
  from public.instagram_profiles
  where org_id = v_instance.org_id and username = v_username;

  if v_lead_id is null then
    v_user_id := v_instance.connected_by;
    if v_user_id is null then
      select user_id into v_user_id from public.memberships
      where org_id = v_instance.org_id order by criada_em limit 1;
    end if;
    if v_user_id is null then raise exception 'account_owner_not_found'; end if;

    insert into public.leads(
      user_id, business_name, category, instagram_url, score_breakdown
    ) values (
      v_user_id, coalesce(nullif(trim(p_commenter_name), ''), '@' || v_username),
      'Instagram', 'https://www.instagram.com/' || v_username || '/',
      jsonb_build_object('source', 'instagram_comment_automation')
    ) returning id into v_lead_id;

    insert into public.instagram_profiles(
      lead_id, org_id, user_id, username, instagram_user_id,
      full_name, collected_at, updated_at, raw_payload
    ) values (
      v_lead_id, v_instance.org_id, v_user_id, v_username,
      trim(p_external_commenter_id), nullif(trim(p_commenter_name), ''),
      now(), now(), coalesce(p_raw_payload, '{}'::jsonb)
    );
  end if;

  insert into public.instagram_crm_cards(org_id, lead_id, source, temperature)
  values (v_instance.org_id, v_lead_id, 'instagram_comment', 'quente')
  on conflict (org_id, lead_id) do update set
    temperature = case when instagram_crm_cards.temperature = 'frio' then 'morno'
      else instagram_crm_cards.temperature end,
    updated_at = now()
  returning id into v_card_id;

  insert into public.ig_conversas(
    org_id, instancia_id, lead_id, external_contact_id, external_contact_name,
    source, last_message_text, last_message_at, last_inbound_at,
    messaging_window_expires_at, unread_count, atualizado_em
  ) values (
    v_instance.org_id, v_instance.id, v_lead_id, trim(p_external_commenter_id),
    coalesce(nullif(trim(p_commenter_name), ''), '@' || v_username),
    'comment', trim(p_comment_text), coalesce(p_occurred_at, now()),
    coalesce(p_occurred_at, now()), coalesce(p_occurred_at, now()) + interval '24 hours',
    1, now()
  ) on conflict (instancia_id, external_contact_id) do update set
    lead_id = coalesce(ig_conversas.lead_id, excluded.lead_id),
    external_contact_name = excluded.external_contact_name,
    source = 'comment',
    last_message_text = excluded.last_message_text,
    last_message_at = excluded.last_message_at,
    last_inbound_at = excluded.last_inbound_at,
    messaging_window_expires_at = excluded.messaging_window_expires_at,
    unread_count = ig_conversas.unread_count + 1,
    atualizado_em = now()
  returning id into v_conversation_id;

  insert into public.ig_mensagens(
    org_id, conversa_id, external_message_id, direction, message_type,
    text, timestamp, metadata, delivery_status
  ) values (
    v_instance.org_id, v_conversation_id,
    'comment:' || v_instance.id::text || ':' || trim(p_external_comment_id),
    'inbound', 'comment', trim(p_comment_text), coalesce(p_occurred_at, now()),
    jsonb_build_object('mediaId', trim(p_external_media_id),
      'commenterUsername', v_username), 'received'
  ) on conflict (external_message_id) do nothing;

  insert into public.instagram_flow_runs(
    org_id, flow_id, conversation_id, card_id, status, context
  ) values (
    v_instance.org_id, v_flow.id, v_conversation_id, v_card_id, 'waiting',
    jsonb_build_object('eventId', v_event_id, 'commentId', trim(p_external_comment_id),
      'commenterId', trim(p_external_commenter_id), 'commenterUsername', v_username)
  ) returning id into v_run_id;

  insert into public.instagram_automation_jobs(
    org_id, instance_id, flow_id, flow_run_id, event_id,
    conversation_id, card_id, idempotency_key, payload
  ) values (
    v_instance.org_id, v_instance.id, v_flow.id, v_run_id, v_event_id,
    v_conversation_id, v_card_id,
    'comment:' || v_instance.id::text || ':' || trim(p_external_comment_id),
    jsonb_build_object(
      'recipientId', trim(p_external_commenter_id),
      'recipientUsername', v_username,
      'recipientName', nullif(trim(p_commenter_name), ''),
      'message', trim(v_message),
      'renderedMessage', replace(replace(replace(
        trim(v_message),
        '{{nome}}', coalesce(nullif(trim(p_commenter_name), ''), '@' || v_username)
      ), '{{usuario}}', '@' || v_username), '{{cidade}}', ''),
      'commentId', trim(p_external_comment_id),
      'mediaId', trim(p_external_media_id)
    )
  ) returning id into v_job_id;

  update public.instagram_automation_events
  set flow_id = v_flow.id, conversation_id = v_conversation_id, card_id = v_card_id,
      matched_keyword = v_keyword, status = 'queued'
  where id = v_event_id;

  insert into public.instagram_crm_activities(
    org_id, card_id, activity_type, title, detail, metadata
  ) values (
    v_instance.org_id, v_card_id, 'webhook', 'Comentario identificado',
    trim(p_comment_text), jsonb_build_object('flowId', v_flow.id,
      'eventId', v_event_id, 'matchedKeyword', v_keyword)
  );

  return jsonb_build_object('accepted', true, 'duplicate', false,
    'matched', true, 'queued', true, 'eventId', v_event_id, 'jobId', v_job_id);
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
begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required'; end if;

  select i.* into v_instance
  from public.ig_instancias i
  join public.instagram_automation_accounts a on a.instance_id = i.id
  where i.id = p_instance_id and a.enabled = true and a.lease_owner = p_worker_id
    and a.lease_until >= now()
  for update of i;
  if v_instance.id is null then return null; end if;

  -- Serializa a reserva de limite da organizacao entre workers concorrentes.
  perform pg_advisory_xact_lock(hashtextextended(
    'instagram_automation_limit:' || v_instance.org_id::text, 0
  ));

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

  if coalesce(v_month_limit, 0) <= v_month_used
    or coalesce(v_effective_day_limit, 0) <= v_day_used then
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

create or replace function public.flow_business_finish_automation_job(
  p_job_id uuid,
  p_worker_id text,
  p_success boolean,
  p_external_result_id text default null,
  p_error_code text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.instagram_automation_jobs%rowtype;
  v_node public.instagram_flow_nodes%rowtype;
  v_stage text;
  v_risk_error boolean;
begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required'; end if;

  select * into v_job from public.instagram_automation_jobs
  where id = p_job_id for update;
  if v_job.id is null then raise exception 'automation_job_not_found'; end if;
  if v_job.status = 'completed' then return; end if;
  if v_job.status <> 'processing' or v_job.locked_by <> p_worker_id then
    raise exception 'automation_job_not_owned';
  end if;

  if not p_success then
    v_risk_error := coalesce(p_error_code, '') in (
      'challenge_required','login_required','feedback_required','rate_limited'
    );
    update public.instagram_automation_jobs
    set status = case when p_error_code = 'delivery_unknown' then 'review' else 'failed' end,
        error_code = coalesce(p_error_code, 'send_failed'), updated_at = now()
    where id = v_job.id;
    update public.instagram_automation_events
    set status = 'failed', error_code = coalesce(p_error_code, 'send_failed'),
        processed_at = now()
    where id = v_job.event_id;
    update public.instagram_flow_runs
    set status = 'failed', error_message = coalesce(p_error_code, 'send_failed'),
        completed_at = now(), updated_at = now()
    where id = v_job.flow_run_id;
    if v_risk_error then
      update public.instagram_automation_accounts
      set enabled = false, paused_reason = p_error_code, updated_at = now()
      where instance_id = v_job.instance_id;
    end if;
    return;
  end if;

  update public.instagram_automation_jobs
  set status = 'completed', external_result_id = nullif(trim(p_external_result_id), ''),
      sent_at = now(), error_code = null, updated_at = now()
  where id = v_job.id;

  insert into public.ig_mensagens(
    org_id, conversa_id, external_message_id, direction, message_type,
    text, timestamp, metadata, delivery_status
  ) values (
    v_job.org_id, v_job.conversation_id,
    'automation:' || v_job.id::text, 'outbound', 'text',
    v_job.payload->>'renderedMessage', now(),
    jsonb_build_object('flowId', v_job.flow_id, 'jobId', v_job.id), 'sent'
  ) on conflict (external_message_id) do nothing;

  update public.ig_conversas
  set last_message_text = v_job.payload->>'renderedMessage', last_message_at = now(),
      last_outbound_at = now(), atualizado_em = now()
  where id = v_job.conversation_id;

  if v_job.card_id is not null then
    update public.instagram_crm_cards
    set stage = case when stage in ('novo','analisando','aquecendo','pronto_abordar')
        then 'abordado' else stage end,
      temperature = 'quente', last_contact_at = now(), updated_at = now()
    where id = v_job.card_id and org_id = v_job.org_id;

    insert into public.instagram_crm_activities(
      org_id, card_id, activity_type, title, detail, metadata
    ) values (
      v_job.org_id, v_job.card_id, 'dm_sent', 'Direct enviado pela automacao',
      v_job.payload->>'renderedMessage',
      jsonb_build_object('flowId', v_job.flow_id, 'jobId', v_job.id)
    );

    for v_node in
      select * from public.instagram_flow_nodes
      where flow_id = v_job.flow_id and subtype <> 'send_message' and node_type <> 'trigger'
      order by position_y, position_x
    loop
      if v_node.subtype = 'add_tag' and nullif(trim(v_node.config->>'tag'), '') is not null then
        update public.instagram_crm_cards
        set tags = array(select distinct unnest(tags || array[trim(v_node.config->>'tag')])),
            updated_at = now()
        where id = v_job.card_id and org_id = v_job.org_id;
      elsif v_node.subtype = 'move_crm' then
        v_stage := v_node.config->>'stage';
        if v_stage in ('novo','analisando','aquecendo','pronto_abordar','abordado',
          'respondeu','qualificado','proposta','cliente','perdido') then
          update public.instagram_crm_cards set stage = v_stage, updated_at = now()
          where id = v_job.card_id and org_id = v_job.org_id;
        end if;
      elsif v_node.subtype = 'create_task' then
        insert into public.instagram_crm_tasks(
          org_id, card_id, action_type, title, instructions, due_at, assigned_to
        ) select v_job.org_id, v_job.card_id, 'follow_up', v_node.label,
          nullif(trim(v_node.config->>'instructions'), ''), now() + interval '1 day', assigned_to
        from public.instagram_crm_cards where id = v_job.card_id;
      end if;
    end loop;
  end if;

  update public.instagram_automation_events
  set status = 'processed', error_code = null, processed_at = now()
  where id = v_job.event_id;
  update public.instagram_flow_runs
  set status = 'completed', completed_at = now(), error_message = null, updated_at = now()
  where id = v_job.flow_run_id;
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
begin
  if auth.uid() is null or v_org is null then raise exception 'forbidden'; end if;

  return jsonb_build_object(
    'limits', (
      select jsonb_build_object(
        'monthly', p.limite_flow_business_dms_mes,
        'daily', p.limite_flow_business_dms_dia,
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

-- Permite publicar fluxos para o conector proprio; as demais validacoes permanecem no servidor.
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
  if not exists (
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
  if v_flow.trigger_type <> 'comment_keyword' then
    raise exception 'trigger_not_available';
  end if;
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

grant execute on function public.flow_business_set_session_automation(uuid, boolean)
  to authenticated, service_role;
grant execute on function public.flow_business_automation_snapshot()
  to authenticated, service_role;

revoke all on function public.flow_business_claim_automation_accounts(text, integer)
  from public, anon, authenticated;
revoke all on function public.flow_business_finish_automation_account(uuid, text, boolean, text)
  from public, anon, authenticated;
revoke all on function public.flow_business_record_session_comment(
  uuid, text, text, text, text, text, text, timestamptz, jsonb
) from public, anon, authenticated;
revoke all on function public.flow_business_claim_automation_job(uuid, text)
  from public, anon, authenticated;
revoke all on function public.flow_business_finish_automation_job(
  uuid, text, boolean, text, text
) from public, anon, authenticated;

grant execute on function public.flow_business_claim_automation_accounts(text, integer)
  to service_role;
grant execute on function public.flow_business_finish_automation_account(uuid, text, boolean, text)
  to service_role;
grant execute on function public.flow_business_record_session_comment(
  uuid, text, text, text, text, text, text, timestamptz, jsonb
) to service_role;
grant execute on function public.flow_business_claim_automation_job(uuid, text)
  to service_role;
grant execute on function public.flow_business_finish_automation_job(
  uuid, text, boolean, text, text
) to service_role;

comment on table public.instagram_automation_events is
  'Eventos de comentario idempotentes; um comentario por conta e processado uma unica vez.';
comment on table public.instagram_automation_jobs is
  'Fila duravel de Direct com preferencia por nao duplicar em falhas ambiguas.';

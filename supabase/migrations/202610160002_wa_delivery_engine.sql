-- Correcao 02: motor persistente de entregas WhatsApp.
-- Migration incremental e reversivel por restore; nao agenda cron, nao ativa campanhas e nao envia.
-- wa_envios continua sendo a fonte oficial, agora tambem como fila duravel.

begin;

create extension if not exists pgcrypto;

alter table public.leads
  add column if not exists whatsapp_opt_in boolean not null default false,
  add column if not exists whatsapp_opt_in_at timestamptz,
  add column if not exists whatsapp_consent_source text,
  add column if not exists whatsapp_consent_purpose text,
  add column if not exists whatsapp_opt_out boolean not null default false,
  add column if not exists whatsapp_opt_out_at timestamptz;

alter table public.campanhas
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists scheduled_at timestamptz,
  add column if not exists schedule_timezone text not null default 'America/Sao_Paulo',
  add column if not exists paused_at timestamptz,
  add column if not exists paused_by uuid references auth.users(id) on delete set null,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid references auth.users(id) on delete set null,
  add column if not exists cancellation_reason text,
  add column if not exists dispatch_enabled boolean not null default false,
  add column if not exists max_batch_size integer not null default 10,
  add column if not exists max_attempts integer not null default 3,
  add column if not exists failure_pause_threshold integer not null default 5,
  add column if not exists consecutive_failures integer not null default 0,
  add column if not exists auto_paused_reason text,
  add column if not exists send_window_start time not null default '08:00',
  add column if not exists send_window_end time not null default '20:00';

do $$
declare
  v_constraint record;
begin
  for v_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.campanhas'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ~* 'status'
  loop
    execute format('alter table public.campanhas drop constraint %I', v_constraint.conname);
  end loop;
end $$;

alter table public.campanhas
  add constraint campanhas_status_check check (
    status in ('rascunho','em_revisao','pendente_aprovacao','agendada','ativa','pausada','cancelada','concluida','falhou')
  ),
  add constraint campanhas_max_batch_check check (max_batch_size between 1 and 100),
  add constraint campanhas_max_attempts_check check (max_attempts between 1 and 10),
  add constraint campanhas_failure_pause_threshold_check check (failure_pause_threshold between 1 and 100),
  add constraint campanhas_send_window_check check (send_window_start < send_window_end);

alter table public.wa_envios
  alter column enviado_em drop not null,
  alter column enviado_em drop default,
  add column if not exists campanha_lead_id uuid references public.campanha_leads(id) on delete set null,
  add column if not exists recipient text,
  add column if not exists status text not null default 'accepted',
  add column if not exists stage text not null default 'initial',
  add column if not exists idempotency_key text,
  add column if not exists queue_created_at timestamptz not null default now(),
  add column if not exists scheduled_at timestamptz,
  add column if not exists reserved_at timestamptz,
  add column if not exists lease_expires_at timestamptz,
  add column if not exists worker_id text,
  add column if not exists processing_at timestamptz,
  add column if not exists provider_requested_at timestamptz,
  add column if not exists processed_at timestamptz,
  add column if not exists attempt_count integer not null default 0,
  add column if not exists provider_attempt_count integer not null default 0,
  add column if not exists max_attempts integer not null default 3,
  add column if not exists retryable boolean not null default false,
  add column if not exists next_attempt_at timestamptz,
  add column if not exists provider_message_id text,
  add column if not exists provider_response jsonb,
  add column if not exists last_error_code text,
  add column if not exists last_error text,
  add column if not exists consent_source text,
  add column if not exists consented_at timestamptz,
  add column if not exists communication_purpose text,
  add column if not exists accepted_at timestamptz,
  add column if not exists sent_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists read_at timestamptz,
  add column if not exists failed_at timestamptz,
  add column if not exists uncertain_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists blocked_reason text,
  add column if not exists updated_at timestamptz not null default now();

update public.wa_envios
set accepted_at = coalesce(accepted_at, enviado_em),
    processed_at = coalesce(processed_at, enviado_em),
    queue_created_at = coalesce(enviado_em, queue_created_at),
    recipient = coalesce(recipient, (select regexp_replace(coalesce(l.whatsapp, l.phone, ''), '\D', '', 'g') from public.leads l where l.id = wa_envios.lead_id)),
    idempotency_key = coalesce(idempotency_key, encode(extensions.digest(id::text, 'sha256'), 'hex')),
    updated_at = coalesce(updated_at, enviado_em, now())
where idempotency_key is null or accepted_at is null or recipient is null;

alter table public.wa_envios
  alter column idempotency_key set not null;

alter table public.wa_envios drop constraint if exists wa_envios_status_check;
alter table public.wa_envios add constraint wa_envios_status_check check (status in (
  'draft','pending_approval','scheduled','queued','processing','accepted','sent','delivered','read',
  'failed','uncertain','cancelled','blocked'
));
alter table public.wa_envios drop constraint if exists wa_envios_attempt_count_check;
alter table public.wa_envios add constraint wa_envios_attempt_count_check
  check (attempt_count >= 0 and provider_attempt_count >= 0 and max_attempts between 1 and 10);

create unique index if not exists wa_envios_org_idempotency_uidx
  on public.wa_envios(org_id, idempotency_key);
create unique index if not exists wa_envios_org_provider_message_uidx
  on public.wa_envios(org_id, provider_message_id)
  where provider_message_id is not null;
create index if not exists wa_envios_reservation_idx
  on public.wa_envios(status, scheduled_at, next_attempt_at, lease_expires_at)
  where status in ('scheduled','queued','processing','failed');
create index if not exists wa_envios_campaign_status_idx
  on public.wa_envios(org_id, campanha_id, status);

create unique index if not exists wa_instancias_id_org_uidx on public.wa_instancias(id, org_id);
create unique index if not exists wa_envios_id_org_uidx on public.wa_envios(id, org_id);
create table if not exists public.wa_envio_eventos (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  envio_id uuid not null references public.wa_envios(id) on delete cascade,
  instancia_id uuid not null references public.wa_instancias(id) on delete cascade,
  event_key text not null,
  provider_message_id text not null,
  event_type text not null,
  status text not null check (status in ('accepted','sent','delivered','read','failed')),
  occurred_at timestamptz,
  received_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  unique(org_id, event_key),
  foreign key(envio_id, org_id) references public.wa_envios(id, org_id) on delete cascade,
  foreign key(instancia_id, org_id) references public.wa_instancias(id, org_id) on delete cascade
);
create index if not exists wa_envio_eventos_envio_idx
  on public.wa_envio_eventos(envio_id, received_at desc);
alter table public.wa_envio_eventos enable row level security;
drop policy if exists org_wa_envio_eventos_select on public.wa_envio_eventos;
create policy org_wa_envio_eventos_select on public.wa_envio_eventos for select
  using (public.wa_role_allowed(org_id, array['admin','gerente','vendedor','sdr','suporte']));

create table if not exists public.wa_envio_tentativas (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  envio_id uuid not null,
  attempt_number integer not null check (attempt_number > 0),
  worker_id text not null,
  started_at timestamptz not null default now(),
  request_dispatched_at timestamptz,
  completed_at timestamptz,
  outcome text check (outcome in ('accepted','failed','uncertain','blocked','deferred')),
  retryable boolean not null default false,
  http_status integer,
  provider_message_id text,
  error_code text,
  error_message text,
  provider_response jsonb,
  unique(envio_id, attempt_number),
  foreign key(envio_id, org_id) references public.wa_envios(id, org_id) on delete cascade
);
create index if not exists wa_envio_tentativas_org_idx
  on public.wa_envio_tentativas(org_id, started_at desc);
alter table public.wa_envio_tentativas enable row level security;
drop policy if exists org_wa_envio_tentativas_select on public.wa_envio_tentativas;
create policy org_wa_envio_tentativas_select on public.wa_envio_tentativas for select
  using (public.wa_role_allowed(org_id, array['admin','gerente','vendedor','sdr','suporte']));

alter table public.wa_mensagens
  add column if not exists envio_id uuid,
  add column if not exists campanha_id uuid,
  add constraint wa_mensagens_envio_org_fk foreign key(envio_id, org_id)
    references public.wa_envios(id, org_id) on delete set null (envio_id),
  add constraint wa_mensagens_campanha_org_fk foreign key(campanha_id, org_id)
    references public.campanhas(id, org_id) on delete set null (campanha_id);
create index if not exists wa_mensagens_campanha_idx
  on public.wa_mensagens(org_id, campanha_id, criado_em desc)
  where direcao = 'in' and campanha_id is not null;

create or replace function public.wa_delivery_actor_allowed(p_org uuid, p_actor uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p where p.id = p_actor and p.is_super_admin = true
  ) or exists (
    select 1
    from public.memberships m
    left join public.org_papeis p on p.org_id = m.org_id and p.papel = m.papel
    where m.org_id = p_org
      and m.user_id = p_actor
      and m.papel::text in ('admin','gerente')
      and coalesce(p.ativo, true)
  )
$$;

revoke all on function public.wa_delivery_actor_allowed(uuid, uuid) from public, anon, authenticated;
grant execute on function public.wa_delivery_actor_allowed(uuid, uuid) to service_role;

create or replace function public.wa_create_campaign_draft(
  p_org uuid,
  p_actor uuid,
  p_list uuid,
  p_name text,
  p_message text,
  p_campaign_type text,
  p_scheduled_at timestamptz,
  p_timezone text
)
returns table(campaign_id uuid, created_at timestamptz, recipient_count bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign uuid;
  v_created timestamptz;
  v_count bigint;
begin
  if not public.wa_delivery_actor_allowed(p_org, p_actor) then
    raise exception 'not authorized' using errcode='42501';
  end if;
  if nullif(trim(p_name),'') is null or nullif(trim(p_message),'') is null then
    raise exception 'name and message are required' using errcode='22023';
  end if;
  if not exists(select 1 from public.lead_lists where id=p_list and org_id=p_org) then
    raise exception 'list not found' using errcode='P0002';
  end if;
  perform 1 from pg_timezone_names where name = p_timezone;
  if not found then raise exception 'invalid timezone' using errcode='22023'; end if;

  insert into public.campanhas(
    user_id,org_id,list_id,nome,canal,status,wa_config,dispatch_enabled,scheduled_at,schedule_timezone
  )
  values(p_actor,p_org,p_list,left(trim(p_name),160),'whatsapp','rascunho',
    jsonb_build_object('tipo',coalesce(nullif(trim(p_campaign_type),''),'prospeccao'),'mensagemPadrao',trim(p_message)),
    false,p_scheduled_at,p_timezone)
  returning id,criada_em into v_campaign,v_created;

  insert into public.campanha_leads(campanha_id,lead_id,user_id,org_id,estado)
  select v_campaign,l.id,p_actor,p_org,'pendente'
  from public.leads l where l.list_id=p_list and l.org_id=p_org
  on conflict(campanha_id,lead_id) do nothing;
  get diagnostics v_count = row_count;
  if v_count = 0 then raise exception 'list is empty' using errcode='22023'; end if;
  return query select v_campaign,v_created,v_count;
end
$$;

create or replace function public.wa_prepare_campaign(
  p_org uuid,
  p_campaign uuid,
  p_actor uuid,
  p_scheduled_at timestamptz,
  p_timezone text,
  p_purpose text
)
returns table(queued_count bigint, blocked_count bigint, duplicate_count bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign public.campanhas%rowtype;
  v_instance uuid;
  v_inserted bigint;
  v_candidates bigint;
  v_effective_schedule timestamptz;
begin
  if not public.wa_delivery_actor_allowed(p_org, p_actor) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if nullif(trim(p_purpose), '') is null then
    raise exception 'communication purpose is required' using errcode = '22023';
  end if;

  select * into v_campaign
  from public.campanhas
  where id = p_campaign and org_id = p_org and canal = 'whatsapp'
  for update;
  if not found then raise exception 'campaign not found' using errcode = 'P0002'; end if;
  if v_campaign.status in ('cancelada','concluida') then
    raise exception 'campaign cannot be prepared' using errcode = '23514';
  end if;
  v_effective_schedule := coalesce(p_scheduled_at, v_campaign.scheduled_at);

  perform 1 from pg_timezone_names where name = p_timezone;
  if not found then raise exception 'invalid timezone' using errcode = '22023'; end if;

  select i.id into v_instance
  from public.wa_instancias i
  where i.org_id = p_org
    and i.funcao = 'disparo'
    and i.status = 'conectado'
    and i.numero is not null
  order by i.ordem, i.criada_em
  limit 1;
  if v_instance is null then raise exception 'no connected dispatch instance' using errcode = '55000'; end if;

  update public.campanha_leads
  set estado = 'aprovado', atualizado_em = now()
  where campanha_id = p_campaign and org_id = p_org and estado = 'pendente';

  select count(*) into v_candidates
  from public.campanha_leads cl
  join public.leads l on l.id = cl.lead_id and l.org_id = cl.org_id
  where cl.campanha_id = p_campaign and cl.org_id = p_org and cl.estado = 'aprovado';

  with candidates as (
    select
      cl.id as campanha_lead_id,
      cl.lead_id,
      regexp_replace(coalesce(l.whatsapp, l.phone, ''), '\D', '', 'g') as recipient,
      l.business_name,
      l.whatsapp_opt_in,
      l.whatsapp_opt_in_at,
      l.whatsapp_consent_source,
      l.whatsapp_consent_purpose,
      l.whatsapp_opt_out,
      coalesce(v_campaign.wa_config->>'mensagemPadrao', v_campaign.wa_config#>>'{variacoes,0,texto}', '') as template
    from public.campanha_leads cl
    join public.leads l on l.id = cl.lead_id and l.org_id = cl.org_id
    where cl.campanha_id = p_campaign
      and cl.org_id = p_org
      and cl.estado = 'aprovado'
  ), prepared as (
    select *,
      case
        when whatsapp_opt_out then 'opt_out'
        when not whatsapp_opt_in or whatsapp_opt_in_at is null then 'consentimento_ausente'
        when nullif(trim(coalesce(whatsapp_consent_source, '')), '') is null then 'origem_consentimento_ausente'
        when nullif(trim(coalesce(whatsapp_consent_purpose, '')), '') is null then 'finalidade_consentimento_ausente'
        when length(recipient) not between 10 and 15 or recipient ~ '^0+$' then 'telefone_invalido'
        when nullif(trim(template), '') is null then 'mensagem_ausente'
        else null
      end as blocked_reason,
      trim(replace(replace(template, '{{nome}}', business_name), '{nome}', business_name)) as immutable_message
    from candidates
  ), inserted as (
    insert into public.wa_envios (
      user_id, org_id, lead_id, instancia_id, campanha_id, campanha_lead_id,
      variacao_id, mensagem, recipient, status, stage, idempotency_key,
      scheduled_at, max_attempts, consent_source, consented_at,
      communication_purpose, blocked_reason, updated_at
    )
    select
      p_actor, p_org, lead_id, v_instance, p_campaign, campanha_lead_id,
      'snapshot-v1', immutable_message, recipient,
      case when blocked_reason is not null then 'blocked'
           when v_effective_schedule is not null and v_effective_schedule > now() then 'scheduled'
           else 'queued' end,
      'initial',
      encode(digest(concat_ws('|', p_org::text, p_campaign::text, lead_id::text, recipient, 'initial', immutable_message), 'sha256'), 'hex'),
      coalesce(v_effective_schedule, now()), v_campaign.max_attempts,
      whatsapp_consent_source, whatsapp_opt_in_at, p_purpose, blocked_reason, now()
    from prepared
    on conflict (org_id, idempotency_key) do nothing
    returning status
  )
  select count(*) into v_inserted from inserted;

  update public.campanhas
  set approved_at = now(),
      approved_by = p_actor,
      scheduled_at = v_effective_schedule,
      schedule_timezone = p_timezone,
      status = case when v_effective_schedule is not null and v_effective_schedule > now() then 'agendada' else 'ativa' end,
      atualizado_em = now()
  where id = p_campaign and org_id = p_org;

  return query
  select
    count(*) filter (where e.status in ('queued','scheduled')),
    count(*) filter (where e.status = 'blocked'),
    greatest(v_candidates - v_inserted, 0)
  from public.wa_envios e
  where e.org_id = p_org and e.campanha_id = p_campaign;
end
$$;

create or replace function public.wa_control_campaign(
  p_org uuid,
  p_campaign uuid,
  p_actor uuid,
  p_action text,
  p_reason text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_scheduled_at timestamptz;
begin
  if not public.wa_delivery_actor_allowed(p_org, p_actor) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select status, scheduled_at into v_status, v_scheduled_at
  from public.campanhas
  where id = p_campaign and org_id = p_org and canal = 'whatsapp'
  for update;
  if not found then raise exception 'campaign not found' using errcode = 'P0002'; end if;

  if p_action = 'pause' then
    if v_status not in ('ativa','agendada') then raise exception 'campaign cannot be paused' using errcode = '23514'; end if;
    update public.campanhas set status='pausada', paused_at=now(), paused_by=p_actor,
      auto_paused_reason=null, atualizado_em=now()
      where id=p_campaign and org_id=p_org;
    return 'pausada';
  elsif p_action = 'resume' then
    if v_status <> 'pausada' then raise exception 'campaign is not paused' using errcode = '23514'; end if;
    update public.wa_envios e
    set status='blocked', blocked_reason='opt_out', retryable=false, updated_at=now()
    from public.leads l
    where e.org_id=p_org and e.campanha_id=p_campaign and e.lead_id=l.id
      and l.org_id=p_org and l.whatsapp_opt_out
      and e.status in ('queued','scheduled','failed');
    update public.campanhas
      set status=case when v_scheduled_at is not null and v_scheduled_at > now() then 'agendada' else 'ativa' end,
          paused_at=null, paused_by=null, auto_paused_reason=null, consecutive_failures=0, atualizado_em=now()
      where id=p_campaign and org_id=p_org;
    return case when v_scheduled_at is not null and v_scheduled_at > now() then 'agendada' else 'ativa' end;
  elsif p_action = 'cancel' then
    if v_status in ('cancelada','concluida') then raise exception 'campaign cannot be cancelled' using errcode = '23514'; end if;
    update public.wa_envios
      set status='cancelled', cancelled_at=now(), retryable=false, lease_expires_at=null,
          worker_id=null, updated_at=now()
      where org_id=p_org and campanha_id=p_campaign
        and status in ('draft','pending_approval','scheduled','queued','failed','blocked');
    update public.campanhas
      set status='cancelada', cancelled_at=now(), cancelled_by=p_actor,
          cancellation_reason=nullif(left(trim(coalesce(p_reason,'')),500),''), atualizado_em=now()
      where id=p_campaign and org_id=p_org;
    return 'cancelada';
  end if;
  raise exception 'invalid action' using errcode = '22023';
end
$$;

create or replace function public.wa_reschedule_campaign(
  p_org uuid,
  p_campaign uuid,
  p_actor uuid,
  p_scheduled_at timestamptz,
  p_timezone text
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_changed bigint;
begin
  if not public.wa_delivery_actor_allowed(p_org, p_actor) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  perform 1 from pg_timezone_names where name = p_timezone;
  if not found then raise exception 'invalid timezone' using errcode = '22023'; end if;
  if p_scheduled_at is null then raise exception 'schedule is required' using errcode = '22023'; end if;

  update public.campanhas
  set scheduled_at=p_scheduled_at, schedule_timezone=p_timezone,
      status=case when p_scheduled_at > now() then 'agendada' else 'ativa' end,
      atualizado_em=now()
  where id=p_campaign and org_id=p_org and canal='whatsapp'
    and status in ('ativa','agendada','pausada');
  if not found then raise exception 'campaign cannot be rescheduled' using errcode='23514'; end if;

  update public.wa_envios
  set scheduled_at=p_scheduled_at,
      status=case when p_scheduled_at > now() then 'scheduled' else 'queued' end,
      updated_at=now()
  where org_id=p_org and campanha_id=p_campaign and status in ('scheduled','queued','failed');
  get diagnostics v_changed = row_count;
  return v_changed;
end
$$;

create or replace function public.wa_reserve_delivery_batch(
  p_worker text,
  p_limit integer default 10,
  p_lease_seconds integer default 120
)
returns setof public.wa_envios
language plpgsql
security definer
set search_path = public
as $$
begin
  if nullif(trim(p_worker), '') is null then raise exception 'worker is required' using errcode='22023'; end if;

  update public.campanhas
  set status='ativa', atualizado_em=now()
  where canal='whatsapp' and status='agendada' and approved_at is not null
    and dispatch_enabled=true and scheduled_at <= now();

  update public.wa_envios e
  set status='blocked', retryable=false,
      blocked_reason=case
        when l.whatsapp_opt_out then 'opt_out'
        when not l.whatsapp_opt_in or l.whatsapp_opt_in_at is null then 'consentimento_ausente'
        when nullif(trim(coalesce(l.whatsapp_consent_source,'')),'') is null then 'origem_consentimento_ausente'
        when nullif(trim(coalesce(l.whatsapp_consent_purpose,'')),'') is null then 'finalidade_consentimento_ausente'
        else 'telefone_invalido' end,
      updated_at=now()
  from public.leads l
  where e.lead_id=l.id and e.org_id=l.org_id
    and e.status in ('queued','scheduled','failed')
    and (
      l.whatsapp_opt_out or not l.whatsapp_opt_in or l.whatsapp_opt_in_at is null
      or nullif(trim(coalesce(l.whatsapp_consent_source,'')),'') is null
      or nullif(trim(coalesce(l.whatsapp_consent_purpose,'')),'') is null
      or length(e.recipient) not between 10 and 15 or e.recipient ~ '^0+$'
    );

  update public.wa_envio_tentativas t
  set completed_at = now(),
      outcome = case when e.provider_requested_at is null then 'deferred' else 'uncertain' end,
      retryable = e.provider_requested_at is null,
      error_code = case when e.provider_requested_at is null then 'lease_expired_before_dispatch' else 'lease_expired_after_dispatch' end,
      error_message = case when e.provider_requested_at is null
        then 'Lease expirou antes do envio ao provedor.'
        else 'Resultado incerto apos expiracao do lease.' end
  from public.wa_envios e
  where t.envio_id = e.id and t.org_id = e.org_id and t.attempt_number = e.attempt_count
    and t.completed_at is null and e.status='processing' and e.lease_expires_at < now();

  update public.wa_envios
  set status = case when provider_requested_at is null then 'queued' else 'uncertain' end,
      uncertain_at = case when provider_requested_at is not null then now() else uncertain_at end,
      last_error_code = case when provider_requested_at is not null then 'lease_expired_after_dispatch' else last_error_code end,
      last_error = case when provider_requested_at is not null then 'Resultado incerto apos expiracao do lease.' else last_error end,
      worker_id = null, reserved_at = null, lease_expires_at = null, updated_at = now()
  where status='processing' and lease_expires_at < now();

  return query
  with eligible as materialized (
    select e.id,
      coalesce(e.next_attempt_at, e.scheduled_at) as due_at,
      c.max_batch_size,
      row_number() over (
        partition by e.campanha_id
        order by coalesce(e.next_attempt_at, e.scheduled_at), e.id
      ) as campaign_rank
    from public.wa_envios e
    join public.campanhas c on c.id=e.campanha_id and c.org_id=e.org_id
    join public.leads l on l.id=e.lead_id and l.org_id=e.org_id
    join public.wa_instancias i on i.id=e.instancia_id and i.org_id=e.org_id
    where e.status in ('queued','scheduled','failed')
      and (e.status <> 'failed' or (e.retryable and e.provider_attempt_count < e.max_attempts))
      and coalesce(e.next_attempt_at, e.scheduled_at, now()) <= now()
      and c.status='ativa'
      and c.approved_at is not null
      and c.dispatch_enabled = true
      and l.whatsapp_opt_in = true and l.whatsapp_opt_in_at is not null
      and nullif(trim(coalesce(l.whatsapp_consent_source,'')),'') is not null
      and nullif(trim(coalesce(l.whatsapp_consent_purpose,'')),'') is not null
      and l.whatsapp_opt_out = false
      and i.status='conectado' and i.funcao='disparo' and i.numero is not null
      and (now() at time zone c.schedule_timezone)::time between c.send_window_start and c.send_window_end
  ), claimable as (
    select e.id
    from public.wa_envios e
    join eligible q on q.id=e.id and q.campaign_rank <= q.max_batch_size
    order by q.due_at, e.id
    for update of e skip locked
    limit least(greatest(p_limit,1),100)
  ), reserved as (
    update public.wa_envios e
    set status='processing', worker_id=p_worker, reserved_at=now(), processing_at=now(),
        lease_expires_at=now() + make_interval(secs => least(greatest(p_lease_seconds,30),900)),
        attempt_count=e.attempt_count+1, provider_requested_at=null, updated_at=now()
    from claimable c
    where e.id=c.id
    returning e.*
  ), attempts as (
    insert into public.wa_envio_tentativas(org_id, envio_id, attempt_number, worker_id)
    select org_id, id, attempt_count, p_worker from reserved
    on conflict(envio_id, attempt_number) do nothing
    returning envio_id
  )
  select r.* from reserved r
  left join attempts a on a.envio_id = r.id;
end
$$;

create or replace function public.wa_mark_delivery_dispatched(p_delivery uuid, p_worker text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_changed boolean;
begin
  with changed as (
    update public.wa_envios
    set provider_requested_at=now(), provider_attempt_count=provider_attempt_count+1, updated_at=now()
    where id=p_delivery and status='processing' and worker_id=p_worker and lease_expires_at > now()
    returning id, org_id, attempt_count, provider_requested_at
  ), marked as (
    update public.wa_envio_tentativas t
    set request_dispatched_at = c.provider_requested_at
    from changed c
    where t.envio_id = c.id and t.org_id = c.org_id and t.attempt_number = c.attempt_count
    returning t.id
  )
  select exists(select 1 from changed) into v_changed;
  return v_changed;
end
$$;

create or replace function public.wa_register_campaign_health(
  p_org uuid,
  p_campaign uuid,
  p_success boolean,
  p_critical boolean,
  p_reason text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  if p_success then
    update public.campanhas
    set consecutive_failures=0, auto_paused_reason=null, atualizado_em=now()
    where id=p_campaign and org_id=p_org and canal='whatsapp';
  elsif p_critical then
    update public.campanhas
    set consecutive_failures=consecutive_failures+1,
        status=case when consecutive_failures+1 >= failure_pause_threshold then 'pausada' else status end,
        paused_at=case when consecutive_failures+1 >= failure_pause_threshold then now() else paused_at end,
        auto_paused_reason=case when consecutive_failures+1 >= failure_pause_threshold
          then left(coalesce(nullif(trim(p_reason),''),'falhas_criticas_repetidas'),500)
          else auto_paused_reason end,
        atualizado_em=now()
    where id=p_campaign and org_id=p_org and canal='whatsapp'
      and status in ('ativa','agendada','pausada');
  end if;
  select status into v_status from public.campanhas where id=p_campaign and org_id=p_org;
  return v_status;
end
$$;

revoke all on function public.wa_prepare_campaign(uuid,uuid,uuid,timestamptz,text,text) from public, anon, authenticated;
revoke all on function public.wa_create_campaign_draft(uuid,uuid,uuid,text,text,text,timestamptz,text) from public, anon, authenticated;
revoke all on function public.wa_control_campaign(uuid,uuid,uuid,text,text) from public, anon, authenticated;
revoke all on function public.wa_reschedule_campaign(uuid,uuid,uuid,timestamptz,text) from public, anon, authenticated;
revoke all on function public.wa_reserve_delivery_batch(text,integer,integer) from public, anon, authenticated;
revoke all on function public.wa_mark_delivery_dispatched(uuid,text) from public, anon, authenticated;
revoke all on function public.wa_register_campaign_health(uuid,uuid,boolean,boolean,text) from public, anon, authenticated;
grant execute on function public.wa_prepare_campaign(uuid,uuid,uuid,timestamptz,text,text) to service_role;
grant execute on function public.wa_create_campaign_draft(uuid,uuid,uuid,text,text,text,timestamptz,text) to service_role;
grant execute on function public.wa_control_campaign(uuid,uuid,uuid,text,text) to service_role;
grant execute on function public.wa_reschedule_campaign(uuid,uuid,uuid,timestamptz,text) to service_role;
grant execute on function public.wa_reserve_delivery_batch(text,integer,integer) to service_role;
grant execute on function public.wa_mark_delivery_dispatched(uuid,text) to service_role;
grant execute on function public.wa_register_campaign_health(uuid,uuid,boolean,boolean,text) to service_role;

-- Cron deliberadamente ausente. Homologacao deve ativar dispatch_enabled e agendar o worker separadamente.
commit;

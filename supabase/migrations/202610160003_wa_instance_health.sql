-- Correção 03 — saúde operacional, incidentes e contingência do WhatsApp.
-- Deliberadamente não cria cron e não altera campanhas.dispatch_enabled.

alter table public.wa_instancias
  add column if not exists provider_status text not null default 'unknown',
  add column if not exists operational_health text not null default 'unknown',
  add column if not exists last_health_check_at timestamptz,
  add column if not exists last_provider_success_at timestamptz,
  add column if not exists last_provider_event_at timestamptz,
  add column if not exists health_failure_count integer not null default 0,
  add column if not exists health_error_code text,
  add column if not exists next_health_check_at timestamptz,
  add column if not exists reconnect_started_at timestamptz,
  add column if not exists reconnect_requested_by uuid references auth.users(id);

alter table public.wa_instancias drop constraint if exists wa_instancias_provider_status_check;
alter table public.wa_instancias add constraint wa_instancias_provider_status_check
  check (provider_status in ('connected','disconnected','pairing','unknown'));
alter table public.wa_instancias drop constraint if exists wa_instancias_operational_health_check;
alter table public.wa_instancias add constraint wa_instancias_operational_health_check
  check (operational_health in ('healthy','degraded','unstable','unavailable','unknown','reconnecting'));
alter table public.wa_instancias drop constraint if exists wa_instancias_health_failure_count_check;
alter table public.wa_instancias add constraint wa_instancias_health_failure_count_check
  check (health_failure_count >= 0);

create index if not exists wa_instancias_health_due_idx
  on public.wa_instancias(next_health_check_at, org_id)
  where status <> 'queimada';
create index if not exists wa_instancias_dispatch_health_idx
  on public.wa_instancias(org_id, ordem)
  where funcao='disparo' and provider_status='connected' and operational_health='healthy';

create table if not exists public.wa_instancia_incidentes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  instancia_id uuid not null references public.wa_instancias(id) on delete cascade,
  event_type text not null,
  previous_provider_status text,
  provider_status text,
  previous_operational_health text,
  operational_health text,
  source text not null check (source in ('monitor','webhook','manual','worker','system')),
  actor_id uuid references auth.users(id),
  event_key text not null,
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique(org_id, event_key)
);
create index if not exists wa_instancia_incidentes_org_time_idx
  on public.wa_instancia_incidentes(org_id, occurred_at desc);
alter table public.wa_instancia_incidentes enable row level security;
drop policy if exists org_wa_instancia_incidentes_select on public.wa_instancia_incidentes;
create policy org_wa_instancia_incidentes_select on public.wa_instancia_incidentes for select
  using (public.wa_role_allowed(org_id, array['admin','gerente','vendedor','sdr','suporte']));
revoke all on table public.wa_instancia_incidentes from anon, authenticated;
grant select on table public.wa_instancia_incidentes to authenticated;

alter table public.wa_alertas
  add column if not exists instancia_id uuid references public.wa_instancias(id) on delete cascade,
  add column if not exists dedup_key text,
  add column if not exists first_seen_at timestamptz,
  add column if not exists last_seen_at timestamptz,
  add column if not exists occurrences integer not null default 1,
  add column if not exists acknowledged_at timestamptz,
  add column if not exists acknowledged_by uuid references auth.users(id),
  add column if not exists resolved_at timestamptz,
  add column if not exists resolved_by uuid references auth.users(id),
  add column if not exists details jsonb not null default '{}'::jsonb;
update public.wa_alertas
set first_seen_at=coalesce(first_seen_at, criado_em), last_seen_at=coalesce(last_seen_at, criado_em)
where first_seen_at is null or last_seen_at is null;
create unique index if not exists wa_alertas_open_dedup_idx
  on public.wa_alertas(org_id, dedup_key) where resolved_at is null and dedup_key is not null;
create index if not exists wa_alertas_active_org_idx
  on public.wa_alertas(org_id, last_seen_at desc) where resolved_at is null;
revoke update on public.wa_alertas from authenticated;
grant update (lido, acknowledged_at, acknowledged_by) on public.wa_alertas to authenticated;

create table if not exists public.wa_contingencias (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  source_instance_id uuid not null references public.wa_instancias(id),
  backup_instance_id uuid not null references public.wa_instancias(id),
  status text not null default 'active' check (status in ('active','ended','denied')),
  purpose text not null,
  reason text not null,
  authorized_by uuid not null references auth.users(id),
  authorized_at timestamptz not null default now(),
  ended_by uuid references auth.users(id),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  check (source_instance_id <> backup_instance_id)
);
create unique index if not exists wa_contingencias_one_active_source_idx
  on public.wa_contingencias(org_id, source_instance_id) where status='active';
alter table public.wa_contingencias enable row level security;
drop policy if exists org_wa_contingencias_select on public.wa_contingencias;
create policy org_wa_contingencias_select on public.wa_contingencias for select
  using (public.wa_role_allowed(org_id, array['admin','gerente','vendedor','sdr','suporte']));
revoke all on table public.wa_contingencias from anon, authenticated;
grant select on table public.wa_contingencias to authenticated;

create or replace function public.wa_record_instance_event(
  p_org uuid, p_instance uuid, p_event_type text, p_source text, p_actor uuid,
  p_occurred_at timestamptz, p_event_key text, p_details jsonb default '{}'::jsonb
) returns boolean
language plpgsql security definer set search_path=public as $$
begin
  if p_source not in ('monitor','webhook','manual','worker','system') then
    raise exception 'invalid event source' using errcode='22023';
  end if;
  if not exists(select 1 from public.wa_instancias where id=p_instance and org_id=p_org) then
    raise exception 'instance not found' using errcode='P0002';
  end if;
  insert into public.wa_instancia_incidentes(
    org_id,instancia_id,event_type,source,actor_id,occurred_at,event_key,details
  ) values (
    p_org,p_instance,p_event_type,p_source,p_actor,p_occurred_at,p_event_key,coalesce(p_details,'{}'::jsonb)
  ) on conflict(org_id,event_key) do nothing;
  return found;
end $$;

create or replace function public.wa_apply_instance_observation(
  p_org uuid, p_instance uuid, p_source text, p_observed_at timestamptz,
  p_provider_status text, p_operational_health text, p_success boolean,
  p_error_code text default null, p_number text default null, p_actor uuid default null
) returns boolean
language plpgsql security definer set search_path=public as $$
declare
  v_old public.wa_instancias%rowtype;
  v_failures integer;
  v_user uuid;
  v_kind text;
  v_message text;
begin
  if p_source not in ('monitor','webhook','manual','worker','system')
     or p_provider_status not in ('connected','disconnected','pairing','unknown')
     or p_operational_health not in ('healthy','degraded','unstable','unavailable','unknown','reconnecting') then
    raise exception 'invalid health observation' using errcode='22023';
  end if;
  select * into v_old from public.wa_instancias
  where id=p_instance and org_id=p_org for update;
  if not found then raise exception 'instance not found' using errcode='P0002'; end if;
  if p_observed_at < coalesce(v_old.last_provider_event_at, v_old.last_health_check_at, '-infinity'::timestamptz) then
    return false;
  end if;
  v_failures := case when p_success then 0 else v_old.health_failure_count + 1 end;
  update public.wa_instancias set
    provider_status=case when p_success then p_provider_status else provider_status end,
    operational_health=p_operational_health,
    status=case when p_success then case p_provider_status
      when 'connected' then 'conectado' when 'pairing' then 'aguardando'
      when 'disconnected' then 'desconectado' else status end else status end,
    numero=case when p_success and p_provider_status='connected' then coalesce(nullif(p_number,''),numero) else numero end,
    last_health_check_at=p_observed_at,
    last_provider_success_at=case when p_success then p_observed_at else last_provider_success_at end,
    last_provider_event_at=case when p_source='webhook' then p_observed_at else last_provider_event_at end,
    health_failure_count=v_failures,
    falhas_login=v_failures,
    ultima_checagem_em=p_observed_at,
    health_error_code=case when p_success then null else left(coalesce(p_error_code,'provider_error'),120) end,
    next_health_check_at=p_observed_at + make_interval(secs => case when p_success then 300 else least(900,30*power(2,least(v_failures,5))::integer) end),
    reconnect_started_at=case when p_operational_health='healthy' then null else reconnect_started_at end,
    atualizado_em=now()
  where id=p_instance and org_id=p_org;

  if v_old.provider_status is distinct from (case when p_success then p_provider_status else v_old.provider_status end)
     or v_old.operational_health is distinct from p_operational_health then
    insert into public.wa_instancia_incidentes(
      org_id,instancia_id,event_type,previous_provider_status,provider_status,
      previous_operational_health,operational_health,source,actor_id,event_key,occurred_at,details
    ) values (
      p_org,p_instance,'health_changed',v_old.provider_status,
      case when p_success then p_provider_status else v_old.provider_status end,
      v_old.operational_health,p_operational_health,p_source,p_actor,
      p_source||':'||p_instance::text||':'||extract(epoch from p_observed_at)::bigint::text,
      p_observed_at,jsonb_build_object('error_code',left(coalesce(p_error_code,''),120))
    ) on conflict(org_id,event_key) do nothing;
  end if;

  v_user := coalesce(p_actor,v_old.user_id);
  if p_operational_health='healthy' then
    update public.wa_alertas set resolved_at=p_observed_at,resolved_by=p_actor,lido=true
    where org_id=p_org and instancia_id=p_instance and resolved_at is null
      and tipo in ('numero_desconectado','pareamento_necessario','instancia_indisponivel','falha_recorrente','estado_desconhecido');
  else
    v_kind := case
      when p_provider_status='pairing' then 'pareamento_necessario'
      when p_provider_status='disconnected' then 'numero_desconectado'
      when p_operational_health='unstable' then 'falha_recorrente'
      when p_operational_health='unavailable' then 'instancia_indisponivel'
      else 'estado_desconhecido' end;
    v_message := case v_kind
      when 'pareamento_necessario' then 'Número aguardando pareamento.'
      when 'numero_desconectado' then 'Número desconectado confirmado pelo provedor.'
      when 'falha_recorrente' then 'Falhas recorrentes ao consultar a instância.'
      when 'instancia_indisponivel' then 'Instância indisponível para operação.'
      else 'Estado da instância sem evidência recente.' end;
    insert into public.wa_alertas(
      user_id,org_id,instancia_id,tipo,mensagem,lido,dedup_key,first_seen_at,last_seen_at,occurrences,details
    ) values (
      v_user,p_org,p_instance,v_kind,v_message,false,'instance:'||p_instance::text||':'||v_kind,
      p_observed_at,p_observed_at,1,jsonb_build_object('error_code',left(coalesce(p_error_code,''),120))
    ) on conflict(org_id,dedup_key) where resolved_at is null do update
      set last_seen_at=excluded.last_seen_at,occurrences=public.wa_alertas.occurrences+1,
          mensagem=excluded.mensagem,details=excluded.details;
  end if;
  return true;
end $$;

create or replace function public.wa_set_instance_priority(
  p_org uuid,p_instance uuid,p_actor uuid,p_priority integer
) returns boolean
language plpgsql security definer set search_path=public as $$
declare v_old integer; v_target integer;
begin
  if not public.wa_delivery_actor_allowed(p_org,p_actor) then
    raise exception 'not authorized' using errcode='42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('wa-priority:'||p_org::text,0));
  select ordem into v_old from public.wa_instancias where id=p_instance and org_id=p_org for update;
  if not found then raise exception 'instance not found' using errcode='P0002'; end if;
  select least(greatest(p_priority,0),greatest(count(*)-1,0))::integer into v_target
  from public.wa_instancias where org_id=p_org;
  if v_target < v_old then
    update public.wa_instancias set ordem=ordem+1 where org_id=p_org and id<>p_instance and ordem>=v_target and ordem<v_old;
  elsif v_target > v_old then
    update public.wa_instancias set ordem=ordem-1 where org_id=p_org and id<>p_instance and ordem<=v_target and ordem>v_old;
  end if;
  update public.wa_instancias set ordem=v_target,atualizado_em=now() where id=p_instance and org_id=p_org;
  perform public.wa_record_instance_event(p_org,p_instance,'priority_changed','manual',p_actor,now(),
    'priority:'||p_instance::text||':'||extract(epoch from clock_timestamp())::bigint::text,
    jsonb_build_object('from',v_old,'to',v_target));
  return true;
end $$;

create or replace function public.wa_defer_delivery_for_instance_health(
  p_delivery uuid,p_worker text,p_reason text
) returns boolean
language plpgsql security definer set search_path=public as $$
declare v_changed boolean;
begin
  with changed as (
    update public.wa_envios set status='queued',next_attempt_at=now()+interval '5 minutes',
      last_error_code=left(coalesce(p_reason,'instance_health_unavailable'),120),
      last_error='Instância sem saúde operacional recente; envio preservado na fila.',
      worker_id=null,reserved_at=null,lease_expires_at=null,updated_at=now()
    where id=p_delivery and status='processing' and worker_id=p_worker and provider_requested_at is null
    returning id,org_id,attempt_count
  ), attempts as (
    update public.wa_envio_tentativas t set completed_at=now(),outcome='deferred',retryable=true,
      error_code=left(coalesce(p_reason,'instance_health_unavailable'),120),
      error_message='Instância sem saúde operacional recente; envio preservado na fila.'
    from changed c where t.envio_id=c.id and t.org_id=c.org_id and t.attempt_number=c.attempt_count
    returning t.id
  ) select exists(select 1 from changed) into v_changed;
  return v_changed;
end $$;

revoke all on function public.wa_record_instance_event(uuid,uuid,text,text,uuid,timestamptz,text,jsonb) from public,anon,authenticated;
revoke all on function public.wa_apply_instance_observation(uuid,uuid,text,timestamptz,text,text,boolean,text,text,uuid) from public,anon,authenticated;
revoke all on function public.wa_set_instance_priority(uuid,uuid,uuid,integer) from public,anon,authenticated;
revoke all on function public.wa_defer_delivery_for_instance_health(uuid,text,text) from public,anon,authenticated;
grant execute on function public.wa_record_instance_event(uuid,uuid,text,text,uuid,timestamptz,text,jsonb) to service_role;
grant execute on function public.wa_apply_instance_observation(uuid,uuid,text,timestamptz,text,text,boolean,text,text,uuid) to service_role;
grant execute on function public.wa_set_instance_priority(uuid,uuid,uuid,integer) to service_role;
grant execute on function public.wa_defer_delivery_for_instance_health(uuid,text,text) to service_role;

-- Nenhum pg_cron é criado aqui. A ativação periódica do monitor exige autorização posterior.

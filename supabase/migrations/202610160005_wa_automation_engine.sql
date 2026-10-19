-- Correção 05 — motor seguro de automações WhatsApp e preparação do histórico legado.
-- Esta migration NÃO habilita execução, NÃO cria cron, NÃO envia mensagens e NÃO executa backfill.

begin;

create table if not exists public.wa_automation_platform_controls (
  singleton boolean primary key default true check (singleton),
  automation_execution_enabled boolean not null default false check (automation_execution_enabled = false),
  legacy_backfill_execution_enabled boolean not null default false check (legacy_backfill_execution_enabled = false),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.wa_automation_platform_controls(singleton) values(true) on conflict(singleton) do nothing;

create table if not exists public.wa_automation_org_settings (
  org_id uuid primary key references public.orgs(id) on delete cascade,
  engine_enabled boolean not null default false,
  timezone text not null default 'America/Sao_Paulo' check (char_length(timezone) between 1 and 80),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.wa_automations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 3 and 120),
  description text not null default '' check (char_length(description) <= 500),
  automation_type text not null check (automation_type in ('boas_vindas','qualificacao','agendamento','follow_up','recuperacao','atendimento')),
  status text not null default 'rascunho' check (status in ('rascunho','ativa','pausada','arquivada')),
  version integer not null default 1 check (version > 0),
  trigger jsonb not null check (jsonb_typeof(trigger) = 'object'),
  conditions jsonb not null default '[]'::jsonb check (jsonb_typeof(conditions) = 'array' and jsonb_array_length(conditions) <= 20),
  actions jsonb not null check (jsonb_typeof(actions) = 'array' and jsonb_array_length(actions) between 1 and 20),
  config jsonb not null default '{}'::jsonb check (jsonb_typeof(config) = 'object'),
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique(id, org_id)
);
create index if not exists wa_automations_org_status_idx on public.wa_automations(org_id,status,updated_at desc);

create table if not exists public.wa_automation_versions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  automation_id uuid not null,
  version integer not null check (version > 0),
  definition jsonb not null check (jsonb_typeof(definition) = 'object'),
  changed_by uuid not null references auth.users(id),
  changed_at timestamptz not null default now(),
  foreign key(automation_id,org_id) references public.wa_automations(id,org_id) on delete cascade,
  unique(automation_id,version)
);

create or replace function public.wa_save_automation_definition(
  p_org uuid,p_actor uuid,p_definition jsonb,p_automation uuid default null,p_expected_version integer default null
) returns public.wa_automations
language plpgsql security definer set search_path=public as $$
declare v_saved public.wa_automations%rowtype;
begin
  if p_definition is null or jsonb_typeof(p_definition)<>'object' then
    raise exception 'invalid definition' using errcode='22023';
  end if;
  if p_automation is null then
    insert into public.wa_automations(
      org_id,name,description,automation_type,status,version,trigger,conditions,actions,config,created_by,updated_by
    ) values(
      p_org,p_definition->>'name',coalesce(p_definition->>'description',''),p_definition->>'type',
      p_definition->>'status',1,p_definition->'trigger',p_definition->'conditions',
      p_definition->'actions',p_definition->'config',p_actor,p_actor
    ) returning * into v_saved;
  else
    update public.wa_automations set
      name=p_definition->>'name',description=coalesce(p_definition->>'description',''),
      automation_type=p_definition->>'type',status=p_definition->>'status',
      trigger=p_definition->'trigger',conditions=p_definition->'conditions',actions=p_definition->'actions',
      config=p_definition->'config',version=version+1,updated_by=p_actor,updated_at=now(),
      archived_at=case when p_definition->>'status'='arquivada' then now() else null end
    where id=p_automation and org_id=p_org and version=p_expected_version and status<>'arquivada'
    returning * into v_saved;
    if not found then raise exception 'stale automation version' using errcode='40001'; end if;
  end if;
  insert into public.wa_automation_versions(org_id,automation_id,version,definition,changed_by)
  values(v_saved.org_id,v_saved.id,v_saved.version,jsonb_build_object(
    'id',v_saved.id,'name',v_saved.name,'description',v_saved.description,'type',v_saved.automation_type,
    'status',v_saved.status,'version',v_saved.version,'trigger',v_saved.trigger,
    'conditions',v_saved.conditions,'actions',v_saved.actions,'config',v_saved.config
  ),p_actor);
  return v_saved;
end $$;
revoke all on function public.wa_save_automation_definition(uuid,uuid,jsonb,uuid,integer) from public,anon,authenticated;
grant execute on function public.wa_save_automation_definition(uuid,uuid,jsonb,uuid,integer) to service_role;

create table if not exists public.wa_automation_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  event_key text not null check (char_length(event_key) between 1 and 300),
  source text not null check (source in ('webhook','conversation','crm','scheduler','simulation')),
  resource_type text not null check (resource_type in ('conversation','message','lead','follow_up')),
  event_type text not null check (event_type in ('conversation_created','message_received','conversation_assigned','conversation_status_changed','tag_applied','lead_linked','crm_stage_changed','follow_up_due')),
  conversation_id uuid,
  lead_id uuid,
  causation_id uuid references public.wa_automation_events(id) on delete set null,
  correlation_id uuid not null default gen_random_uuid(),
  depth integer not null default 0 check (depth between 0 and 5),
  occurred_at timestamptz not null,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  foreign key(conversation_id,org_id) references public.wa_conversas(id,org_id) on delete cascade,
  foreign key(lead_id,org_id) references public.leads(id,org_id) on delete set null (lead_id),
  unique(org_id,event_key),
  unique(id,org_id)
);
create index if not exists wa_automation_events_resource_idx on public.wa_automation_events(org_id,resource_type,occurred_at desc);

create or replace function public.wa_capture_conversation_automation_event()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  v_type text;
  v_lead uuid;
begin
  v_type := case new.event_type
    when 'conversation_created' then 'conversation_created'
    when 'message_received' then 'message_received'
    when 'assignment_changed' then 'conversation_assigned'
    when 'status_changed' then 'conversation_status_changed'
    when 'tag_added' then 'tag_applied'
    when 'lead_linked' then 'lead_linked'
    when 'lead_created_or_linked' then 'lead_linked'
    else null
  end;
  if v_type is null then return new; end if;
  select lead_id into v_lead from public.wa_conversas where id=new.conversa_id and org_id=new.org_id;
  insert into public.wa_automation_events(
    org_id,event_key,source,resource_type,event_type,conversation_id,lead_id,occurred_at,payload
  ) values(
    new.org_id,'conversation-event:'||new.id::text,'conversation','conversation',v_type,
    new.conversa_id,v_lead,new.occurred_at,
    jsonb_build_object('conversation_event_id',new.id,'details',new.details)
  ) on conflict(org_id,event_key) do nothing;
  return new;
end $$;
revoke all on function public.wa_capture_conversation_automation_event() from public,anon,authenticated;

create trigger trg_wa_capture_conversation_automation_event
after insert on public.wa_conversa_eventos
for each row execute function public.wa_capture_conversation_automation_event();

create table if not exists public.wa_automation_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  automation_id uuid not null,
  automation_version integer not null check (automation_version > 0),
  event_id uuid,
  run_key text not null check (char_length(run_key) between 1 and 500),
  mode text not null check (mode in ('simulation','preparation','execution')),
  state text not null check (state in ('planned','completed','failed','blocked','cycle_blocked','duplicate')),
  conversation_id uuid,
  lead_id uuid,
  condition_results jsonb not null default '[]'::jsonb check (jsonb_typeof(condition_results) = 'array'),
  planned_actions jsonb not null default '[]'::jsonb check (jsonb_typeof(planned_actions) = 'array'),
  executed_actions jsonb not null default '[]'::jsonb check (jsonb_typeof(executed_actions) = 'array'),
  blockers jsonb not null default '[]'::jsonb check (jsonb_typeof(blockers) = 'array'),
  sanitized_error text check (char_length(sanitized_error) <= 500),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  foreign key(automation_id,org_id) references public.wa_automations(id,org_id) on delete cascade,
  foreign key(event_id,org_id) references public.wa_automation_events(id,org_id) on delete set null (event_id),
  foreign key(conversation_id,org_id) references public.wa_conversas(id,org_id) on delete set null (conversation_id),
  foreign key(lead_id,org_id) references public.leads(id,org_id) on delete set null (lead_id),
  unique(org_id,run_key)
);
create index if not exists wa_automation_runs_metrics_idx on public.wa_automation_runs(org_id,mode,state,started_at desc);

create table if not exists public.wa_automation_followups (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  automation_id uuid not null,
  automation_version integer not null check (automation_version > 0),
  conversation_id uuid not null,
  lead_id uuid,
  due_at timestamptz not null,
  timezone text not null check (char_length(timezone) between 1 and 80),
  state text not null default 'pendente' check (state in ('pendente','elegivel','executado','cancelado','bloqueado','expirado')),
  eligibility jsonb not null default '{}'::jsonb check (jsonb_typeof(eligibility) = 'object'),
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(automation_id,org_id) references public.wa_automations(id,org_id) on delete cascade,
  foreign key(conversation_id,org_id) references public.wa_conversas(id,org_id) on delete cascade,
  foreign key(lead_id,org_id) references public.leads(id,org_id) on delete set null (lead_id),
  unique(org_id,idempotency_key)
);
create index if not exists wa_automation_followups_due_idx on public.wa_automation_followups(org_id,state,due_at);

create table if not exists public.wa_legacy_backfill_jobs (
  id uuid primary key default gen_random_uuid(),
  request_key text not null unique,
  requested_by uuid not null references auth.users(id),
  dry_run boolean not null default true check (dry_run),
  batch_size integer not null default 250 check (batch_size between 1 and 1000),
  checkpoint uuid,
  state text not null default 'prepared' check (state in ('prepared','reviewed','blocked','completed')),
  eligible_count bigint not null default 0,
  ambiguous_count bigint not null default 0,
  invalid_count bigint not null default 0,
  linked_count bigint not null default 0,
  report jsonb not null default '{}'::jsonb check (jsonb_typeof(report) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wa_automation_platform_controls enable row level security;
alter table public.wa_automation_org_settings enable row level security;
alter table public.wa_automations enable row level security;
alter table public.wa_automation_versions enable row level security;
alter table public.wa_automation_events enable row level security;
alter table public.wa_automation_runs enable row level security;
alter table public.wa_automation_followups enable row level security;
alter table public.wa_legacy_backfill_jobs enable row level security;

create policy wa_automation_org_settings_select on public.wa_automation_org_settings for select using (
  public.wa_role_allowed(org_id,array['admin','gerente'])
);
create policy wa_automations_select on public.wa_automations for select using (
  public.wa_role_allowed(org_id,array['admin','gerente'])
);
create policy wa_automation_versions_select on public.wa_automation_versions for select using (
  public.wa_role_allowed(org_id,array['admin','gerente'])
);
create policy wa_automation_events_select on public.wa_automation_events for select using (
  public.wa_role_allowed(org_id,array['admin','gerente'])
);
create policy wa_automation_runs_select on public.wa_automation_runs for select using (
  public.wa_role_allowed(org_id,array['admin','gerente'])
);
create policy wa_automation_followups_select on public.wa_automation_followups for select using (
  public.wa_role_allowed(org_id,array['admin','gerente'])
);

revoke all on public.wa_automation_platform_controls,public.wa_legacy_backfill_jobs from public,anon,authenticated;
revoke insert,update,delete on public.wa_automation_org_settings,public.wa_automations,
  public.wa_automation_versions,public.wa_automation_events,public.wa_automation_runs,
  public.wa_automation_followups from authenticated;
grant select on public.wa_automation_org_settings,public.wa_automations,public.wa_automation_versions,
  public.wa_automation_events,public.wa_automation_runs,public.wa_automation_followups to authenticated;

create or replace function public.wa_automation_controls(p_org uuid,p_automation uuid)
returns table(rule_enabled boolean,organization_enabled boolean,platform_enabled boolean,dispatch_enabled boolean)
language sql stable security definer set search_path=public as $$
  select a.status='ativa',coalesce(o.engine_enabled,false),coalesce(p.automation_execution_enabled,false),false
  from public.wa_automations a
  left join public.wa_automation_org_settings o on o.org_id=a.org_id
  cross join public.wa_automation_platform_controls p
  where a.id=p_automation and a.org_id=p_org and p.singleton
$$;
revoke all on function public.wa_automation_controls(uuid,uuid) from public,anon,authenticated;
grant execute on function public.wa_automation_controls(uuid,uuid) to service_role;

create or replace function public.wa_preview_legacy_message_backfill(p_batch_size integer default 250,p_checkpoint uuid default null)
returns table(eligible_count bigint,ambiguous_count bigint,invalid_count bigint,already_linked_count bigint,next_checkpoint uuid)
language sql stable security definer set search_path=public as $$
  with batch as (
    select m.id,m.org_id,m.instancia_id,m.conversa_id,m.remote_contact_id,
      nullif(regexp_replace(coalesce(m.numero,''),'\D','','g'),'') normalized_number
    from public.wa_mensagens m
    where (p_checkpoint is null or m.id>p_checkpoint)
    order by m.id limit least(greatest(p_batch_size,1),1000)
  ), classified as (
    select b.*,
      (b.org_id is not null and b.instancia_id is not null and exists(
        select 1 from public.wa_instancias i where i.id=b.instancia_id and i.org_id=b.org_id
      ) and coalesce(nullif(b.remote_contact_id,''),b.normalized_number) is not null) valid,
      case when b.conversa_id is null then (
        select count(*) from public.wa_conversas c
        where c.org_id=b.org_id and c.instancia_id=b.instancia_id and (
          (nullif(b.remote_contact_id,'') is not null and c.remote_contact_id=b.remote_contact_id)
          or (b.normalized_number is not null and c.normalized_phone=b.normalized_number)
        )
      ) else 0 end candidate_count
    from batch b
  )
  select count(*) filter(where conversa_id is null and valid and candidate_count=1),
    count(*) filter(where conversa_id is null and valid and candidate_count>1),
    count(*) filter(where conversa_id is null and (not valid or candidate_count=0)),
    count(*) filter(where conversa_id is not null),
    (select id from batch order by id desc limit 1)
  from classified
$$;
revoke all on function public.wa_preview_legacy_message_backfill(integer,uuid) from public,anon,authenticated;
grant execute on function public.wa_preview_legacy_message_backfill(integer,uuid) to service_role;

create or replace function public.wa_prepare_legacy_backfill_dry_run(
  p_requested_by uuid,
  p_batch_size integer default 250,
  p_checkpoint uuid default null,
  p_dry_run boolean default true
) returns public.wa_legacy_backfill_jobs
language plpgsql security definer set search_path=public as $$
declare
  v_counts record;
  v_job public.wa_legacy_backfill_jobs%rowtype;
begin
  if not coalesce(p_dry_run,false) then
    raise exception 'real backfill is disabled' using errcode='42501';
  end if;
  if not exists(select 1 from auth.users where id=p_requested_by) then
    raise exception 'requester not found' using errcode='P0002';
  end if;
  select * into v_counts from public.wa_preview_legacy_message_backfill(p_batch_size,p_checkpoint);
  insert into public.wa_legacy_backfill_jobs(
    request_key,requested_by,dry_run,batch_size,checkpoint,state,eligible_count,ambiguous_count,
    invalid_count,linked_count,report
  ) values(
    md5(coalesce(p_checkpoint::text,'start')||':'||least(greatest(p_batch_size,1),1000)::text),
    p_requested_by,true,least(greatest(p_batch_size,1),1000),v_counts.next_checkpoint,'prepared',
    v_counts.eligible_count,v_counts.ambiguous_count,v_counts.invalid_count,
    v_counts.already_linked_count,
    jsonb_build_object('input_checkpoint',p_checkpoint,'next_checkpoint',v_counts.next_checkpoint,
      'mode','dry_run','messages_changed',0)
  ) on conflict(request_key) do update set updated_at=now()
  returning * into v_job;
  return v_job;
end $$;
revoke all on function public.wa_prepare_legacy_backfill_dry_run(uuid,integer,uuid,boolean) from public,anon,authenticated;
grant execute on function public.wa_prepare_legacy_backfill_dry_run(uuid,integer,uuid,boolean) to service_role;

comment on function public.wa_preview_legacy_message_backfill(integer,uuid) is
  'Dry-run administrativo e somente leitura. Não vincula, altera ou remove mensagens.';
comment on table public.wa_legacy_backfill_jobs is
  'Checkpoints e relatórios de preparação. dry_run é estruturalmente obrigatório nesta correção.';

commit;

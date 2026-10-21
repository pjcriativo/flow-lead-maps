-- Executor real de automações WhatsApp (2026-10-21).
--
-- O motor (202610160005) capturava eventos e só simulava. Esta migration acrescenta o que o
-- runner (Edge wa-automation-runner) precisa para EXECUTAR com segurança:
--   * reserva de eventos com lease (wa_automation_claim_events / wa_automation_finish_event);
--   * execução de ações reutilizando o CRM existente (wa_conversation_action), com a
--     profundidade causal propagada por GUC de transação para o gatilho de captura — uma ação
--     que gera novo evento nasce com depth+1 e o planner bloqueia a partir de 5 (anti-loop);
--   * follow-ups agendados e emissão dos vencidos como eventos follow_up_due.
--
-- NADA é ligado aqui: wa_automation_platform_controls.automation_execution_enabled continua
-- travado em false por CHECK. Até a homologação, o runner só registra execuções bloqueadas
-- ('preparation'). Nenhuma ação envia WhatsApp.

alter table public.wa_automation_events
  add column if not exists processed_at timestamptz,
  add column if not exists lease_until timestamptz,
  add column if not exists attempts integer not null default 0;
create index if not exists wa_automation_events_pending_idx
  on public.wa_automation_events(created_at) where processed_at is null;

-- Captura: propaga profundidade/causa quando o evento nasce de uma ação de automação.
create or replace function public.wa_capture_conversation_automation_event()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  v_type text;
  v_lead uuid;
  v_depth integer;
  v_cause uuid;
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
  v_depth := least(coalesce(nullif(current_setting('wa.automation_depth', true), '')::integer + 1, 0), 5);
  v_cause := nullif(current_setting('wa.automation_event_id', true), '')::uuid;
  select lead_id into v_lead from public.wa_conversas where id=new.conversa_id and org_id=new.org_id;
  insert into public.wa_automation_events(
    org_id,event_key,source,resource_type,event_type,conversation_id,lead_id,
    causation_id,depth,occurred_at,payload
  ) values(
    new.org_id,'conversation-event:'||new.id::text,'conversation','conversation',v_type,
    new.conversa_id,v_lead,v_cause,v_depth,new.occurred_at,
    jsonb_build_object('conversation_event_id',new.id,'details',new.details)
  ) on conflict(org_id,event_key) do nothing;
  return new;
end $$;

create or replace function public.wa_automation_claim_events(p_limit integer default 25, p_lease_seconds integer default 120)
returns setof public.wa_automation_events
language plpgsql security definer set search_path=public as $$
begin
  return query
  with candidatos as (
    select e.id from public.wa_automation_events e
    where e.processed_at is null
      and (e.lease_until is null or e.lease_until < now())
      and e.attempts < 5
    order by e.created_at
    for update skip locked
    limit least(greatest(coalesce(p_limit,25),1),100)
  )
  update public.wa_automation_events e
     set lease_until = now() + make_interval(secs => least(greatest(coalesce(p_lease_seconds,120),30),600)),
         attempts = e.attempts + 1
    from candidatos c
   where e.id = c.id
  returning e.*;
end $$;

create or replace function public.wa_automation_finish_event(p_org uuid, p_event uuid)
returns boolean language sql security definer set search_path=public as $$
  update public.wa_automation_events
     set processed_at = now(), lease_until = null
   where id = p_event and org_id = p_org and processed_at is null
  returning true;
$$;

-- Executa UMA ação de conversa em nome do dono da regra, com a causalidade marcada.
create or replace function public.wa_automation_execute_action(
  p_org uuid, p_conversation uuid, p_actor uuid, p_action text, p_value jsonb,
  p_event uuid, p_depth integer
) returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  v_value jsonb := coalesce(p_value, '{}'::jsonb);
  v_tag uuid;
begin
  if p_action not in ('add_tag','remove_tag','add_note','transfer','set_status') then
    raise exception 'automation action not allowed' using errcode='22023';
  end if;
  if p_action = 'remove_tag' and nullif(v_value->>'tag_id','') is null then
    select id into v_tag from public.wa_etiquetas
     where org_id = p_org and name = left(btrim(coalesce(v_value->>'name','')),40);
    if v_tag is null then return jsonb_build_object('skipped','tag_not_found'); end if;
    v_value := jsonb_build_object('tag_id', v_tag);
  end if;
  perform set_config('wa.automation_depth', greatest(coalesce(p_depth,0),0)::text, true);
  perform set_config('wa.automation_event_id', coalesce(p_event::text,''), true);
  return public.wa_conversation_action(p_org, p_conversation, p_actor, p_action, v_value);
end $$;

create or replace function public.wa_automation_record_activity(
  p_org uuid, p_conversation uuid, p_actor uuid, p_details jsonb
) returns uuid
language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  -- 'automation_activity' não é capturado pelo gatilho: registrar atividade não gera novo evento.
  insert into public.wa_conversa_eventos(org_id,conversa_id,event_type,actor_id,details)
  values(p_org,p_conversation,'automation_activity',p_actor,coalesce(p_details,'{}'::jsonb))
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.wa_automation_schedule_followup(
  p_org uuid, p_automation uuid, p_version integer, p_conversation uuid, p_lead uuid,
  p_due_at timestamptz, p_timezone text, p_key text, p_depth integer
) returns boolean
language plpgsql security definer set search_path=public as $$
begin
  insert into public.wa_automation_followups(
    org_id,automation_id,automation_version,conversation_id,lead_id,due_at,timezone,
    idempotency_key,eligibility
  ) values(
    p_org,p_automation,p_version,p_conversation,p_lead,p_due_at,coalesce(p_timezone,'America/Sao_Paulo'),
    p_key,jsonb_build_object('depth',least(greatest(coalesce(p_depth,0),0),5))
  ) on conflict(org_id,idempotency_key) do nothing;
  return found;
end $$;

create or replace function public.wa_automation_emit_due_followups(p_limit integer default 50)
returns integer
language plpgsql security definer set search_path=public as $$
declare v_count integer := 0; r record;
begin
  for r in
    select f.* from public.wa_automation_followups f
    where f.state = 'pendente' and f.due_at <= now()
    order by f.due_at
    for update skip locked
    limit least(greatest(coalesce(p_limit,50),1),200)
  loop
    insert into public.wa_automation_events(
      org_id,event_key,source,resource_type,event_type,conversation_id,lead_id,depth,occurred_at,payload
    ) values(
      r.org_id,'followup:'||r.id::text,'scheduler','follow_up','follow_up_due',r.conversation_id,r.lead_id,
      least(coalesce((r.eligibility->>'depth')::integer,0)+1,5),r.due_at,
      jsonb_build_object('followup_id',r.id,'automation_id',r.automation_id)
    ) on conflict(org_id,event_key) do nothing;
    update public.wa_automation_followups set state='executado', updated_at=now() where id=r.id;
    v_count := v_count + 1;
  end loop;
  return v_count;
end $$;

revoke all on function public.wa_automation_claim_events(integer,integer) from public,anon,authenticated;
revoke all on function public.wa_automation_finish_event(uuid,uuid) from public,anon,authenticated;
revoke all on function public.wa_automation_execute_action(uuid,uuid,uuid,text,jsonb,uuid,integer) from public,anon,authenticated;
revoke all on function public.wa_automation_record_activity(uuid,uuid,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.wa_automation_schedule_followup(uuid,uuid,integer,uuid,uuid,timestamptz,text,text,integer) from public,anon,authenticated;
revoke all on function public.wa_automation_emit_due_followups(integer) from public,anon,authenticated;
grant execute on function public.wa_automation_claim_events(integer,integer) to service_role;
grant execute on function public.wa_automation_finish_event(uuid,uuid) to service_role;
grant execute on function public.wa_automation_execute_action(uuid,uuid,uuid,text,jsonb,uuid,integer) to service_role;
grant execute on function public.wa_automation_record_activity(uuid,uuid,uuid,jsonb) to service_role;
grant execute on function public.wa_automation_schedule_followup(uuid,uuid,integer,uuid,uuid,timestamptz,text,text,integer) to service_role;
grant execute on function public.wa_automation_emit_due_followups(integer) to service_role;

-- Correção do recebimento de mensagens individuais do WhatsApp (2026-10-21).
--
-- CAUSA: wa_ingest_inbound_message e a ação create_lead de wa_conversation_action usavam
-- min(uuid), agregação que NÃO existe no PostgreSQL 17 deste projeto ("function min(uuid) does
-- not exist", 42883). Toda mensagem individual com telefone válido caía nesse erro antes de ser
-- gravada, então nada chegava à Central de Conversas mesmo com o webhook entregando.
--
-- CORREÇÃO: (array_agg(id order by id))[1], equivalente ao menor id e disponível em qualquer
-- versão. Lógica idêntica à anterior em todo o resto. Idempotente (create or replace).

create or replace function public.wa_ingest_inbound_message(
  p_org uuid,
  p_instance uuid,
  p_remote_contact_id text,
  p_phone text,
  p_contact_name text,
  p_external_id text,
  p_message_type text,
  p_text text,
  p_occurred_at timestamptz
) returns table(conversation_id uuid, message_id uuid, inserted boolean)
language plpgsql security definer set search_path=public as $$
declare
  v_instance public.wa_instancias%rowtype;
  v_conversation public.wa_conversas%rowtype;
  v_lead uuid;
  v_message uuid;
  v_envio uuid;
  v_campanha uuid;
  v_inserted boolean := false;
  v_conversation_created boolean := false;
begin
  if p_remote_contact_id is null or btrim(p_remote_contact_id)=''
     or p_external_id is null or btrim(p_external_id)=''
     or p_occurred_at is null then
    raise exception 'invalid inbound message' using errcode='22023';
  end if;

  select * into v_instance from public.wa_instancias
    where id=p_instance and org_id=p_org for update;
  if not found then raise exception 'instance not found' using errcode='P0002'; end if;

  if p_phone is not null then
    select (array_agg(l.id order by l.id))[1] into v_lead
    from public.leads l
    where l.org_id=p_org
      and regexp_replace(coalesce(l.whatsapp,l.phone,''),'\D','','g')=p_phone
    having count(*)=1;
  end if;
  if v_lead is not null then
    select e.id,e.campanha_id into v_envio,v_campanha from public.wa_envios e
      where e.org_id=p_org and e.instancia_id=p_instance and e.lead_id=v_lead
        and e.status in ('accepted','sent','delivered','read')
      order by e.accepted_at desc nulls last,e.queue_created_at desc limit 1;
  end if;

  insert into public.wa_conversas(
    org_id,instancia_id,remote_contact_id,normalized_phone,contact_name,lead_id,
    assigned_to,status,last_message_at,last_message_preview,last_message_type,last_message_direction,last_inbound_at,unread_count
  ) values (
    p_org,p_instance,p_remote_contact_id,p_phone,nullif(left(btrim(coalesce(p_contact_name,'')),160),''),v_lead,
    (select assigned_to from public.leads where id=v_lead),
    case when v_lead is null then 'unassigned' else 'waiting_agent' end,
    p_occurred_at,left(p_text,500),p_message_type,'in',p_occurred_at,0
  ) on conflict(org_id,instancia_id,remote_contact_id) do nothing
  returning * into v_conversation;
  if found then
    v_conversation_created := true;
  else
    update public.wa_conversas set
      normalized_phone=coalesce(p_phone,normalized_phone),
      contact_name=coalesce(nullif(left(btrim(coalesce(p_contact_name,'')),160),''),contact_name),
      lead_id=coalesce(lead_id,v_lead),
      assigned_to=coalesce(assigned_to,(select assigned_to from public.leads where id=v_lead)),
      updated_at=now()
    where org_id=p_org and instancia_id=p_instance and remote_contact_id=p_remote_contact_id
    returning * into v_conversation;
  end if;

  insert into public.wa_mensagens(
    user_id,org_id,instancia_id,conversa_id,numero,remote_contact_id,lead_id,envio_id,campanha_id,nome_contato,
    direcao,tipo,texto,externo_id,lida,status,provider_occurred_at,received_at
  ) values (
    v_instance.user_id,p_org,p_instance,v_conversation.id,coalesce(p_phone,p_remote_contact_id),
    p_remote_contact_id,v_conversation.lead_id,v_envio,v_campanha,v_conversation.contact_name,
    'in',p_message_type,p_text,p_external_id,false,'received',p_occurred_at,now()
  ) on conflict(org_id,instancia_id,externo_id) where externo_id is not null do nothing
  returning id into v_message;

  if v_message is not null then
    v_inserted := true;
    if v_conversation_created then
      insert into public.wa_conversa_eventos(org_id,conversa_id,event_type,event_key,occurred_at,details)
      values(p_org,v_conversation.id,'conversation_created','conversation:'||v_conversation.id::text,
        p_occurred_at,jsonb_build_object('instance_id',p_instance,'remote_contact_id',p_remote_contact_id))
      on conflict(org_id,event_key) do nothing;
    end if;
    if v_conversation.lead_id is not null
       and coalesce(p_text,'') ~* '^\s*(sair|pare|cancelar|remover)\s*[.!]?\s*$' then
      update public.leads set whatsapp_opt_out=true,whatsapp_opt_out_at=now(),updated_at=now()
        where id=v_conversation.lead_id and org_id=p_org;
      update public.wa_envios set status='blocked',blocked_reason='opt_out',retryable=false,updated_at=now()
        where lead_id=v_conversation.lead_id and org_id=p_org
          and status in ('draft','pending_approval','scheduled','queued','failed');
    end if;
    update public.wa_conversas set
      unread_count=unread_count+1,
      last_message_at=case when last_message_at is null or p_occurred_at>=last_message_at then p_occurred_at else last_message_at end,
      last_message_preview=case when last_message_at is null or p_occurred_at>=last_message_at then left(p_text,500) else last_message_preview end,
      last_message_type=case when last_message_at is null or p_occurred_at>=last_message_at then p_message_type else last_message_type end,
      last_message_direction=case when last_message_at is null or p_occurred_at>=last_message_at then 'in' else last_message_direction end,
      last_inbound_at=case when last_inbound_at is null or p_occurred_at>=last_inbound_at then p_occurred_at else last_inbound_at end,
      status=case
        when last_message_at is null or p_occurred_at>=last_message_at
          then case when assigned_to is null then 'unassigned' else 'waiting_agent' end
        else status
      end,
      version=version+1, updated_at=now()
    where id=v_conversation.id;
    insert into public.wa_conversa_eventos(org_id,conversa_id,event_type,event_key,occurred_at,details)
    values(p_org,v_conversation.id,'message_received','inbound:'||p_instance::text||':'||p_external_id,
      p_occurred_at,jsonb_build_object('message_id',v_message,'message_type',p_message_type))
    on conflict(org_id,event_key) do nothing;
  else
    select id into v_message from public.wa_mensagens
      where org_id=p_org and instancia_id=p_instance and externo_id=p_external_id;
  end if;

  return query select v_conversation.id,v_message,v_inserted;
end $$;

revoke all on function public.wa_ingest_inbound_message(uuid,uuid,text,text,text,text,text,text,timestamptz) from public, authenticated;
grant execute on function public.wa_ingest_inbound_message(uuid,uuid,text,text,text,text,text,text,timestamptz) to service_role;

create or replace function public.wa_conversation_action(
  p_org uuid, p_conversation uuid, p_actor uuid, p_action text, p_value jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  v_conversation public.wa_conversas%rowtype;
  v_role text;
  v_target uuid;
  v_lead uuid;
  v_note uuid;
  v_tag uuid;
  v_name text;
  v_color text;
  v_matches integer;
begin
  select m.papel::text into v_role from public.memberships m
    where m.org_id=p_org and m.user_id=p_actor;
  if v_role is null or v_role='super_admin' then
    raise exception 'membership not allowed' using errcode='42501';
  end if;
  select * into v_conversation from public.wa_conversas
    where id=p_conversation and org_id=p_org for update;
  if not found then raise exception 'conversation not found' using errcode='P0002'; end if;
  if v_role in ('vendedor','sdr')
     and v_conversation.assigned_to is distinct from p_actor
     and not (p_action='claim' and v_conversation.assigned_to is null) then
    raise exception 'conversation not assigned to actor' using errcode='42501';
  end if;

  if p_action in ('claim','transfer','unassign') then
    if p_action='claim' then
      v_target := p_actor;
      if v_conversation.assigned_to is not null and v_conversation.assigned_to<>p_actor then
        raise exception 'conversation already assigned' using errcode='40001';
      end if;
    elsif p_action='transfer' then
      if v_role not in ('admin','gerente') then raise exception 'transfer not allowed' using errcode='42501'; end if;
      v_target := nullif(p_value->>'user_id','')::uuid;
      if not exists(select 1 from public.memberships m where m.org_id=p_org and m.user_id=v_target
        and m.papel::text in ('admin','gerente','vendedor','sdr','suporte')) then
        raise exception 'target membership not found' using errcode='22023';
      end if;
    else
      if v_role not in ('admin','gerente') then raise exception 'unassign not allowed' using errcode='42501'; end if;
      v_target := null;
    end if;
    update public.wa_conversas set assigned_to=v_target,
      status=case when v_target is null then 'unassigned' when status='unassigned' then 'in_progress' else status end,
      version=version+1,updated_at=now() where id=p_conversation;
    if v_conversation.lead_id is not null then
      update public.leads set assigned_to=v_target,updated_at=now()
        where id=v_conversation.lead_id and org_id=p_org;
      if v_target is not null and v_target is distinct from v_conversation.assigned_to then
        insert into public.lead_atribuicoes(lead_id,org_id,de_user_id,para_user_id,por_user_id,motivo)
        values(v_conversation.lead_id,p_org,v_conversation.assigned_to,v_target,p_actor,'WhatsApp: '||p_action);
      end if;
    end if;
    insert into public.wa_conversa_eventos(org_id,conversa_id,event_type,actor_id,details)
      values(p_org,p_conversation,'assignment_changed',p_actor,
        jsonb_build_object('from',v_conversation.assigned_to,'to',v_target,'action',p_action));
  elsif p_action='set_status' then
    v_name := p_value->>'status';
    if v_name not in ('unassigned','in_progress','waiting_contact','waiting_agent','completed','archived') then
      raise exception 'invalid status' using errcode='22023';
    end if;
    update public.wa_conversas set status=v_name,version=version+1,updated_at=now() where id=p_conversation;
    insert into public.wa_conversa_eventos(org_id,conversa_id,event_type,actor_id,details)
      values(p_org,p_conversation,'status_changed',p_actor,jsonb_build_object('from',v_conversation.status,'to',v_name));
  elsif p_action='mark_read' then
    update public.wa_mensagens set lida=true where org_id=p_org and conversa_id=p_conversation and direcao='in' and not lida;
    update public.wa_conversas set unread_count=0,version=version+1,updated_at=now() where id=p_conversation;
  elsif p_action='add_note' then
    v_name := btrim(coalesce(p_value->>'body',''));
    if char_length(v_name) not between 1 and 4000 then raise exception 'invalid note' using errcode='22023'; end if;
    insert into public.wa_conversa_notas(org_id,conversa_id,author_id,body)
      values(p_org,p_conversation,p_actor,v_name) returning id into v_note;
    insert into public.wa_conversa_eventos(org_id,conversa_id,event_type,actor_id,details)
      values(p_org,p_conversation,'note_added',p_actor,jsonb_build_object('note_id',v_note));
  elsif p_action='link_lead' then
    v_lead := nullif(p_value->>'lead_id','')::uuid;
    if not exists(select 1 from public.leads where id=v_lead and org_id=p_org) then
      raise exception 'lead not found' using errcode='P0002';
    end if;
    update public.wa_conversas c set lead_id=v_lead,
      assigned_to=coalesce(c.assigned_to,(select assigned_to from public.leads where id=v_lead)),
      version=version+1,updated_at=now() where id=p_conversation;
    update public.wa_mensagens set lead_id=v_lead where org_id=p_org and conversa_id=p_conversation;
    insert into public.wa_conversa_eventos(org_id,conversa_id,event_type,actor_id,details)
      values(p_org,p_conversation,'lead_linked',p_actor,jsonb_build_object('lead_id',v_lead));
  elsif p_action='create_lead' then
    if v_conversation.lead_id is not null then raise exception 'conversation already has lead' using errcode='23505'; end if;
    if v_conversation.normalized_phone is null then raise exception 'phone required' using errcode='22023'; end if;
    select (array_agg(id order by id))[1],count(*) into v_lead,v_matches from public.leads
      where org_id=p_org and regexp_replace(coalesce(whatsapp,phone,''),'\D','','g')=v_conversation.normalized_phone
      having count(*)>0;
    if coalesce(v_matches,0)>1 then raise exception 'ambiguous lead match' using errcode='21000'; end if;
    if v_lead is null then
      insert into public.leads(user_id,org_id,business_name,phone,whatsapp,has_phone,status,origem_fonte,origem_estrategia,assigned_to)
      values(p_actor,p_org,coalesce(nullif(v_conversation.contact_name,''),v_conversation.normalized_phone),
        v_conversation.normalized_phone,v_conversation.normalized_phone,true,'new','whatsapp','conversation_center',
        coalesce(v_conversation.assigned_to,p_actor)) returning id into v_lead;
    end if;
    update public.wa_conversas set lead_id=v_lead,
      assigned_to=coalesce(assigned_to,(select assigned_to from public.leads where id=v_lead)),
      status=case when status='unassigned' then 'in_progress' else status end,
      version=version+1,updated_at=now() where id=p_conversation;
    update public.wa_mensagens set lead_id=v_lead where org_id=p_org and conversa_id=p_conversation;
    insert into public.wa_conversa_eventos(org_id,conversa_id,event_type,actor_id,details)
      values(p_org,p_conversation,'lead_created_or_linked',p_actor,jsonb_build_object('lead_id',v_lead));
  elsif p_action='add_tag' then
    v_name := left(btrim(coalesce(p_value->>'name','')),40);
    v_color := coalesce(nullif(p_value->>'color',''),'#64748b');
    if v_name='' or v_color !~ '^#[0-9A-Fa-f]{6}$' then raise exception 'invalid tag' using errcode='22023'; end if;
    insert into public.wa_etiquetas(org_id,name,color,created_by) values(p_org,v_name,v_color,p_actor)
      on conflict(org_id,name) do update set color=excluded.color returning id into v_tag;
    insert into public.wa_conversa_etiquetas(org_id,conversa_id,etiqueta_id,added_by)
      values(p_org,p_conversation,v_tag,p_actor) on conflict do nothing;
    if found then
      insert into public.wa_conversa_eventos(org_id,conversa_id,event_type,actor_id,details)
        values(p_org,p_conversation,'tag_added',p_actor,jsonb_build_object('tag_id',v_tag,'name',v_name));
    end if;
  elsif p_action='remove_tag' then
    v_tag := nullif(p_value->>'tag_id','')::uuid;
    delete from public.wa_conversa_etiquetas where org_id=p_org and conversa_id=p_conversation and etiqueta_id=v_tag;
    if found then
      insert into public.wa_conversa_eventos(org_id,conversa_id,event_type,actor_id,details)
        values(p_org,p_conversation,'tag_removed',p_actor,jsonb_build_object('tag_id',v_tag));
    end if;
  else
    raise exception 'invalid action' using errcode='22023';
  end if;
  return (select to_jsonb(c) from public.wa_conversas c where c.id=p_conversation);
end $$;

revoke all on function public.wa_conversation_action(uuid,uuid,uuid,text,jsonb) from public, authenticated;
grant execute on function public.wa_conversation_action(uuid,uuid,uuid,text,jsonb) to service_role;

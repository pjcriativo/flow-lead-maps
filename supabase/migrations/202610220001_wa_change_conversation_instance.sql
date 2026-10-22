-- Continuar uma conversa por OUTRO número quando o número original foi removido (2026-10-22).
--
-- Contexto: conversas ligadas a uma instância arquivada (ex.: o chip legado "flowleads") não
-- conseguiam mais ser respondidas, e o único caminho era uma ação de administrador sem tela.
-- Agora o atendente, na própria conversa, escolhe por qual número ativo continuar. Regras:
--   * só vale quando o número ORIGINAL não está mais disponível (arquivado/removido) — nunca
--     tira uma conversa de um número que continua ativo;
--   * a escolha é EXPLÍCITA (o atendente seleciona o número) e fica AUDITADA: evento na linha do
--     tempo da conversa e incidente na instância de destino, com autor, origem e destino;
--   * mesmas regras de acesso das demais ações da conversa (membro da organização; vendedor/sdr
--     só nas conversas atribuídas a si);
--   * o destino precisa ser da mesma organização, ativo, conectado e pareado; se o contato já tem
--     conversa no destino (unicidade org+instância+contato), nada é movido;
--   * o histórico é preservado: as mensagens antigas continuam gravadas com a instância de origem.
-- Idempotente (create or replace). Só service_role executa.
create or replace function public.wa_change_conversation_instance(
  p_org uuid,
  p_conversation uuid,
  p_actor uuid,
  p_to uuid
) returns table(conversation_id uuid, from_instance uuid, to_instance uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_conv public.wa_conversas%rowtype;
  v_from_active boolean;
  v_existing uuid;
begin
  select m.papel::text into v_role
  from public.memberships m
  where m.org_id = p_org and m.user_id = p_actor;
  if v_role is null or v_role = 'super_admin' then
    raise exception 'membership not allowed' using errcode = '42501';
  end if;

  select * into v_conv from public.wa_conversas
  where id = p_conversation and org_id = p_org
  for update;
  if not found then raise exception 'conversation not found' using errcode = 'P0002'; end if;

  if v_role in ('vendedor', 'sdr') and v_conv.assigned_to is distinct from p_actor then
    raise exception 'conversation not assigned to actor' using errcode = '42501';
  end if;

  select exists (
    select 1 from public.wa_instancias i
    where i.id = v_conv.instancia_id and i.org_id = p_org and i.deleted_at is null
  ) into v_from_active;
  if v_from_active then
    raise exception 'original instance is still active' using errcode = '23514';
  end if;
  if v_conv.instancia_id = p_to then
    raise exception 'target equals current instance' using errcode = '22023';
  end if;

  perform 1 from public.wa_instancias i
  where i.id = p_to and i.org_id = p_org and i.deleted_at is null
    and i.status = 'conectado' and i.numero is not null;
  if not found then raise exception 'target instance unavailable' using errcode = 'P0002'; end if;

  select c.id into v_existing from public.wa_conversas c
  where c.org_id = p_org and c.instancia_id = p_to
    and c.remote_contact_id = v_conv.remote_contact_id;
  if v_existing is not null then
    raise exception 'conversation already exists in target' using errcode = '23505';
  end if;

  update public.wa_conversas
     set instancia_id = p_to, version = version + 1, updated_at = now()
   where id = p_conversation and org_id = p_org;

  insert into public.wa_conversa_eventos(org_id, conversa_id, event_type, actor_id, details)
  values (p_org, p_conversation, 'instance_changed', p_actor,
    jsonb_build_object('from_instance_id', v_conv.instancia_id, 'to_instance_id', p_to,
                       'reason', 'original_instance_unavailable'));

  perform public.wa_record_instance_event(
    p_org, p_to, 'conversation_instance_changed', 'manual', p_actor, now(),
    'chg:' || p_conversation::text || ':' || floor(extract(epoch from clock_timestamp()) * 1000)::bigint::text,
    jsonb_build_object('conversation_id', p_conversation,
                       'from_instance_id', v_conv.instancia_id)
  );

  return query select p_conversation, v_conv.instancia_id, p_to;
end
$$;

revoke all on function public.wa_change_conversation_instance(uuid, uuid, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.wa_change_conversation_instance(uuid, uuid, uuid, uuid)
  to service_role;

-- Reatribuição AUTORIZADA de conversas de um número arquivado para um número ativo (2026-10-21).
--
-- Contexto: as conversas herdadas do chip legado "flowleads" (arquivado, sem número gravado)
-- ficaram presas a ele e a resposta manual passou a ser recusada. O sistema NUNCA redireciona
-- conversa sozinho: sem número no legado não há correspondência comprovável com um chip atual.
-- A reatribuição só acontece por ação explícita de administrador (wa-chips: reatribuir_conversas).
--
-- Histórico preservado: as mensagens continuam gravadas com o chip de origem (rastreabilidade);
-- só a conversa passa a ser atendida pelo chip de destino. Conversas cujo contato já tem conversa
-- no destino NÃO são movidas (violaria a unicidade) e voltam na contagem de ignoradas.
-- Idempotente: create or replace; permissões iguais às demais funções wa_* (só service_role).
create or replace function public.wa_reassign_conversations(
  p_org uuid,
  p_actor uuid,
  p_from uuid,
  p_to uuid,
  p_reason text
) returns table(moved bigint, skipped bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_moved bigint := 0;
  v_skipped bigint := 0;
begin
  if p_from = p_to then
    raise exception 'origem e destino devem ser diferentes' using errcode = '22023';
  end if;
  if length(trim(coalesce(p_reason, ''))) < 10 then
    raise exception 'motivo obrigatório (mínimo 10 caracteres)' using errcode = '22023';
  end if;
  -- Origem: da org e ARQUIVADA (nunca esvazia um chip em uso).
  perform 1 from public.wa_instancias
   where id = p_from and org_id = p_org and deleted_at is not null;
  if not found then
    raise exception 'origem deve ser um número arquivado da organização' using errcode = 'P0002';
  end if;
  -- Destino: da org, ativo, conectado e pareado.
  perform 1 from public.wa_instancias
   where id = p_to and org_id = p_org and deleted_at is null
     and status = 'conectado' and numero is not null;
  if not found then
    raise exception 'destino deve ser um número ativo, conectado e pareado' using errcode = 'P0002';
  end if;

  select count(*) into v_skipped
  from public.wa_conversas c
  where c.org_id = p_org and c.instancia_id = p_from
    and exists (
      select 1 from public.wa_conversas d
      where d.org_id = p_org and d.instancia_id = p_to
        and d.remote_contact_id = c.remote_contact_id
    );

  with moved as (
    update public.wa_conversas c
       set instancia_id = p_to,
           version = c.version + 1,
           updated_at = now()
     where c.org_id = p_org and c.instancia_id = p_from
       and not exists (
         select 1 from public.wa_conversas d
         where d.org_id = p_org and d.instancia_id = p_to
           and d.remote_contact_id = c.remote_contact_id
       )
    returning 1
  )
  select count(*) into v_moved from moved;

  perform public.wa_record_instance_event(
    p_org, p_to, 'conversations_reassigned', 'manual', p_actor, now(),
    'reassign:' || p_from::text || ':' || p_to::text || ':'
      || floor(extract(epoch from clock_timestamp()) * 1000)::bigint::text,
    jsonb_build_object('from_instance_id', p_from, 'moved', v_moved, 'skipped', v_skipped,
                       'reason', left(trim(p_reason), 300))
  );

  return query select v_moved, v_skipped;
end
$$;

revoke all on function public.wa_reassign_conversations(uuid, uuid, uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.wa_reassign_conversations(uuid, uuid, uuid, uuid, text)
  to service_role;

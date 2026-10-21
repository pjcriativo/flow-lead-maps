-- Liberação EXPLÍCITA de disparo de campanha WhatsApp (2026-10-21).
--
-- Problema: dispatch_enabled nascia false e nenhum caminho do sistema o ligava; campanhas
-- aprovadas nunca eram reservadas pelo worker. Agora wa_control_campaign aceita:
--   release_dispatch — exige campanha aprovada, ativa/agendada e motivo (>= 10 caracteres);
--                      registra quem liberou, quando e por quê.
--   hold_dispatch    — desliga o disparo a qualquer momento (sem perder fila nem histórico).
-- Consentimento, opt-out, janela de horário, idempotência, saúde dos chips e teto diário
-- continuam sendo aplicados pelo worker. Nada é liberado por esta migration.
alter table public.campanhas
  add column if not exists dispatch_released_at timestamptz,
  add column if not exists dispatch_released_by uuid references auth.users(id),
  add column if not exists dispatch_release_reason text;

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
  elsif p_action = 'release_dispatch' then
    -- Autorização EXPLÍCITA de envio: só campanha já aprovada (fila preparada), ativa ou agendada,
    -- e com motivo registrado. Consentimento, opt-out, janela e teto continuam valendo no worker.
    if v_status not in ('ativa','agendada') then
      raise exception 'campaign cannot be released' using errcode = '23514';
    end if;
    if not exists (select 1 from public.campanhas where id=p_campaign and org_id=p_org and approved_at is not null) then
      raise exception 'campaign is not approved' using errcode = '23514';
    end if;
    if length(trim(coalesce(p_reason,''))) < 10 then
      raise exception 'release reason is required' using errcode = '22023';
    end if;
    update public.campanhas
      set dispatch_enabled=true, dispatch_released_at=now(), dispatch_released_by=p_actor,
          dispatch_release_reason=left(trim(p_reason),500), atualizado_em=now()
      where id=p_campaign and org_id=p_org;
    return 'disparo_liberado';
  elsif p_action = 'hold_dispatch' then
    update public.campanhas
      set dispatch_enabled=false, atualizado_em=now()
      where id=p_campaign and org_id=p_org;
    return 'disparo_suspenso';
  end if;
  raise exception 'invalid action' using errcode = '22023';
end
$$;

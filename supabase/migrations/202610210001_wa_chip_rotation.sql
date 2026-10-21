-- Rodízio de chips de disparo do WhatsApp (2026-10-21).
--
-- Problema: wa_prepare_campaign prendia TODOS os envios da campanha ao primeiro chip, e
-- wa_reserve_delivery_batch só reservava envios cujo chip estivesse 'conectado'. Um chip que
-- caía ou queimava deixava a fila parada para sempre; contingências autorizadas não eram usadas.
--
-- Agora: a preparação distribui os envios entre os chips de disparo conectados (round-robin) e
-- ignora chips arquivados; a reserva aceita o envio se a org tiver qualquer chip capaz de
-- assumi-lo. A escolha final (contingência → chip original → chip menos usado, com saúde
-- revalidada ao vivo) é feita pelo worker em _shared/whatsapp-chip-rotation.ts.
-- Idempotente: apenas create or replace das duas funções, mesmas assinaturas e permissões.

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
  v_instances uuid[];
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

  -- Rodízio: os envios são distribuídos entre TODOS os chips de disparo conectados (o worker
  -- ainda reescolhe na hora do envio se o chip cair, bater o teto ou houver contingência).
  select array_agg(i.id order by i.ordem, i.criada_em) into v_instances
  from public.wa_instancias i
  where i.org_id = p_org
    and i.deleted_at is null
    and i.funcao = 'disparo'
    and i.status = 'conectado'
    and i.numero is not null;
  if coalesce(array_length(v_instances, 1), 0) = 0 then
    raise exception 'no connected dispatch instance' using errcode = '55000';
  end if;

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
      coalesce(v_campaign.wa_config->>'mensagemPadrao', v_campaign.wa_config#>>'{variacoes,0,texto}', '') as template,
      row_number() over (order by cl.id) as rn
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
      p_actor, p_org, lead_id,
      v_instances[1 + ((rn - 1) % array_length(v_instances, 1))::integer],
      p_campaign, campanha_lead_id,
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
      -- Reserva se a org tem QUALQUER chip capaz de assumir o envio (o worker escolhe e revalida
      -- a saúde ao vivo). Antes, um envio preso a um chip caído nunca mais era reservado.
      and exists (
        select 1 from public.wa_instancias d
        where d.org_id = e.org_id
          and d.deleted_at is null
          and d.numero is not null
          and d.status <> 'queimada'
          and (
            d.funcao = 'disparo'
            or exists (
              select 1 from public.wa_contingencias k
              where k.org_id = e.org_id
                and k.source_instance_id = e.instancia_id
                and k.backup_instance_id = d.id
                and k.status = 'active'
            )
          )
      )
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

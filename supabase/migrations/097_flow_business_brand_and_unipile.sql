-- Flow Business: rebranding global e conexão alternativa do Instagram via Hosted Auth.

update public.config_plataforma
set nome_plataforma = 'Flow Business',
    seo_titulo = case
      when seo_titulo is null or seo_titulo ilike '%Flow Leads%'
        then 'Flow Business — Prospecção e vendas em um só lugar'
      else replace(seo_titulo, 'Flow Leads', 'Flow Business')
    end,
    seo_descricao = case
      when seo_descricao is null or trim(seo_descricao) = ''
        then 'Plataforma de prospecção, relacionamento e vendas com Google Maps, Instagram, CRM e automações.'
      else replace(seo_descricao, 'Flow Leads', 'Flow Business')
    end,
    atualizado_em = now()
where id = true;

alter table public.ig_instancias
  add column if not exists external_account_id text;

alter table public.ig_instancias drop constraint if exists ig_instancias_provider_check;
alter table public.ig_instancias add constraint ig_instancias_provider_check
  check (provider in ('meta_official', 'unipile', 'evolution_legacy'));

create unique index if not exists ig_instancias_external_account_unique
  on public.ig_instancias(org_id, provider, external_account_id)
  where external_account_id is not null;

alter table public.instagram_oauth_states
  add column if not exists provider text not null default 'meta_official';

comment on column public.ig_instancias.external_account_id is
  'Identificador opaco da conta no provedor alternativo; credenciais nunca são armazenadas no Flow Business.';

comment on column public.instagram_oauth_states.provider is
  'Provedor que iniciou o fluxo de conexão, usado para impedir callback cruzado.';

create or replace function public.flow_business_ingest_unipile_message(
  p_account_id text,
  p_chat_id text,
  p_external_message_id text,
  p_sender_id text,
  p_sender_name text,
  p_text text,
  p_direction text,
  p_occurred_at timestamptz,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_instance public.ig_instancias%rowtype;
  v_conversation public.ig_conversas%rowtype;
  v_message_id uuid;
begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required'; end if;
  if nullif(trim(p_chat_id), '') is null or nullif(trim(p_external_message_id), '') is null
    or p_direction not in ('inbound', 'outbound')
  then raise exception 'invalid_event'; end if;

  select * into v_instance
  from public.ig_instancias
  where provider = 'unipile' and external_account_id = p_account_id
  order by connected_at desc nulls last
  limit 1;
  if v_instance.id is null then
    return jsonb_build_object('accepted', false, 'reason', 'account_not_found');
  end if;

  insert into public.ig_conversas(
    org_id, instancia_id, external_contact_id, external_contact_name, source,
    last_message_text, last_message_at, last_inbound_at, unread_count, atualizado_em
  ) values (
    v_instance.org_id, v_instance.id, p_chat_id, nullif(trim(p_sender_name), ''), 'direct',
    p_text, p_occurred_at,
    case when p_direction = 'inbound' then p_occurred_at else null end,
    case when p_direction = 'inbound' then 1 else 0 end,
    now()
  ) on conflict (instancia_id, external_contact_id) do update set
    external_contact_name = coalesce(
      nullif(trim(excluded.external_contact_name), ''),
      ig_conversas.external_contact_name
    ),
    atualizado_em = now()
  returning * into v_conversation;

  insert into public.ig_mensagens(
    org_id, conversa_id, external_message_id, direction, message_type,
    text, timestamp, metadata, delivery_status
  ) values (
    v_instance.org_id, v_conversation.id, p_external_message_id, p_direction, 'text',
    p_text, p_occurred_at,
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('senderId', p_sender_id),
    case when p_direction = 'inbound' then 'received' else 'sent' end
  ) on conflict (external_message_id) do nothing returning id into v_message_id;

  if v_message_id is null then
    return jsonb_build_object(
      'accepted', true, 'duplicate', true, 'conversationId', v_conversation.id
    );
  end if;

  update public.ig_conversas set
    last_message_text = p_text,
    last_message_at = p_occurred_at,
    last_inbound_at = case
      when p_direction = 'inbound' then p_occurred_at else last_inbound_at end,
    last_outbound_at = case
      when p_direction = 'outbound' then p_occurred_at else last_outbound_at end,
    unread_count = unread_count + case when p_direction = 'inbound' then 1 else 0 end,
    atualizado_em = now()
  where id = v_conversation.id;
  update public.ig_instancias
  set last_webhook_at = now(), atualizado_em = now(), error_message = null
  where id = v_instance.id;
  return jsonb_build_object(
    'accepted', true, 'duplicate', false, 'conversationId', v_conversation.id
  );
end;
$$;

revoke all on function public.flow_business_ingest_unipile_message(
  text,text,text,text,text,text,text,timestamptz,jsonb
) from public, anon, authenticated;
grant execute on function public.flow_business_ingest_unipile_message(
  text,text,text,text,text,text,text,timestamptz,jsonb
) to service_role;

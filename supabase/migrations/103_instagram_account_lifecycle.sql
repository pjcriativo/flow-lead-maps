-- Flow Business: ciclo de vida seguro das contas conectadas por sessao.
-- As operacoes ficam atomicas no banco e acessiveis apenas ao gateway service_role.

create or replace function public.flow_business_disconnect_instagram_instance(
  p_instance_id uuid,
  p_org uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider text;
begin
  select provider into v_provider
  from public.ig_instancias
  where id = p_instance_id and org_id = p_org
  for update;

  if not found then
    raise exception 'instagram_account_not_found';
  end if;
  if v_provider <> 'session_worker' then
    raise exception 'instagram_account_provider_not_supported';
  end if;

  update public.instagram_automation_accounts
  set enabled = false,
      consecutive_failures = 0,
      paused_reason = 'account_disconnected',
      lease_owner = null,
      lease_until = null,
      updated_at = now()
  where instance_id = p_instance_id and org_id = p_org;

  update public.instagram_automation_jobs
  set status = 'skipped',
      error_code = 'account_disconnected',
      locked_at = null,
      locked_by = null,
      updated_at = now()
  where instance_id = p_instance_id
    and org_id = p_org
    and status in ('queued', 'processing', 'review');

  delete from public.instagram_connector_sessions
  where instance_id = p_instance_id;

  update public.ig_instancias
  set status = 'desconectado',
      account_type = null,
      connected_at = null,
      error_message = null,
      atualizado_em = now()
  where id = p_instance_id and org_id = p_org;

  return true;
end;
$$;

create or replace function public.flow_business_delete_instagram_instance(
  p_instance_id uuid,
  p_org uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider text;
  v_status text;
begin
  select provider, status into v_provider, v_status
  from public.ig_instancias
  where id = p_instance_id and org_id = p_org
  for update;

  if not found then
    raise exception 'instagram_account_not_found';
  end if;
  if v_provider <> 'session_worker' then
    raise exception 'instagram_account_provider_not_supported';
  end if;
  if v_status = 'conectado' then
    raise exception 'instagram_account_must_be_disconnected';
  end if;

  delete from public.ig_instancias
  where id = p_instance_id and org_id = p_org;

  return true;
end;
$$;

revoke all on function public.flow_business_disconnect_instagram_instance(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.flow_business_delete_instagram_instance(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.flow_business_disconnect_instagram_instance(uuid, uuid)
  to service_role;
grant execute on function public.flow_business_delete_instagram_instance(uuid, uuid)
  to service_role;

comment on function public.flow_business_disconnect_instagram_instance(uuid, uuid) is
  'Desativa automacoes, cancela trabalhos pendentes, apaga a sessao cifrada e preserva o historico da conta.';
comment on function public.flow_business_delete_instagram_instance(uuid, uuid) is
  'Exclui uma conta de sessao ja desconectada ou com falha e seus dados dependentes por cascade.';

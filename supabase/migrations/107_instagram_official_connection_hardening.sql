-- Conexão oficial: reserva atômica de vaga por organização e ciclo de vida
-- aplicável a qualquer tipo de conexão. Evita ultrapassar o plano por abas
-- simultâneas e permite limpar tentativas incompletas.

create index if not exists instagram_oauth_states_capacity_idx
  on public.instagram_oauth_states(org_id, provider, expires_at)
  where used_at is null;

create or replace function public.flow_business_reserve_instagram_oauth_state(
  p_state text,
  p_org uuid,
  p_user uuid,
  p_provider text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer;
  v_unlimited boolean;
  v_accounts integer;
  v_pending integer;
begin
  if auth.role() <> 'service_role' then
    raise exception 'forbidden';
  end if;
  if p_provider not in ('meta_official', 'unipile') then
    raise exception 'invalid_provider';
  end if;

  -- Serializa reservas da mesma organização.
  perform 1 from public.orgs where id = p_org for update;
  if not found then raise exception 'organization_not_found'; end if;

  select public.org_dono_eh_super_admin(p_org), p.limite_flow_business_contas
    into v_unlimited, v_limit
  from public.orgs o
  join public.planos p on p.id = o.plano_id
  where o.id = p_org;
  if v_limit is null then raise exception 'plan_not_found'; end if;

  if not v_unlimited then
    select count(*) into v_accounts from public.ig_instancias where org_id = p_org;
    select count(*) into v_pending
      from public.instagram_oauth_states
      where org_id = p_org
        and provider = p_provider
        and used_at is null
        and expires_at > now();
    if v_accounts + v_pending >= v_limit then
      raise exception 'flow_business_limit:accounts';
    end if;
  end if;

  insert into public.instagram_oauth_states(state, org_id, user_id, provider, redirect_to)
  values (p_state, p_org, p_user, p_provider, '/dashboard?secao=instagram&instagram_view=accounts');
  return true;
end;
$$;

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
  if not found then raise exception 'instagram_account_not_found'; end if;

  update public.instagram_automation_accounts
  set enabled = false, consecutive_failures = 0, paused_reason = 'account_disconnected',
      lease_owner = null, lease_until = null, updated_at = now()
  where instance_id = p_instance_id and org_id = p_org;

  update public.instagram_automation_jobs
  set status = 'skipped', error_code = 'account_disconnected', locked_at = null,
      locked_by = null, updated_at = now()
  where instance_id = p_instance_id and org_id = p_org
    and status in ('queued', 'processing', 'review');

  if v_provider = 'session_worker' then
    delete from public.instagram_connector_sessions where instance_id = p_instance_id;
  end if;
  delete from public.ig_instancia_tokens where instancia_id = p_instance_id;

  update public.ig_instancias
  set status = 'desconectado', account_type = null, permissions = '{}'::text[],
      token_expires_at = null, connected_at = null, error_message = null, atualizado_em = now()
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
  if not found then raise exception 'instagram_account_not_found'; end if;
  if v_status = 'conectado' then raise exception 'instagram_account_must_be_disconnected'; end if;

  if v_provider = 'session_worker' then
    delete from public.instagram_connector_sessions where instance_id = p_instance_id;
  end if;
  delete from public.ig_instancias where id = p_instance_id and org_id = p_org;
  return true;
end;
$$;

revoke all on function public.flow_business_reserve_instagram_oauth_state(text, uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.flow_business_reserve_instagram_oauth_state(text, uuid, uuid, text)
  to service_role;

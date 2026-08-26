-- Suite: ciclo de vida de conta Instagram
-- Invariant: desconectar remove a sessao e para automacoes; excluir remove apenas conta inativa.
-- Boundary IN: funcoes PostgreSQL e relacionamentos da conta de sessao.
-- Boundary OUT: autenticacao HTTP e interface React.

begin;
set local role service_role;

do $$
declare
  v_org uuid;
  v_user uuid;
  v_instance uuid;
  v_result boolean;
begin
  select m.org_id, m.user_id into v_org, v_user
  from public.memberships m
  join public.profiles p on p.id = m.user_id
  where p.is_super_admin = true
  order by m.criada_em
  limit 1;

  if v_org is null or v_user is null then
    raise exception 'test_setup_failed:super_admin_membership';
  end if;

  insert into public.ig_instancias(
    org_id, nome, username_ig, provider, status, account_type, connected_at, connected_by
  ) values (
    v_org,
    'Teste ciclo de vida ' || gen_random_uuid()::text,
    'teste_ciclo_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
    'session_worker',
    'conectado',
    'session',
    now(),
    v_user
  ) returning id into v_instance;

  insert into public.instagram_connector_sessions(
    instance_id, encrypted_settings, settings_version, last_verified_at
  ) values (v_instance, 'test-encrypted-settings', 1, now());

  insert into public.instagram_automation_accounts(instance_id, org_id, enabled)
  values (v_instance, v_org, true);

  begin
    perform public.flow_business_delete_instagram_instance(v_instance, v_org);
    raise exception 'active_instance_was_deleted';
  exception
    when others then
      if sqlerrm not like '%instagram_account_must_be_disconnected%' then
        raise;
      end if;
  end;

  v_result := public.flow_business_disconnect_instagram_instance(v_instance, v_org);
  if v_result is not true then
    raise exception 'disconnect_did_not_return_true';
  end if;
  if exists (
    select 1 from public.instagram_connector_sessions where instance_id = v_instance
  ) then
    raise exception 'disconnect_kept_connector_session';
  end if;
  if not exists (
    select 1 from public.ig_instancias
    where id = v_instance and org_id = v_org and status = 'desconectado'
      and connected_at is null and error_message is null
  ) then
    raise exception 'disconnect_did_not_reset_instance';
  end if;
  if exists (
    select 1 from public.instagram_automation_accounts
    where instance_id = v_instance and enabled = true
  ) then
    raise exception 'disconnect_kept_automation_enabled';
  end if;

  v_result := public.flow_business_delete_instagram_instance(v_instance, v_org);
  if v_result is not true or exists (
    select 1 from public.ig_instancias where id = v_instance
  ) then
    raise exception 'delete_kept_inactive_instance';
  end if;
end;
$$;

rollback;

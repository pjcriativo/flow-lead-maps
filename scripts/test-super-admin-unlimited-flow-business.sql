-- Suite: Super Admin ilimitado no Instagram/Flow Business
-- Invariant: a organizacao do Super Admin nunca recebe bloqueios comerciais de plano.
-- Boundary IN: snapshots e gatilhos PostgreSQL que controlam os recursos do modulo.
-- Boundary OUT: interface React e conectores externos, cobertos pelas suites da aplicacao.

begin;

select set_config(
  'request.jwt.claim.sub',
  (select id::text from public.profiles where is_super_admin = true order by created_at limit 1),
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

do $$
declare
  v_org uuid := public.org_do_usuario(auth.uid());
  v_plan jsonb;
  v_instagram_plan jsonb;
  v_automation jsonb;
  v_instance_id uuid;
begin
  if v_org is null then
    raise exception 'test_setup_failed:super_admin_org';
  end if;

  v_plan := public.flow_business_plan_snapshot(v_org);
  if v_plan->'limits'->'accounts' <> 'null'::jsonb
    or v_plan->'limits'->'crmContacts' <> 'null'::jsonb
    or v_plan->'limits'->'cadences' <> 'null'::jsonb
    or v_plan->'limits'->'flows' <> 'null'::jsonb then
    raise exception 'super_admin_flow_business_limits_are_not_unlimited:%', v_plan->'limits';
  end if;

  v_instagram_plan := public.instagram_plan_status(v_org);
  if coalesce((v_instagram_plan->>'unlimited')::boolean, false) is not true
    or coalesce((v_instagram_plan->'features'->>'overlap')::boolean, false) is not true
    or coalesce((v_instagram_plan->'features'->>'reports')::boolean, false) is not true then
    raise exception 'super_admin_instagram_plan_is_not_unlimited:%', v_instagram_plan;
  end if;

  v_automation := public.flow_business_automation_snapshot();
  if v_automation->'limits'->'monthly' <> 'null'::jsonb
    or v_automation->'limits'->'daily' <> 'null'::jsonb then
    raise exception 'super_admin_automation_limits_are_not_unlimited:%', v_automation->'limits';
  end if;

  insert into public.ig_instancias(org_id, nome, username_ig, provider, status, connected_by)
  values (
    v_org,
    'Teste ilimitado ' || gen_random_uuid()::text,
    'teste_super_admin_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
    'session_worker',
    'aguardando',
    auth.uid()
  ) returning id into v_instance_id;

  if v_instance_id is null then
    raise exception 'super_admin_account_insert_was_blocked';
  end if;
end;
$$;

reset role;
set local role service_role;

do $$
declare
  v_user uuid := current_setting('request.jwt.claim.sub', true)::uuid;
  v_org uuid;
  v_reservation jsonb;
begin
  select org_id into v_org
  from public.memberships
  where user_id = v_user
  order by criada_em
  limit 1;

  v_reservation := public.instagram_reserve_usage(
    v_org,
    v_user,
    'super-admin-unlimited-regression',
    'regression_test',
    1000000,
    1000000,
    1000000,
    1000000,
    1000000,
    1000000,
    1000000,
    1000
  );
  if coalesce((v_reservation->>'ok')::boolean, false) is not true then
    raise exception 'super_admin_usage_reservation_was_blocked:%', v_reservation;
  end if;
end;
$$;

rollback;

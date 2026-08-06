-- Suite: deduplicação permanente de leads por conta
-- Invariant: a mesma organização registra cada estabelecimento apenas uma vez, mesmo com
-- usuários/fonte distintos, exclusão anterior ou atualização direta.
-- Boundary IN: constraints e triggers PostgreSQL de leads/lead_seen_registry.
-- Boundary OUT: busca externa e interface; a transação inteira é revertida ao final.

begin;

do $$
declare
  v_org uuid;
  v_user_a uuid;
  v_user_b uuid;
  v_place_id text := 'prova-dedupe-org:' || pg_backend_pid()::text;
  v_other_place_id text := 'outra-fonte-dedupe-org:' || pg_backend_pid()::text;
  v_update_place_id text := 'update-dedupe-org:' || pg_backend_pid()::text;
  v_count bigint;
begin
  select o.id, o.dono_user_id
  into v_org, v_user_a
  from public.orgs o
  order by o.criada_em
  limit 1;

  select p.id
  into v_user_b
  from public.profiles p
  where p.id <> v_user_a
  order by p.created_at
  limit 1;

  if v_org is null or v_user_a is null or v_user_b is null then
    raise exception 'a prova precisa de uma organização e dois usuários existentes';
  end if;

  insert into public.memberships (org_id, user_id, papel)
  values (v_org, v_user_b, 'vendedor')
  on conflict (org_id, user_id) do nothing;

  insert into public.leads (
    org_id, user_id, assigned_to, place_id, business_name, address, status
  ) values (
    v_org, v_user_a, v_user_a, v_place_id, '[PROVA] Clínica veterinária única',
    'Rua das Flores, 10', 'new'
  );

  insert into public.leads (
    org_id, user_id, assigned_to, place_id, business_name, address, status
  ) values (
    v_org, v_user_b, v_user_b, v_place_id, '[PROVA] Clínica veterinária única',
    'Rua das Flores, 10', 'new'
  )
  on conflict (org_id, place_id) do nothing;

  select count(*)
  into v_count
  from public.leads
  where org_id = v_org and place_id = v_place_id;

  if v_count <> 1 then
    raise exception 'deduplicação por organização falhou: % linhas encontradas', v_count;
  end if;

  insert into public.leads (
    org_id, user_id, assigned_to, place_id, business_name, address, status
  ) values (
    v_org, v_user_b, v_user_b, v_update_place_id, '[PROVA] Outro negócio',
    'Avenida Independente, 20', 'new'
  );

  begin
    update public.leads
    set business_name = '[prova] CLINICA veterinaria unica',
        address = 'RUA DAS FLORES 10'
    where org_id = v_org and place_id = v_update_place_id;

    raise exception 'uma atualização direta criou negócio duplicado';
  exception
    when unique_violation then null;
  end;

  delete from public.leads
  where org_id = v_org and place_id in (v_place_id, v_update_place_id);

  insert into public.leads (
    org_id, user_id, assigned_to, place_id, business_name, address, status
  ) values (
    v_org, v_user_b, v_user_b, v_place_id, '[PROVA] Clínica veterinária única',
    'Rua das Flores, 10', 'new'
  )
  on conflict (org_id, place_id) do nothing;

  select count(*)
  into v_count
  from public.leads
  where org_id = v_org and place_id = v_place_id;

  if v_count <> 0 then
    raise exception 'lead removido reapareceu em uma busca posterior';
  end if;

  insert into public.leads (
    org_id, user_id, assigned_to, place_id, business_name, address, status
  ) values (
    v_org, v_user_b, v_user_b, v_other_place_id, '[prova] CLINICA veterinaria unica',
    'RUA DAS FLORES 10', 'new'
  )
  on conflict (org_id, place_id) do nothing;

  select count(*)
  into v_count
  from public.leads
  where org_id = v_org and place_id in (v_place_id, v_other_place_id);

  if v_count <> 0 then
    raise exception 'o mesmo negócio reapareceu com place_id de outra fonte';
  end if;
end
$$;

rollback;

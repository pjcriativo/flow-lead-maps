-- Exclusão administrativa em lote, limitada a contas pendentes e vazias.
-- Cada usuário roda em uma subtransação: uma falha não deixa aquela conta parcialmente apagada.
create or replace function public.admin_delete_pending_users(
  p_actor_id uuid,
  p_user_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_id uuid;
  target_profile public.profiles%rowtype;
  target_org_id uuid;
  data_count integer;
  deleted_count integer := 0;
  blocked_count integer := 0;
  failed_count integer := 0;
  results jsonb := '[]'::jsonb;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id and is_super_admin = true
  ) then
    raise exception 'Acesso negado';
  end if;

  if coalesce(array_length(p_user_ids, 1), 0) = 0
     or array_length(p_user_ids, 1) > 100 then
    raise exception 'Informe entre 1 e 100 usuários';
  end if;

  for target_id in select distinct unnest(p_user_ids)
  loop
    begin
      select * into target_profile
      from public.profiles
      where id = target_id
      for update;

      if not found then
        blocked_count := blocked_count + 1;
        results := results || jsonb_build_array(jsonb_build_object(
          'user_id', target_id, 'status', 'blocked', 'reason', 'usuario_nao_encontrado'
        ));
        continue;
      end if;

      if target_id = p_actor_id or target_profile.is_super_admin then
        blocked_count := blocked_count + 1;
        results := results || jsonb_build_array(jsonb_build_object(
          'user_id', target_id, 'email', target_profile.email,
          'status', 'blocked', 'reason', 'conta_protegida'
        ));
        continue;
      end if;

      if target_profile.acesso_liberado then
        blocked_count := blocked_count + 1;
        results := results || jsonb_build_array(jsonb_build_object(
          'user_id', target_id, 'email', target_profile.email,
          'status', 'blocked', 'reason', 'conta_com_acesso'
        ));
        continue;
      end if;

      select id into target_org_id
      from public.orgs
      where dono_user_id = target_id
      limit 1;

      select
        (select count(*) from public.leads where user_id = target_id or org_id = target_org_id) +
        (select count(*) from public.api_consumption_logs where user_id = target_id or org_id = target_org_id) +
        (select count(*) from public.wa_instancias where user_id = target_id or org_id = target_org_id) +
        (select count(*) from public.redes_buscas where user_id = target_id or org_id = target_org_id) +
        (select count(*) from public.sites_publicados where user_id = target_id or org_id = target_org_id) +
        (select count(*) from public.campanhas where user_id = target_id or org_id = target_org_id)
      into data_count;

      if data_count > 0 then
        blocked_count := blocked_count + 1;
        results := results || jsonb_build_array(jsonb_build_object(
          'user_id', target_id, 'email', target_profile.email,
          'status', 'blocked', 'reason', 'conta_com_dados', 'records', data_count
        ));
        continue;
      end if;

      delete from public.orgs where dono_user_id = target_id;
      delete from auth.users where id = target_id;
      if not found then
        raise exception 'Usuário não encontrado no Auth';
      end if;

      deleted_count := deleted_count + 1;
      results := results || jsonb_build_array(jsonb_build_object(
        'user_id', target_id, 'email', target_profile.email, 'status', 'deleted'
      ));
    exception when others then
      failed_count := failed_count + 1;
      results := results || jsonb_build_array(jsonb_build_object(
        'user_id', target_id, 'status', 'failed', 'reason', 'falha_deletar',
        'detail', sqlerrm
      ));
    end;
  end loop;

  return jsonb_build_object(
    'ok', failed_count = 0,
    'deleted', deleted_count,
    'blocked', blocked_count,
    'failed', failed_count,
    'results', results
  );
end;
$$;

revoke all on function public.admin_delete_pending_users(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.admin_delete_pending_users(uuid, uuid[]) to service_role;

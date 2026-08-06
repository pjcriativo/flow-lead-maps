-- O plano da UI (profiles.plan) e o plano de billing (orgs.plano_id) não podem divergir.

create or replace function public.plano_id_por_slug(p_plan text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.planos
  where ativo = true
    and case lower(trim(p_plan))
      when 'starter' then lower(nome) in ('básico', 'basico')
      when 'basico' then lower(nome) in ('básico', 'basico')
      when 'pro' then lower(nome) = 'pro'
      when 'agencia' then lower(nome) in ('agência', 'agencia')
      when 'enterprise' then lower(nome) in ('agência', 'agencia')
      else false
    end
  order by ordem
  limit 1
$$;

revoke all on function public.plano_id_por_slug(text) from public, anon, authenticated;
grant execute on function public.plano_id_por_slug(text) to service_role;

create or replace function public.admin_set_user_plan(p_user uuid, p_plan text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_slug text := lower(trim(p_plan));
  v_plan_id uuid;
  v_email text;
begin
  if v_plan_slug not in ('starter', 'basico', 'pro', 'agencia', 'enterprise') then
    return jsonb_build_object('ok', false, 'reason', 'plano_invalido');
  end if;

  v_plan_id := public.plano_id_por_slug(v_plan_slug);
  if v_plan_id is null then
    return jsonb_build_object('ok', false, 'reason', 'plano_catalogo_ausente');
  end if;

  update public.profiles
  set plan = v_plan_slug
  where id = p_user
  returning email into v_email;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'usuario_nao_encontrado');
  end if;

  update public.orgs
  set plano_id = v_plan_id
  where dono_user_id = p_user;

  return jsonb_build_object(
    'ok', true,
    'user_id', p_user,
    'email', v_email,
    'plan', v_plan_slug,
    'plano_id', v_plan_id
  );
end
$$;

revoke all on function public.admin_set_user_plan(uuid, text) from public, anon, authenticated;
grant execute on function public.admin_set_user_plan(uuid, text) to service_role;

-- Backfill das organizações existentes a partir do plano do dono da conta.
update public.orgs o
set plano_id = public.plano_id_por_slug(p.plan)
from public.profiles p
where p.id = o.dono_user_id
  and public.plano_id_por_slug(p.plan) is not null
  and o.plano_id is distinct from public.plano_id_por_slug(p.plan);

create or replace function public.definir_plano_padrao_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.plano_id is null then
    new.plano_id := public.plano_id_por_slug('basico');
  end if;
  return new;
end
$$;

drop trigger if exists trg_definir_plano_padrao_org on public.orgs;
create trigger trg_definir_plano_padrao_org
  before insert on public.orgs
  for each row execute function public.definir_plano_padrao_org();

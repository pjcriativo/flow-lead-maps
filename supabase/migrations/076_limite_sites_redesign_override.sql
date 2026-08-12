-- ═══ BILLING & REDESIGN — Limites de Sites IA, Overrides e Bônus por Org ═══
-- 1. Novas colunas em public.orgs para controle de redesigns de site (sites IA)
-- 2. Atualizar limite_plano() para considerar override e bônus em sites
-- 3. Nova RPC meu_estado_consumo() para consulta atômica do frontend
-- 4. Novas RPCs de admin: admin_set_org_sites_override e admin_set_org_sites_bonus

-- 1. Novas colunas em orgs
alter table public.orgs
  add column if not exists limite_sites_override integer,
  add column if not exists sites_bonus integer not null default 0;

comment on column public.orgs.limite_sites_override is
  'Override individual de limite_sites para esta org. Quando preenchido, prevalece sobre planos.limite_sites.';

comment on column public.orgs.sites_bonus is
  'Tokens/redesigns bônus concedidos manualmente pelo administrador para esta org (somados ao limite base do plano/override).';

-- 2. Atualizar limite_plano()
create or replace function public.limite_plano(p_org uuid, p_recurso text)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_dono uuid;
  v_super boolean;
  v_col text := _col_limite(p_recurso);
  v_lim integer;
  v_override integer;
  v_bonus integer := 0;
begin
  if v_col is null then return null; end if;

  select dono_user_id into v_dono from orgs where id = p_org;
  select coalesce(is_super_admin, false) into v_super from profiles where id = v_dono;
  if v_super then return null; end if; -- Super admin é ilimitado

  -- Recurso: LEADS
  if p_recurso = 'leads' then
    select limite_leads_override into v_override from orgs where id = p_org;
    if v_override is not null then
      return v_override;
    end if;
  end if;

  -- Recurso: SITES (Redesign de Site)
  if p_recurso = 'sites' then
    select limite_sites_override, coalesce(sites_bonus, 0)
      into v_override, v_bonus
      from orgs
     where id = p_org;

    -- Se tiver override individual, usa o override + bônus
    if v_override is not null then
      return v_override + v_bonus;
    end if;

    -- Senão, usa o limite do plano assinado + bônus
    execute format('select %I from planos p join orgs o on o.plano_id = p.id where o.id = $1', v_col)
      into v_lim using p_org;

    if v_lim is null then return null; end if; -- Plano ilimitado
    return v_lim + v_bonus;
  end if;

  -- Fallback para outros recursos (campanhas, etc.)
  execute format('select %I from planos p join orgs o on o.plano_id = p.id where o.id = $1', v_col)
    into v_lim using p_org;
  return v_lim;
end $$;

-- 3. Nova RPC: meu_estado_consumo()
create or replace function public.meu_estado_consumo(p_recurso text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_org uuid;
begin
  if v_user is null then
    return jsonb_build_object('error', 'nao_autenticado');
  end if;

  select org_id into v_org
    from memberships
   where user_id = v_user
   order by criada_em asc
   limit 1;

  if v_org is null then
    select id into v_org from orgs where dono_user_id = v_user limit 1;
  end if;

  if v_org is null then
    return jsonb_build_object('usado', 0, 'limite', null, 'restante', null, 'perto', false);
  end if;

  return public.estado_consumo(v_org, p_recurso);
end $$;

grant execute on function public.meu_estado_consumo(text) to authenticated, service_role;

-- 4. RPC Admin: admin_set_org_sites_override
create or replace function public.admin_set_org_sites_override(
  p_user uuid,
  p_sites integer -- null = remover override (volta ao limite do plano)
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_email text;
begin
  select id into v_org_id from public.orgs where dono_user_id = p_user;
  if v_org_id is null then
    return jsonb_build_object('ok', false, 'reason', 'org_nao_encontrada');
  end if;

  select email into v_email from public.profiles where id = p_user;

  update public.orgs
  set limite_sites_override = p_sites
  where id = v_org_id;

  return jsonb_build_object(
    'ok', true,
    'user_id', p_user,
    'email', v_email,
    'org_id', v_org_id,
    'limite_sites_override', p_sites
  );
end
$$;

revoke all on function public.admin_set_org_sites_override(uuid, integer) from public, anon, authenticated;
grant execute on function public.admin_set_org_sites_override(uuid, integer) to service_role;

-- 5. RPC Admin: admin_set_org_sites_bonus
create or replace function public.admin_set_org_sites_bonus(
  p_user uuid,
  p_bonus integer -- valor >= 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_email text;
  v_b integer := greatest(0, coalesce(p_bonus, 0));
begin
  select id into v_org_id from public.orgs where dono_user_id = p_user;
  if v_org_id is null then
    return jsonb_build_object('ok', false, 'reason', 'org_nao_encontrada');
  end if;

  select email into v_email from public.profiles where id = p_user;

  update public.orgs
  set sites_bonus = v_b
  where id = v_org_id;

  return jsonb_build_object(
    'ok', true,
    'user_id', p_user,
    'email', v_email,
    'org_id', v_org_id,
    'sites_bonus', v_b
  );
end
$$;

revoke all on function public.admin_set_org_sites_bonus(uuid, integer) from public, anon, authenticated;
grant execute on function public.admin_set_org_sites_bonus(uuid, integer) to service_role;

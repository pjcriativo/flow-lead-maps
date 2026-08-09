-- ═══ PLANOS — conectar catálogo real ao admin de usuários ═══
-- 1. Coluna de override de limite de leads por org (ex: upgrade pontual sem mudar o plano)
-- 2. limite_plano() respeita o override quando presente
-- 3. admin_set_user_plan aceita plano_id UUID diretamente (além do slug)
-- 4. Nova RPC admin_set_org_leads_override para o admin setar override por conta

-- 1. Override de limite de leads por org
alter table public.orgs
  add column if not exists limite_leads_override integer;

comment on column public.orgs.limite_leads_override is
  'Override individual de limite_leads para esta org. Quando preenchido, prevalece sobre planos.limite_leads.';

-- 2. Atualizar limite_plano() para checar override primeiro (apenas para recurso leads)
create or replace function limite_plano(p_org uuid, p_recurso text)
returns integer language plpgsql stable security definer set search_path = public as $$
declare
  v_dono uuid;
  v_super boolean;
  v_col text := _col_limite(p_recurso);
  v_lim integer;
  v_override integer;
begin
  if v_col is null then return null; end if;

  select dono_user_id into v_dono from orgs where id = p_org;
  select coalesce(is_super_admin, false) into v_super from profiles where id = v_dono;
  if v_super then return null; end if;

  -- Override individual tem prioridade para leads
  if p_recurso = 'leads' then
    select limite_leads_override into v_override from orgs where id = p_org;
    if v_override is not null then
      return v_override;
    end if;
  end if;

  -- Fallback: limite do plano
  execute format('select %I from planos p join orgs o on o.plano_id = p.id where o.id = $1', v_col)
    into v_lim using p_org;
  return v_lim;
end $$;

-- 3. Atualizar admin_set_user_plan para aceitar UUID diretamente
-- Agora aceita p_plan (slug, mantido para compatibilidade) OU p_plano_id (UUID do catálogo)
create or replace function public.admin_set_user_plan(
  p_user uuid,
  p_plan text default null,
  p_plano_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_slug text;
  v_plan_id uuid;
  v_email text;
  v_plan_nome text;
begin
  -- Resolver o plano_id final
  if p_plano_id is not null then
    -- UUID direto: valida que existe e está ativo
    select id, nome, lower(nome) into v_plan_id, v_plan_nome, v_plan_slug
    from public.planos
    where id = p_plano_id and ativo = true;

    if v_plan_id is null then
      return jsonb_build_object('ok', false, 'reason', 'plano_catalogo_ausente');
    end if;

    -- Derivar slug a partir do nome (para profiles.plan — campo legado)
    v_plan_slug := case lower(trim(v_plan_nome))
      when 'básico' then 'basico'
      when 'basico' then 'basico'
      when 'pro'    then 'pro'
      when 'agência' then 'agencia'
      when 'agencia' then 'agencia'
      else lower(trim(v_plan_nome))
    end;

  elsif p_plan is not null then
    -- Slug legado: resolve pelo mapeamento anterior
    v_plan_slug := lower(trim(p_plan));
    if v_plan_slug not in ('starter', 'basico', 'pro', 'agencia', 'enterprise') then
      return jsonb_build_object('ok', false, 'reason', 'plano_invalido');
    end if;
    v_plan_id := public.plano_id_por_slug(v_plan_slug);
    if v_plan_id is null then
      return jsonb_build_object('ok', false, 'reason', 'plano_catalogo_ausente');
    end if;

  else
    return jsonb_build_object('ok', false, 'reason', 'plano_nao_informado');
  end if;

  -- Atualizar profiles (slug legado) + orgs (plano_id real)
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

revoke all on function public.admin_set_user_plan(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.admin_set_user_plan(uuid, text, uuid) to service_role;

-- 4. Nova RPC: admin define override de leads por conta
create or replace function public.admin_set_org_leads_override(
  p_user uuid,
  p_leads integer  -- null = remover override (volta ao plano)
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
  set limite_leads_override = p_leads
  where id = v_org_id;

  return jsonb_build_object(
    'ok', true,
    'user_id', p_user,
    'email', v_email,
    'org_id', v_org_id,
    'limite_leads_override', p_leads
  );
end
$$;

revoke all on function public.admin_set_org_leads_override(uuid, integer) from public, anon, authenticated;
grant execute on function public.admin_set_org_leads_override(uuid, integer) to service_role;

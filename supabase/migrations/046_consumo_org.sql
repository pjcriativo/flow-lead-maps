-- ═══ BILLING — CAMADA 2: MEDIÇÃO + APLICAÇÃO DE USO POR ORG ═══
-- Conta o consumo POR ORG, POR MÊS, e aplica o limite do plano. Mesmo padrão do teto de gasto
-- (redes-teto.ts): checa ANTES de deixar consumir; se estourou, bloqueia com dado pra explicar.
-- Reset mensal = a linha é por (org, mes_ref); mês novo = contador zerado naturalmente.
-- SUPER_ADMIN (dono da plataforma) NÃO tem limite.

create table if not exists consumo_org (
  org_id uuid not null references orgs(id) on delete cascade,
  mes_ref text not null,                 -- 'YYYY-MM' (UTC)
  leads integer not null default 0,      -- leads coletados no mês
  sites integer not null default 0,      -- sites gerados por IA no mês
  campanhas integer not null default 0,  -- campanhas criadas no mês
  mensagens integer not null default 0,  -- mensagens de WhatsApp enviadas no mês
  atualizado_em timestamptz not null default now(),
  primary key (org_id, mes_ref)
);
comment on table consumo_org is 'Contadores de consumo por org e mês. O limite vem do plano (planos.limite_*).';

alter table consumo_org enable row level security;
drop policy if exists consumo_org_sel on consumo_org;
create policy consumo_org_sel on consumo_org for select
  using (eh_super_admin() or pertence_a_org(org_id));

-- recurso → coluna de consumo e de limite (fonte única do mapeamento)
create or replace function _col_consumo(p_recurso text) returns text language sql immutable as $$
  select case p_recurso
    when 'leads' then 'leads' when 'sites' then 'sites'
    when 'campanhas' then 'campanhas' when 'mensagens' then 'mensagens' else null end
$$;
create or replace function _col_limite(p_recurso text) returns text language sql immutable as $$
  select case p_recurso
    when 'leads' then 'limite_leads' when 'sites' then 'limite_sites'
    when 'campanhas' then 'limite_campanhas' when 'mensagens' then null else null end
$$;

-- limite do plano da org para um recurso (null = ilimitado; super_admin sempre ilimitado)
create or replace function limite_plano(p_org uuid, p_recurso text)
returns integer language plpgsql stable security definer set search_path = public as $$
declare
  v_dono uuid;
  v_super boolean;
  v_col text := _col_limite(p_recurso);
  v_lim integer;
begin
  if v_col is null then return null; end if; -- recurso sem limite no plano (ex.: mensagens hoje)
  select dono_user_id into v_dono from orgs where id = p_org;
  select coalesce(is_super_admin, false) into v_super from profiles where id = v_dono;
  if v_super then return null; end if; -- dono da plataforma não tem teto
  execute format('select %I from planos p join orgs o on o.plano_id = p.id where o.id = $1', v_col)
    into v_lim using p_org;
  return v_lim;
end $$;

-- ANTES + DEPOIS num passo atômico: se caberia, INCREMENTA e devolve ok=true; se estouraria,
-- NÃO incrementa e devolve ok=false com o número pra explicar. Nunca estoura calado.
create or replace function consumir_ou_bloquear(p_org uuid, p_recurso text, p_n integer default 1)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_mes text := to_char(now() at time zone 'utc', 'YYYY-MM');
  v_col text := _col_consumo(p_recurso);
  v_lim integer := limite_plano(p_org, p_recurso);
  v_usado integer;
begin
  if v_col is null then
    return jsonb_build_object('ok', false, 'reason', 'recurso_invalido');
  end if;
  -- consumo atual do mês (0 se não há linha)
  execute format('select coalesce((select %I from consumo_org where org_id=$1 and mes_ref=$2),0)', v_col)
    into v_usado using p_org, v_mes;

  -- limite null = ilimitado → sempre deixa, mas ainda CONTA (para o painel mostrar uso)
  if v_lim is not null and v_usado + p_n > v_lim then
    return jsonb_build_object(
      'ok', false, 'reason', 'limite_atingido',
      'recurso', p_recurso, 'usado', v_usado, 'limite', v_lim, 'restante', greatest(0, v_lim - v_usado));
  end if;

  -- incrementa (upsert por org+mês)
  execute format(
    'insert into consumo_org (org_id, mes_ref, %I, atualizado_em) values ($1,$2,$3, now())
     on conflict (org_id, mes_ref) do update set %I = consumo_org.%I + $3, atualizado_em = now()',
    v_col, v_col, v_col) using p_org, v_mes, p_n;

  return jsonb_build_object(
    'ok', true, 'recurso', p_recurso, 'usado', v_usado + p_n, 'limite', v_lim,
    'restante', case when v_lim is null then null else greatest(0, v_lim - (v_usado + p_n)) end,
    'perto', v_lim is not null and (v_usado + p_n) >= (0.8 * v_lim));
end $$;

-- só LER o estado (sem consumir) — para o aviso de 80% e telas
create or replace function estado_consumo(p_org uuid, p_recurso text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_mes text := to_char(now() at time zone 'utc', 'YYYY-MM');
  v_col text := _col_consumo(p_recurso);
  v_lim integer := limite_plano(p_org, p_recurso);
  v_usado integer;
begin
  execute format('select coalesce((select %I from consumo_org where org_id=$1 and mes_ref=$2),0)', v_col)
    into v_usado using p_org, v_mes;
  return jsonb_build_object('usado', v_usado, 'limite', v_lim,
    'restante', case when v_lim is null then null else greatest(0, v_lim - v_usado) end,
    'perto', v_lim is not null and v_usado >= (0.8 * v_lim));
end $$;

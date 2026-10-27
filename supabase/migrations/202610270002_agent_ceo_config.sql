-- CONFIGURAÇÃO DO CEO DE IA (Prompt 29) — PREPARADA, NÃO APLICADA EM PRODUÇÃO.
-- Incremental sobre 202610270001_agent_foundation.sql (aplicar SOMENTE depois dela).
-- Aplicar só com autorização explícita do dono. Idempotente.
--
-- O que adiciona:
--  1) Campos de identidade em agents (cargo, departamento, descrição, especialidade, avatar).
--  2) agent_configurar_ceo: UMA transação humana que cria/atualiza identidade, modelo, limites e
--     as ferramentas concedidas (somente leitura). Não ativa o agente.
--  3) agent_definir_estado endurecida: ativar exige ferramenta concedida, identidade salva e
--     kill-switch desligado — nunca um CEO "ativo" sem configuração.
--  4) agent_consumo_org: consumo do dia/mês visível ao gestor (a RPC do runtime segue restrita).
-- A governança continua exclusiva de sessão humana (agent_exigir_humano) e do trigger de guarda.

alter table public.agents add column if not exists cargo text;
alter table public.agents add column if not exists departamento text;
alter table public.agents add column if not exists descricao text;
alter table public.agents add column if not exists especialidade text;
alter table public.agents add column if not exists avatar_url text;

alter table public.agents drop constraint if exists agents_identidade_check;
alter table public.agents add constraint agents_identidade_check check (
  (cargo is null or length(btrim(cargo)) between 1 and 80)
  and (departamento is null or length(btrim(departamento)) between 1 and 80)
  and (descricao is null or length(descricao) <= 500)
  and (especialidade is null or length(btrim(especialidade)) between 1 and 120)
  and (avatar_url is null or avatar_url ~ '^https://images\.unsplash\.com/[A-Za-z0-9._~/?=&%-]{1,250}$')
);

-- ───────────────────────────── configuração atômica (humano) ─────────────────────────────
create or replace function public.agent_configurar_ceo(
  p_org uuid, p_nome text, p_cargo text, p_departamento text, p_descricao text,
  p_especialidade text, p_avatar_url text, p_modelo text,
  p_teto_dia numeric, p_teto_mes numeric, p_ferramentas text[]
) returns public.agents language plpgsql security definer set search_path = public as $$
declare
  v_user uuid;
  v_agent public.agents;
  v_tool text;
  v_risco text;
  v_modelos constant text[] := array['claude-haiku-4-5', 'claude-sonnet-4-5', 'claude-sonnet-5', 'claude-opus-4-7', 'claude-opus-4-8'];
begin
  v_user := public.agent_exigir_humano(p_org);
  if p_modelo is null or not (p_modelo = any (v_modelos)) then
    raise exception 'modelo_nao_permitido' using errcode = '22023';
  end if;
  if p_teto_dia is null or p_teto_mes is null or p_teto_dia < 0 or p_teto_mes < 0 or p_teto_dia > p_teto_mes then
    raise exception 'limites_incoerentes' using errcode = '22023';
  end if;
  if p_nome is null or length(btrim(p_nome)) not between 1 and 80 then
    raise exception 'nome_invalido' using errcode = '22023';
  end if;
  for v_tool in select unnest(coalesce(p_ferramentas, '{}')) loop
    select risco into v_risco from public.agent_tools where nome = v_tool and ativo;
    if v_risco is null then raise exception 'ferramenta_inexistente_ou_inativa' using errcode = '22023'; end if;
    if v_risco <> 'read' then raise exception 'ferramenta_acima_da_autonomia' using errcode = '42501'; end if;
  end loop;

  perform set_config('flow.agent_governanca', 'on', true);
  insert into public.agents (org_id, slug, nome, papel, criado_por)
  values (p_org, 'ceo', btrim(p_nome), 'ceo', v_user)
  on conflict (org_id, slug) do nothing;

  select * into v_agent from public.agents where org_id = p_org and slug = 'ceo' for update;
  if v_agent.estado = 'ativo' and coalesce(array_length(p_ferramentas, 1), 0) = 0 then
    raise exception 'ceo_ativo_exige_ferramenta' using errcode = '22023';
  end if;

  update public.agents
  set nome = btrim(p_nome), cargo = nullif(btrim(p_cargo), ''), departamento = nullif(btrim(p_departamento), ''),
      descricao = nullif(btrim(p_descricao), ''), especialidade = nullif(btrim(p_especialidade), ''),
      avatar_url = nullif(btrim(p_avatar_url), ''), modelo = p_modelo,
      teto_usd_dia = p_teto_dia, teto_usd_mes = p_teto_mes, atualizado_em = now()
  where id = v_agent.id;   -- CHECKs de coluna impõem tetos absolutos (US$5/dia, US$50/mês) e formato

  update public.agent_permissions set ativo = false
  where agent_id = v_agent.id and not (tool_nome = any (coalesce(p_ferramentas, '{}')));
  for v_tool in select unnest(coalesce(p_ferramentas, '{}')) loop
    insert into public.agent_permissions (org_id, agent_id, tool_nome, ativo, concedida_por)
    values (p_org, v_agent.id, v_tool, true, v_user)
    on conflict (agent_id, tool_nome) do update set ativo = true, concedida_por = v_user, concedida_em = now();
  end loop;

  select * into v_agent from public.agents where id = v_agent.id;
  return v_agent;
end
$$;

-- ───────────────────────────── ativação endurecida ─────────────────────────────
create or replace function public.agent_definir_estado(p_agent uuid, p_estado text)
returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_agent public.agents;
begin
  if p_estado not in ('inativo', 'ativo', 'pausado') then
    raise exception 'estado_invalido' using errcode = '22023';
  end if;
  select * into v_agent from public.agents where id = p_agent;
  v_org := v_agent.org_id;
  if v_org is null then raise exception 'agente_inexistente' using errcode = '22023'; end if;
  perform public.agent_exigir_humano(v_org);
  if p_estado = 'ativo' then
    if v_agent.kill_switch then raise exception 'kill_switch_ligado' using errcode = '22023'; end if;
    if v_agent.cargo is null then raise exception 'ceo_sem_identidade' using errcode = '22023'; end if;
    if not exists (select 1 from public.agent_permissions where agent_id = p_agent and ativo) then
      raise exception 'ceo_sem_ferramenta' using errcode = '22023';
    end if;
  end if;
  perform set_config('flow.agent_governanca', 'on', true);
  update public.agents set estado = p_estado, atualizado_em = now() where id = p_agent;
end
$$;

-- ───────────────────────────── consumo visível ao gestor ─────────────────────────────
create or replace function public.agent_consumo_org(p_org uuid)
returns table (usd_dia numeric, usd_mes numeric) language plpgsql stable security definer set search_path = public as $$
begin
  perform public.agent_exigir_humano(p_org);
  return query
  select
    coalesce(sum(r.custo_usd) filter (where r.iniciado_em >= date_trunc('day', now())), 0),
    coalesce(sum(r.custo_usd) filter (where r.iniciado_em >= date_trunc('month', now())), 0)
  from public.agent_runs r where r.org_id = p_org;
end
$$;

revoke all on function public.agent_configurar_ceo(uuid, text, text, text, text, text, text, text, numeric, numeric, text[]),
  public.agent_consumo_org(uuid) from public, anon;
grant execute on function public.agent_configurar_ceo(uuid, text, text, text, text, text, text, text, numeric, numeric, text[]),
  public.agent_consumo_org(uuid) to authenticated;

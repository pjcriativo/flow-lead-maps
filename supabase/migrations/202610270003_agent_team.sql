-- EQUIPE COMERCIAL DE IA (Prompt 37) — PREPARADA, NÃO APLICADA EM PRODUÇÃO.
-- Incremental sobre 001 e 002 (já aplicadas). Aplicar só com autorização explícita. Idempotente.
--
-- Hierarquia: humano → CEO → Gerente Comercial → especialistas (Prospecção, SDR, Vendedor,
-- Estrategista, SEO Geral). Reutiliza as sete tabelas; nada é recriado.
--  1) agents: 7 papéis, reports_to (hierarquia imutável), autonomia 'interna_supervisionada'
--     (só CEO/Gerente; permite ferramentas write_internal, NUNCA envio externo nem gasto).
--  2) Matrizes papel→ferramentas e papel→tipos de tarefa no banco (fonte única).
--  3) Proposta de equipe: o CEO PROPÕE (agent_approvals); o HUMANO aprova e o banco cria os agentes
--     INATIVOS com permissões padrão do papel. O CEO não cria agente nem concede permissão.
--  4) Delegação: agent_delegar_tarefa só para subordinado DIRETO, ativo, com tipo permitido ao papel.
--  5) Ferramentas reais de LEITURA (RPCs security definer que derivam a org do agente e validam
--     estado/kill-switch/permissão dentro do SQL) — sem SQL livre, sem acesso a tabela arbitrária.
-- Nenhuma ferramenta envia mensagem, executa busca paga, publica ou altera contrato.

-- ───────────────────────────── 1) papéis, hierarquia, autonomia ─────────────────────────────
alter table public.agents drop constraint if exists agents_papel_check;
alter table public.agents add constraint agents_papel_check check (
  papel in ('ceo', 'gerente_comercial', 'prospeccao', 'sdr', 'vendedor', 'estrategista', 'seo_geral'));

alter table public.agents drop constraint if exists agents_autonomia_check;
alter table public.agents add constraint agents_autonomia_check check (autonomia in ('somente_leitura', 'interna_supervisionada'));

alter table public.agents add column if not exists reports_to uuid;
alter table public.agents drop constraint if exists agents_reports_to_fkey;
alter table public.agents add constraint agents_reports_to_fkey
  foreign key (reports_to, org_id) references public.agents(id, org_id);
alter table public.agents drop constraint if exists agents_hierarquia_check;
alter table public.agents add constraint agents_hierarquia_check check ((papel = 'ceo') = (reports_to is null));
alter table public.agents drop constraint if exists agents_autonomia_papel_check;
alter table public.agents add constraint agents_autonomia_papel_check check (
  autonomia = 'somente_leitura' or papel in ('ceo', 'gerente_comercial'));

create or replace function public.agent_hierarquia_guard()
returns trigger language plpgsql set search_path = public as $$
declare v_pai text;
begin
  if tg_op = 'UPDATE' then
    if new.papel <> old.papel or new.reports_to is distinct from old.reports_to or new.org_id <> old.org_id then
      raise exception 'hierarquia_imutavel' using errcode = '42501';
    end if;
    return new;
  end if;
  if new.papel = 'ceo' then return new; end if;
  select papel into v_pai from public.agents where id = new.reports_to and org_id = new.org_id;
  if new.papel = 'gerente_comercial' and v_pai is distinct from 'ceo' then
    raise exception 'hierarquia_invalida_gerente_reporta_ao_ceo' using errcode = '22023';
  end if;
  if new.papel <> 'gerente_comercial' and v_pai is distinct from 'gerente_comercial' then
    raise exception 'hierarquia_invalida_especialista_reporta_ao_gerente' using errcode = '22023';
  end if;
  return new;
end
$$;
drop trigger if exists agent_hierarquia on public.agents;
create trigger agent_hierarquia before insert or update on public.agents
  for each row execute function public.agent_hierarquia_guard();

-- ───────────────────────────── 2) matrizes do papel (fonte única) ─────────────────────────────
create or replace function public.agent_ferramentas_do_papel(p_papel text)
returns text[] language sql immutable as $$
  select case p_papel
    when 'ceo' then array['consultar_resumo_comercial', 'consultar_pipeline', 'consultar_oportunidades',
                          'consultar_execucoes_equipe', 'delegar_tarefa', 'propor_estrutura_equipe']
    when 'gerente_comercial' then array['consultar_resumo_comercial', 'consultar_pipeline', 'consultar_oportunidades',
                                        'consultar_lead', 'consultar_execucoes_equipe', 'delegar_tarefa']
    when 'prospeccao' then array['consultar_resumo_comercial', 'consultar_oportunidades']
    when 'sdr' then array['consultar_oportunidades', 'consultar_lead']
    when 'vendedor' then array['consultar_oportunidades', 'consultar_lead', 'consultar_pipeline']
    when 'estrategista' then array['consultar_resumo_comercial', 'consultar_pipeline']
    when 'seo_geral' then array['consultar_resumo_comercial']
    else array[]::text[] end
$$;

create or replace function public.agent_tipos_do_papel(p_papel text)
returns text[] language sql immutable as $$
  select case p_papel
    when 'ceo' then array['copiloto_conversa', 'analise_comercial']
    when 'gerente_comercial' then array['analise_comercial', 'priorizar_oportunidades', 'supervisao_comercial']
    when 'prospeccao' then array['plano_prospeccao']
    when 'sdr' then array['preparar_abordagem']
    when 'vendedor' then array['preparar_proposta']
    when 'estrategista' then array['plano_estrategia']
    when 'seo_geral' then array['plano_seo']
    else array[]::text[] end
$$;

create or replace function public.agent_modelos_permitidos()
returns text[] language sql immutable as $$
  select array['claude-haiku-4-5', 'claude-sonnet-4-5', 'claude-sonnet-5', 'claude-opus-4-7', 'claude-opus-4-8']
$$;

create or replace function public.agent_defaults_do_papel(p_papel text)
returns jsonb language sql immutable as $$
  select jsonb_build_object(
    'ceo', jsonb_build_object('nome', 'CEO de IA', 'cargo', 'Diretor Comercial de IA', 'departamento', 'Comercial', 'especialidade', 'Orquestração comercial'),
    'gerente_comercial', jsonb_build_object('nome', 'Gerente Comercial', 'cargo', 'Gerente Comercial de IA', 'departamento', 'Comercial', 'especialidade', 'Supervisão de pipeline e metas'),
    'prospeccao', jsonb_build_object('nome', 'Agente de Prospecção', 'cargo', 'Analista de Prospecção', 'departamento', 'Prospecção', 'especialidade', 'Descoberta e organização de leads'),
    'sdr', jsonb_build_object('nome', 'Agente SDR', 'cargo', 'Representante de Desenvolvimento', 'departamento', 'Pré-vendas', 'especialidade', 'Qualificação e abordagens'),
    'vendedor', jsonb_build_object('nome', 'Agente Vendedor', 'cargo', 'Executivo de Vendas', 'departamento', 'Vendas', 'especialidade', 'Oportunidades e propostas'),
    'estrategista', jsonb_build_object('nome', 'Agente Estrategista', 'cargo', 'Estrategista Comercial', 'departamento', 'Estratégia', 'especialidade', 'Planejamento comercial'),
    'seo_geral', jsonb_build_object('nome', 'Agente SEO Geral', 'cargo', 'Analista de SEO', 'departamento', 'Marketing', 'especialidade', 'Crescimento orgânico')
  ) -> p_papel
$$;

-- ───────────────────────────── 3) tarefas: tipos e delegação ─────────────────────────────
alter table public.agent_tasks drop constraint if exists agent_tasks_tipo_check;
alter table public.agent_tasks add constraint agent_tasks_tipo_check check (tipo in (
  'copiloto_conversa', 'analise_comercial', 'priorizar_oportunidades', 'supervisao_comercial',
  'plano_prospeccao', 'preparar_abordagem', 'preparar_proposta', 'plano_estrategia', 'plano_seo'));
alter table public.agent_tasks add column if not exists parent_task_id uuid;
alter table public.agent_tasks add column if not exists delegado_por uuid;
alter table public.agent_tasks drop constraint if exists agent_tasks_parent_fkey;
alter table public.agent_tasks add constraint agent_tasks_parent_fkey
  foreign key (parent_task_id, org_id) references public.agent_tasks(id, org_id);
alter table public.agent_tasks drop constraint if exists agent_tasks_delegado_por_fkey;
alter table public.agent_tasks add constraint agent_tasks_delegado_por_fkey
  foreign key (delegado_por, org_id) references public.agents(id, org_id);
create index if not exists agent_tasks_delegacao_idx on public.agent_tasks (agent_id, status) where delegado_por is not null;

-- ───────────────────────────── 4) catálogo de ferramentas ─────────────────────────────
do $$
begin
  perform set_config('flow.agent_governanca', 'on', true);
  insert into public.agent_tools (nome, descricao, risco) values
    ('consultar_pipeline', 'Etapas do pipeline com total, score médio e leads parados (sem atualização há 14 dias). Somente leitura.', 'read'),
    ('consultar_oportunidades', 'Lista as melhores oportunidades da organização (score >= 70, novas ou enriquecidas, com contato), sem telefone nem e-mail. Somente leitura.', 'read'),
    ('consultar_lead', 'Ficha de UM lead da organização (negócio, categoria, cidade, nota, presença digital, score e consentimento), sem telefone nem e-mail. Somente leitura.', 'read'),
    ('consultar_execucoes_equipe', 'Execuções, erros, custos e fila dos agentes da organização nos últimos 7 dias. Somente leitura.', 'read'),
    ('delegar_tarefa', 'Cria uma tarefa INTERNA para um subordinado direto ativo (tipo permitido ao papel dele). Não envia nada externo.', 'write_internal'),
    ('propor_estrutura_equipe', 'Cria uma PROPOSTA de equipe para aprovação humana. Não cria agentes nem concede permissões.', 'write_internal')
  on conflict (nome) do nothing;
end $$;

-- ───────────────────────────── 5) governança humana (recriadas/novas) ─────────────────────────────
-- Concessão: ferramenta tem de pertencer ao papel; write_internal exige autonomia interna supervisionada.
create or replace function public.agent_conceder_permissao(p_agent uuid, p_tool text)
returns void language plpgsql security definer set search_path = public as $$
declare v_agent public.agents; v_risco text; v_user uuid;
begin
  select * into v_agent from public.agents where id = p_agent;
  if v_agent.id is null then raise exception 'agente_inexistente' using errcode = '22023'; end if;
  v_user := public.agent_exigir_humano(v_agent.org_id);
  select risco into v_risco from public.agent_tools where nome = p_tool and ativo;
  if v_risco is null then raise exception 'ferramenta_inexistente_ou_inativa' using errcode = '22023'; end if;
  if not (p_tool = any (public.agent_ferramentas_do_papel(v_agent.papel))) then
    raise exception 'ferramenta_fora_do_papel' using errcode = '42501';
  end if;
  if v_risco = 'write_internal' then
    if v_agent.autonomia <> 'interna_supervisionada' then raise exception 'ferramenta_acima_da_autonomia' using errcode = '42501'; end if;
  elsif v_risco <> 'read' then
    raise exception 'ferramenta_acima_da_autonomia' using errcode = '42501';
  end if;
  perform set_config('flow.agent_governanca', 'on', true);
  insert into public.agent_permissions (org_id, agent_id, tool_nome, ativo, concedida_por)
  values (v_agent.org_id, p_agent, p_tool, true, v_user)
  on conflict (agent_id, tool_nome) do update set ativo = true, concedida_por = v_user, concedida_em = now();
end
$$;

-- Limites: agora valida o modelo contra a lista do backend.
create or replace function public.agent_definir_limites(
  p_agent uuid, p_teto_dia numeric, p_teto_mes numeric, p_max_passos integer, p_modelo text default null
) returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  select org_id into v_org from public.agents where id = p_agent;
  if v_org is null then raise exception 'agente_inexistente' using errcode = '22023'; end if;
  perform public.agent_exigir_humano(v_org);
  if p_modelo is not null and btrim(p_modelo) <> '' and not (btrim(p_modelo) = any (public.agent_modelos_permitidos())) then
    raise exception 'modelo_nao_permitido' using errcode = '22023';
  end if;
  if p_teto_dia is null or p_teto_mes is null or p_teto_dia > p_teto_mes then
    raise exception 'limites_incoerentes' using errcode = '22023';
  end if;
  perform set_config('flow.agent_governanca', 'on', true);
  update public.agents
  set teto_usd_dia = p_teto_dia, teto_usd_mes = p_teto_mes, max_passos = p_max_passos,
      modelo = coalesce(nullif(btrim(p_modelo), ''), modelo), atualizado_em = now()
  where id = p_agent;
end
$$;

-- Ativação: como na 002 e, para subordinados, o superior precisa estar ativo (cadeia de comando).
create or replace function public.agent_definir_estado(p_agent uuid, p_estado text)
returns void language plpgsql security definer set search_path = public as $$
declare v_agent public.agents; v_pai_estado text;
begin
  if p_estado not in ('inativo', 'ativo', 'pausado') then
    raise exception 'estado_invalido' using errcode = '22023';
  end if;
  select * into v_agent from public.agents where id = p_agent;
  if v_agent.id is null then raise exception 'agente_inexistente' using errcode = '22023'; end if;
  perform public.agent_exigir_humano(v_agent.org_id);
  if p_estado = 'ativo' then
    if v_agent.kill_switch then raise exception 'kill_switch_ligado' using errcode = '22023'; end if;
    if v_agent.cargo is null then raise exception 'ceo_sem_identidade' using errcode = '22023'; end if;
    if not exists (select 1 from public.agent_permissions where agent_id = p_agent and ativo) then
      raise exception 'ceo_sem_ferramenta' using errcode = '22023';
    end if;
    if v_agent.reports_to is not null then
      select estado into v_pai_estado from public.agents where id = v_agent.reports_to;
      if v_pai_estado is distinct from 'ativo' then raise exception 'superior_inativo' using errcode = '22023'; end if;
    end if;
  end if;
  perform set_config('flow.agent_governanca', 'on', true);
  update public.agents set estado = p_estado, atualizado_em = now() where id = p_agent;
end
$$;

-- Configuração do CEO (002) preservando as ferramentas de delegação/proposta ao reconfigurar.
create or replace function public.agent_configurar_ceo(
  p_org uuid, p_nome text, p_cargo text, p_departamento text, p_descricao text,
  p_especialidade text, p_avatar_url text, p_modelo text,
  p_teto_dia numeric, p_teto_mes numeric, p_ferramentas text[]
) returns public.agents language plpgsql security definer set search_path = public as $$
declare
  v_user uuid; v_agent public.agents; v_tool text; v_risco text;
begin
  v_user := public.agent_exigir_humano(p_org);
  if p_modelo is null or not (p_modelo = any (public.agent_modelos_permitidos())) then
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
    if not (v_tool = any (public.agent_ferramentas_do_papel('ceo'))) then raise exception 'ferramenta_fora_do_papel' using errcode = '42501'; end if;
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
  where id = v_agent.id;

  -- só mexe nas permissões de LEITURA; delegar_tarefa/propor_estrutura_equipe têm RPC própria.
  update public.agent_permissions set ativo = false
  where agent_id = v_agent.id and not (tool_nome = any (coalesce(p_ferramentas, '{}')))
    and tool_nome in (select nome from public.agent_tools where risco = 'read');
  for v_tool in select unnest(coalesce(p_ferramentas, '{}')) loop
    insert into public.agent_permissions (org_id, agent_id, tool_nome, ativo, concedida_por)
    values (p_org, v_agent.id, v_tool, true, v_user)
    on conflict (agent_id, tool_nome) do update set ativo = true, concedida_por = v_user, concedida_em = now();
  end loop;

  select * into v_agent from public.agents where id = v_agent.id;
  return v_agent;
end
$$;

-- Delegação interna: habilitada por humano, só CEO e Gerente.
create or replace function public.agent_habilitar_delegacao(p_agent uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_agent public.agents; v_user uuid; v_tool text;
begin
  select * into v_agent from public.agents where id = p_agent;
  if v_agent.id is null then raise exception 'agente_inexistente' using errcode = '22023'; end if;
  v_user := public.agent_exigir_humano(v_agent.org_id);
  if v_agent.papel not in ('ceo', 'gerente_comercial') then
    raise exception 'papel_nao_delega' using errcode = '42501';
  end if;
  perform set_config('flow.agent_governanca', 'on', true);
  update public.agents set autonomia = 'interna_supervisionada', atualizado_em = now() where id = p_agent;
  for v_tool in select unnest(case when v_agent.papel = 'ceo' then array['delegar_tarefa', 'propor_estrutura_equipe', 'consultar_pipeline', 'consultar_oportunidades', 'consultar_execucoes_equipe']
                                   else array['delegar_tarefa'] end) loop
    insert into public.agent_permissions (org_id, agent_id, tool_nome, ativo, concedida_por)
    values (v_agent.org_id, p_agent, v_tool, true, v_user)
    on conflict (agent_id, tool_nome) do update set ativo = true, concedida_por = v_user, concedida_em = now();
  end loop;
end
$$;

create or replace function public.agent_desabilitar_delegacao(p_agent uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  select org_id into v_org from public.agents where id = p_agent;
  if v_org is null then raise exception 'agente_inexistente' using errcode = '22023'; end if;
  perform public.agent_exigir_humano(v_org);
  perform set_config('flow.agent_governanca', 'on', true);
  update public.agent_permissions set ativo = false
  where agent_id = p_agent and tool_nome in (select nome from public.agent_tools where risco = 'write_internal');
  update public.agents set autonomia = 'somente_leitura', atualizado_em = now() where id = p_agent;
end
$$;

-- ───────────────────────────── 6) criação da equipe (humano; CEO só propõe) ─────────────────────────────
create or replace function public.agent_validar_def_equipe(p_org uuid, p_def jsonb)
returns void language plpgsql stable security definer set search_path = public as $$
declare v_item jsonb; v_papel text; v_vistos text[] := '{}'; v_modelo text;
begin
  if p_def is null or jsonb_typeof(p_def) <> 'array' or jsonb_array_length(p_def) not between 1 and 6 then
    raise exception 'equipe_invalida' using errcode = '22023';
  end if;
  if not exists (select 1 from public.agents where org_id = p_org and papel = 'ceo') then
    raise exception 'ceo_inexistente' using errcode = '22023';
  end if;
  for v_item in select value from jsonb_array_elements(p_def) loop
    v_papel := v_item ->> 'papel';
    if v_papel is null or v_papel not in ('gerente_comercial', 'prospeccao', 'sdr', 'vendedor', 'estrategista', 'seo_geral') then
      raise exception 'papel_invalido' using errcode = '22023';
    end if;
    if v_papel = any (v_vistos) then raise exception 'papel_duplicado' using errcode = '22023'; end if;
    v_vistos := v_vistos || v_papel;
    if exists (select 1 from public.agents where org_id = p_org and papel = v_papel) then
      raise exception 'agente_ja_existe' using errcode = '22023';
    end if;
    v_modelo := v_item ->> 'modelo';
    if v_modelo is not null and not (v_modelo = any (public.agent_modelos_permitidos())) then
      raise exception 'modelo_nao_permitido' using errcode = '22023';
    end if;
  end loop;
  -- especialistas exigem o gerente (já existente ou na mesma proposta)
  if exists (select 1 from jsonb_array_elements(p_def) e where e.value ->> 'papel' <> 'gerente_comercial')
     and not ('gerente_comercial' = any (v_vistos))
     and not exists (select 1 from public.agents where org_id = p_org and papel = 'gerente_comercial') then
    raise exception 'gerente_ausente' using errcode = '22023';
  end if;
end
$$;

create or replace function public.agent_materializar_equipe(p_org uuid, p_def jsonb, p_user uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_item jsonb; v_papel text; v_def jsonb; v_ceo uuid; v_gerente uuid; v_pai uuid; v_novo uuid; v_n integer := 0;
  v_autonomia text; v_tool text; v_risco text;
begin
  perform public.agent_validar_def_equipe(p_org, p_def);
  perform set_config('flow.agent_governanca', 'on', true);
  select id into v_ceo from public.agents where org_id = p_org and papel = 'ceo';
  select id into v_gerente from public.agents where org_id = p_org and papel = 'gerente_comercial';
  for v_item in select value from jsonb_array_elements(p_def) order by (value ->> 'papel' <> 'gerente_comercial') loop
    v_papel := v_item ->> 'papel';
    v_def := public.agent_defaults_do_papel(v_papel);
    v_pai := case when v_papel = 'gerente_comercial' then v_ceo else v_gerente end;
    v_autonomia := case when v_papel = 'gerente_comercial' then 'interna_supervisionada' else 'somente_leitura' end;
    insert into public.agents (org_id, slug, nome, papel, modelo, autonomia, reports_to, cargo, departamento, especialidade,
                               teto_usd_dia, teto_usd_mes, criado_por)
    values (p_org, v_papel, v_def ->> 'nome', v_papel, coalesce(v_item ->> 'modelo', 'claude-haiku-4-5'), v_autonomia, v_pai,
            v_def ->> 'cargo', v_def ->> 'departamento', v_def ->> 'especialidade',
            coalesce((v_item ->> 'teto_dia')::numeric, 0.50), coalesce((v_item ->> 'teto_mes')::numeric, 5.00), p_user)
    returning id into v_novo;
    if v_papel = 'gerente_comercial' then v_gerente := v_novo; end if;
    -- permissões padrão do papel (as que o humano está aprovando); write_internal só com autonomia interna
    for v_tool in select unnest(public.agent_ferramentas_do_papel(v_papel)) loop
      select risco into v_risco from public.agent_tools where nome = v_tool and ativo;
      if v_risco = 'read' or (v_risco = 'write_internal' and v_autonomia = 'interna_supervisionada') then
        insert into public.agent_permissions (org_id, agent_id, tool_nome, ativo, concedida_por)
        values (p_org, v_novo, v_tool, true, p_user);
      end if;
    end loop;
    v_n := v_n + 1;
  end loop;
  return v_n;
end
$$;

create or replace function public.agent_criar_equipe(p_org uuid, p_def jsonb)
returns integer language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  v_user := public.agent_exigir_humano(p_org);
  return public.agent_materializar_equipe(p_org, p_def, v_user);
end
$$;

-- CEO (runtime) só PROPÕE: cria uma aprovação pendente; nada é criado.
create or replace function public.agent_propor_equipe(p_org uuid, p_de uuid, p_def jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_de public.agents; v_id uuid; v_papeis text;
begin
  select * into v_de from public.agents where id = p_de and org_id = p_org;
  if v_de.id is null or v_de.papel <> 'ceo' then raise exception 'somente_ceo_propoe' using errcode = '42501'; end if;
  if v_de.kill_switch then raise exception 'kill_switch' using errcode = '22023'; end if;
  if v_de.estado <> 'ativo' then raise exception 'agente_inativo' using errcode = '22023'; end if;
  if not exists (select 1 from public.agent_permissions where agent_id = p_de and tool_nome = 'propor_estrutura_equipe' and ativo) then
    raise exception 'permissao_ausente' using errcode = '42501';
  end if;
  perform public.agent_validar_def_equipe(p_org, p_def);
  if exists (select 1 from public.agent_approvals where org_id = p_org and tipo = 'mudanca_configuracao' and status = 'pending' and payload ? 'equipe') then
    raise exception 'proposta_pendente' using errcode = '22023';
  end if;
  select string_agg(e.value ->> 'papel', ', ') into v_papeis from jsonb_array_elements(p_def) e;
  insert into public.agent_approvals (org_id, agent_id, tipo, resumo, payload)
  values (p_org, p_de, 'mudanca_configuracao', left('Criar agentes: ' || v_papeis, 500), jsonb_build_object('equipe', p_def))
  returning id into v_id;
  return v_id;
end
$$;

-- Humano decide a proposta; se aprovar, o banco cria os agentes INATIVOS com as permissões do papel.
create or replace function public.agent_decidir_proposta_equipe(p_approval uuid, p_aprovar boolean, p_motivo text default null)
returns integer language plpgsql security definer set search_path = public as $$
declare v_ap public.agent_approvals; v_user uuid; v_n integer := 0;
begin
  select * into v_ap from public.agent_approvals where id = p_approval for update;
  if v_ap.id is null then raise exception 'aprovacao_inexistente' using errcode = '22023'; end if;
  v_user := public.agent_exigir_humano(v_ap.org_id);
  if v_ap.status <> 'pending' then raise exception 'aprovacao_ja_decidida' using errcode = '22023'; end if;
  if v_ap.tipo <> 'mudanca_configuracao' or not (v_ap.payload ? 'equipe') then
    raise exception 'aprovacao_nao_e_de_equipe' using errcode = '22023';
  end if;
  if p_aprovar then
    v_n := public.agent_materializar_equipe(v_ap.org_id, v_ap.payload -> 'equipe', v_user);
  end if;
  perform set_config('flow.agent_governanca', 'on', true);
  update public.agent_approvals
  set status = case when p_aprovar then 'approved' else 'rejected' end,
      decidido_por = v_user, decidido_em = now(), motivo_decisao = left(p_motivo, 500)
  where id = p_approval;
  return v_n;
end
$$;

-- ───────────────────────────── 7) delegação e fila (runtime) ─────────────────────────────
create or replace function public.agent_delegar_tarefa(
  p_org uuid, p_de uuid, p_para_papel text, p_tipo text, p_entrada jsonb, p_idempotency_key text, p_parent uuid default null
) returns public.agent_tasks language plpgsql security definer set search_path = public as $$
declare v_de public.agents; v_para public.agents; v_task public.agent_tasks; v_abertas integer; v_solic uuid;
begin
  select * into v_de from public.agents where id = p_de and org_id = p_org;
  if v_de.id is null then raise exception 'agente_fora_da_organizacao' using errcode = '42501'; end if;
  if v_de.kill_switch then raise exception 'kill_switch' using errcode = '22023'; end if;
  if v_de.estado <> 'ativo' then raise exception 'agente_inativo' using errcode = '22023'; end if;
  if v_de.autonomia <> 'interna_supervisionada' then raise exception 'delegacao_nao_habilitada' using errcode = '42501'; end if;
  if not exists (select 1 from public.agent_permissions where agent_id = p_de and tool_nome = 'delegar_tarefa' and ativo) then
    raise exception 'permissao_ausente' using errcode = '42501';
  end if;
  select * into v_para from public.agents where org_id = p_org and papel = p_para_papel and reports_to = p_de;
  if v_para.id is null then raise exception 'subordinado_inexistente' using errcode = '42501'; end if;
  if v_para.estado <> 'ativo' or v_para.kill_switch then raise exception 'subordinado_inativo' using errcode = '22023'; end if;
  if p_tipo = 'copiloto_conversa' or not (p_tipo = any (public.agent_tipos_do_papel(v_para.papel))) then
    raise exception 'tipo_nao_permitido' using errcode = '22023';
  end if;
  if length(coalesce(p_entrada, '{}'::jsonb)::text) > 4000 then raise exception 'entrada_grande' using errcode = '22023'; end if;
  select count(*) into v_abertas from public.agent_tasks where agent_id = v_para.id and status in ('queued', 'processing');
  if v_abertas >= 10 then raise exception 'fila_cheia' using errcode = '22023'; end if;
  if p_parent is not null then
    select solicitado_por into v_solic from public.agent_tasks where id = p_parent and org_id = p_org;
  end if;
  insert into public.agent_tasks (org_id, agent_id, tipo, entrada, idempotency_key, solicitado_por, delegado_por, parent_task_id)
  values (p_org, v_para.id, p_tipo, coalesce(p_entrada, '{}'::jsonb), p_idempotency_key, v_solic, p_de,
          (select id from public.agent_tasks where id = p_parent and org_id = p_org))
  on conflict (org_id, idempotency_key) do nothing;
  select * into v_task from public.agent_tasks where org_id = p_org and idempotency_key = p_idempotency_key;
  return v_task;
end
$$;

create or replace function public.agent_proximas_tarefas(p_org uuid, p_limite integer default 3)
returns setof public.agent_tasks language sql stable security definer set search_path = public as $$
  select t.* from public.agent_tasks t
  join public.agents a on a.id = t.agent_id and a.org_id = t.org_id
  where t.org_id = p_org and t.status = 'queued' and t.tipo <> 'copiloto_conversa'
    and t.next_attempt_at <= now() and t.attempt_count < t.max_attempts
    and a.estado = 'ativo' and not a.kill_switch
  order by t.prioridade, t.criado_em
  limit least(greatest(coalesce(p_limite, 3), 1), 5)
$$;

-- ───────────────────────────── 8) ferramentas de LEITURA do runtime ─────────────────────────────
-- Deriva a organização do agente e valida estado, kill-switch, papel e permissão ANTES de ler.
create or replace function public.agent_validar_uso(p_agent uuid, p_tool text)
returns uuid language plpgsql stable security definer set search_path = public as $$
declare v_agent public.agents;
begin
  select * into v_agent from public.agents where id = p_agent;
  if v_agent.id is null then raise exception 'agente_inexistente' using errcode = '22023'; end if;
  if v_agent.kill_switch then raise exception 'kill_switch' using errcode = '22023'; end if;
  if v_agent.estado <> 'ativo' then raise exception 'agente_inativo' using errcode = '22023'; end if;
  if not (p_tool = any (public.agent_ferramentas_do_papel(v_agent.papel))) then
    raise exception 'ferramenta_fora_do_papel' using errcode = '42501';
  end if;
  if not exists (select 1 from public.agent_permissions pm join public.agent_tools t on t.nome = pm.tool_nome
                 where pm.agent_id = p_agent and pm.tool_nome = p_tool and pm.ativo and t.ativo) then
    raise exception 'permissao_ausente' using errcode = '42501';
  end if;
  return v_agent.org_id;
end
$$;

create or replace function public.agent_tool_resumo_comercial(p_agent uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  v_org := public.agent_validar_uso(p_agent, 'consultar_resumo_comercial');
  return public.agent_resumo_comercial(v_org);
end
$$;

create or replace function public.agent_tool_pipeline(p_agent uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  v_org := public.agent_validar_uso(p_agent, 'consultar_pipeline');
  return jsonb_build_object(
    'org_id', v_org, 'gerado_em', now(),
    'etapas', coalesce((
      select jsonb_agg(jsonb_build_object('status', s.status, 'total', s.total, 'score_medio', s.score_medio, 'parados_14d', s.parados)
                       order by array_position(array['new','enriched','contacted','proposta_enviada','responded','meeting','won','lost','nurture'], s.status))
      from (select status, count(*)::int as total, round(avg(score))::int as score_medio,
                   count(*) filter (where updated_at < now() - interval '14 days' and status not in ('won', 'lost'))::int as parados
            from public.leads where org_id = v_org group by status) s), '[]'::jsonb));
end
$$;

create or replace function public.agent_tool_oportunidades(p_agent uuid, p_limite integer default 10)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_lim integer := least(greatest(coalesce(p_limite, 10), 1), 20);
begin
  v_org := public.agent_validar_uso(p_agent, 'consultar_oportunidades');
  return jsonb_build_object(
    'org_id', v_org, 'gerado_em', now(),
    'criterio', 'score >= 70, status new ou enriched, com contato (sem_contato = false)',
    'total_encontrado', (select count(*) from public.leads where org_id = v_org and score >= 70 and status in ('new', 'enriched') and not coalesce(sem_contato, false)),
    'oportunidades', coalesce((
      select jsonb_agg(jsonb_build_object('lead_id', l.id, 'negocio', l.business_name, 'categoria', l.category, 'cidade', l.city,
                                          'estado', l.state, 'score', l.score, 'status', l.status, 'nota', l.rating,
                                          'avaliacoes', l.review_count, 'tem_site', l.has_website, 'origem', l.origem_fonte)
                       order by l.score desc, l.created_at desc)
      from (select * from public.leads where org_id = v_org and score >= 70 and status in ('new', 'enriched') and not coalesce(sem_contato, false)
            order by score desc, created_at desc limit v_lim) l), '[]'::jsonb));
end
$$;

create or replace function public.agent_tool_lead(p_agent uuid, p_lead uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_res jsonb;
begin
  v_org := public.agent_validar_uso(p_agent, 'consultar_lead');
  select jsonb_build_object('org_id', v_org, 'lead_id', l.id, 'negocio', l.business_name, 'categoria', l.category, 'cidade', l.city,
                            'estado', l.state, 'bairro', l.bairro, 'nota', l.rating, 'avaliacoes', l.review_count,
                            'tem_site', l.has_website, 'site', l.website, 'instagram', l.instagram_url, 'linkedin', l.linkedin_url,
                            'tem_telefone', l.has_phone, 'tem_email', (l.email is not null), 'tem_whatsapp', (l.whatsapp is not null),
                            'consentimento_whatsapp', coalesce(l.whatsapp_opt_in, false) and not coalesce(l.whatsapp_opt_out, false),
                            'descadastrado_email', coalesce(l.email_opt_out, false),
                            'score', l.score, 'detalhe_score', l.score_breakdown, 'status', l.status,
                            'ultimo_contato', l.last_contacted_at, 'origem', l.origem_fonte)
  into v_res from public.leads l where l.id = p_lead and l.org_id = v_org;
  if v_res is null then raise exception 'lead_inexistente_na_organizacao' using errcode = '22023'; end if;
  return v_res;
end
$$;

create or replace function public.agent_tool_execucoes_equipe(p_agent uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  v_org := public.agent_validar_uso(p_agent, 'consultar_execucoes_equipe');
  return jsonb_build_object(
    'org_id', v_org, 'gerado_em', now(), 'janela', 'ultimos 7 dias',
    'agentes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'papel', a.papel, 'estado', a.estado, 'kill_switch', a.kill_switch,
        'execucoes', (select count(*) from public.agent_runs r where r.agent_id = a.id and r.iniciado_em >= now() - interval '7 days'),
        'falhas', (select count(*) from public.agent_runs r where r.agent_id = a.id and r.status = 'failed' and r.iniciado_em >= now() - interval '7 days'),
        'custo_usd', (select coalesce(round(sum(custo_usd), 4), 0) from public.agent_runs r where r.agent_id = a.id and r.iniciado_em >= now() - interval '7 days'),
        'fila', (select count(*) from public.agent_tasks t where t.agent_id = a.id and t.status in ('queued', 'processing')),
        'ultimo_erro', (select left(t.ultimo_erro, 120) from public.agent_tasks t where t.agent_id = a.id and t.ultimo_erro is not null order by t.atualizado_em desc limit 1)
      ) order by a.papel)
      from public.agents a where a.org_id = v_org), '[]'::jsonb));
end
$$;

-- ───────────────────────────── 9) permissões de execução ─────────────────────────────
revoke all on function
  public.agent_ferramentas_do_papel(text), public.agent_tipos_do_papel(text), public.agent_modelos_permitidos(),
  public.agent_defaults_do_papel(text), public.agent_validar_def_equipe(uuid, jsonb),
  public.agent_materializar_equipe(uuid, jsonb, uuid), public.agent_validar_uso(uuid, text)
  from public, anon, authenticated;

revoke all on function
  public.agent_conceder_permissao(uuid, text), public.agent_definir_limites(uuid, numeric, numeric, integer, text),
  public.agent_definir_estado(uuid, text),
  public.agent_configurar_ceo(uuid, text, text, text, text, text, text, text, numeric, numeric, text[]),
  public.agent_habilitar_delegacao(uuid), public.agent_desabilitar_delegacao(uuid),
  public.agent_criar_equipe(uuid, jsonb), public.agent_decidir_proposta_equipe(uuid, boolean, text)
  from public, anon;
grant execute on function
  public.agent_conceder_permissao(uuid, text), public.agent_definir_limites(uuid, numeric, numeric, integer, text),
  public.agent_definir_estado(uuid, text),
  public.agent_configurar_ceo(uuid, text, text, text, text, text, text, text, numeric, numeric, text[]),
  public.agent_habilitar_delegacao(uuid), public.agent_desabilitar_delegacao(uuid),
  public.agent_criar_equipe(uuid, jsonb), public.agent_decidir_proposta_equipe(uuid, boolean, text)
  to authenticated;

revoke all on function
  public.agent_propor_equipe(uuid, uuid, jsonb), public.agent_delegar_tarefa(uuid, uuid, text, text, jsonb, text, uuid),
  public.agent_proximas_tarefas(uuid, integer), public.agent_tool_resumo_comercial(uuid), public.agent_tool_pipeline(uuid),
  public.agent_tool_oportunidades(uuid, integer), public.agent_tool_lead(uuid, uuid), public.agent_tool_execucoes_equipe(uuid)
  from public, anon, authenticated;
grant execute on function
  public.agent_propor_equipe(uuid, uuid, jsonb), public.agent_delegar_tarefa(uuid, uuid, text, text, jsonb, text, uuid),
  public.agent_proximas_tarefas(uuid, integer), public.agent_tool_resumo_comercial(uuid), public.agent_tool_pipeline(uuid),
  public.agent_tool_oportunidades(uuid, integer), public.agent_tool_lead(uuid, uuid), public.agent_tool_execucoes_equipe(uuid)
  to service_role;

-- Funções internas: nem o runtime (service_role) pode chamá-las diretamente — só as RPCs definer acima.
-- Em especial agent_materializar_equipe: sem isso o runtime criaria agentes sem aprovação humana.
revoke all on function
  public.agent_ferramentas_do_papel(text), public.agent_tipos_do_papel(text), public.agent_modelos_permitidos(),
  public.agent_defaults_do_papel(text), public.agent_validar_def_equipe(uuid, jsonb),
  public.agent_materializar_equipe(uuid, jsonb, uuid), public.agent_validar_uso(uuid, text)
  from service_role;

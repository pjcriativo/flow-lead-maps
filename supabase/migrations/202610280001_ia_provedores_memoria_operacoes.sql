-- CEO MESTRE DE IA (Prompt 40) — PREPARADA, NÃO APLICADA EM PRODUÇÃO. Idempotente. Incremental sobre 001–003.
-- Aplicar só com autorização explícita. Enquanto não aplicada, o frontend e as Edges continuam
-- retrocompatíveis (flags desligadas; consultas novas tratam 42P01/42883 como "recurso ainda não publicado").
--
--  1) Central de IA (Super Admin): ia_config (singleton), ia_provedores, ia_modelos, ia_eventos.
--     A CHAVE da OpenAI NÃO fica aqui: vai para o cofre existente (config_chaves, AES-256-GCM) pela Edge
--     admin-acoes. Estas tabelas guardam apenas configuração e estado; sem policy para usuários.
--  2) agent_modelos_permitidos() passa a considerar os modelos ativos e PRECIFICADOS da Central.
--  3) Orçamento agregado por organização (além dos tetos por agente, que não mudam).
--  4) Memória persistente por organização (agent_memoria) + ferramentas consultar_memoria/registrar_memoria.
--  5) Operações comerciais por nicho/produto (agent_operacoes) + ferramenta propor_operacao (só PROPÕE;
--     humano aprova) e delegação vinculada à operação (agentes compartilhados só com autorização humana).
--  6) Visões de controle para o Super Admin (sem conteúdo de conversas).
-- Nada aqui envia mensagem, executa busca paga, altera contrato/financeiro ou concede privilégio sozinho.

-- ───────────────────────────── 1) Central de IA ─────────────────────────────
create table if not exists public.ia_config (
  id boolean primary key default true check (id),
  provedor_ceo text not null default 'anthropic' check (provedor_ceo in ('anthropic', 'openai')),
  modelo_padrao text check (modelo_padrao is null or length(modelo_padrao) between 3 and 80),
  modelo_ceo text check (modelo_ceo is null or length(modelo_ceo) between 3 and 80),
  modelos_por_papel jsonb not null default '{}'::jsonb check (jsonb_typeof(modelos_por_papel) = 'object'),
  fallback_provider text check (fallback_provider is null or fallback_provider in ('anthropic', 'openai')),
  fallback_modelo text check (fallback_modelo is null or length(fallback_modelo) between 3 and 80),
  teto_org_dia_usd numeric(10, 4) not null default 3.50 check (teto_org_dia_usd >= 0 and teto_org_dia_usd <= 100),
  teto_org_mes_usd numeric(10, 4) not null default 35.00 check (teto_org_mes_usd >= 0 and teto_org_mes_usd <= 1000),
  atualizado_por uuid,
  atualizado_em timestamptz not null default now(),
  check (teto_org_dia_usd <= teto_org_mes_usd),
  check (fallback_provider is null or fallback_provider <> provedor_ceo)
);
insert into public.ia_config (id) values (true) on conflict (id) do nothing;

create table if not exists public.ia_provedores (
  provider text primary key check (provider in ('anthropic', 'openai')),
  ativo boolean not null default false,
  conexao_status text not null default 'nao_configurado'
    check (conexao_status in ('nao_configurado', 'ok', 'falha', 'revogada')),
  conexao_verificada_em timestamptz,
  conexao_detalhe text check (conexao_detalhe is null or length(conexao_detalhe) <= 300),
  atualizado_por uuid,
  atualizado_em timestamptz not null default now()
);
-- Anthropic continua operacional (comportamento atual); OpenAI nasce DESLIGADA até o Super Admin configurar.
insert into public.ia_provedores (provider, ativo, conexao_status) values ('anthropic', true, 'ok'), ('openai', false, 'nao_configurado')
on conflict (provider) do nothing;

-- Preço por 1M de tokens é informado pelo Super Admin (a API da OpenAI não publica preço). Sem preço o
-- runtime RECUSA o modelo ("modelo_nao_precificado"): não há como respeitar o teto sem saber o custo.
create table if not exists public.ia_modelos (
  id text primary key check (length(id) between 3 and 80),
  provider text not null references public.ia_provedores(provider),
  rotulo text check (rotulo is null or length(rotulo) <= 80),
  usd_in_mtok numeric(12, 4) check (usd_in_mtok is null or (usd_in_mtok >= 0 and usd_in_mtok <= 1000)),
  usd_out_mtok numeric(12, 4) check (usd_out_mtok is null or (usd_out_mtok >= 0 and usd_out_mtok <= 1000)),
  suporta_ferramentas boolean not null default true,
  ativo boolean not null default false,
  validado_em timestamptz,
  atualizado_em timestamptz not null default now()
);
insert into public.ia_modelos (id, provider, rotulo, usd_in_mtok, usd_out_mtok, ativo, validado_em) values
  ('claude-haiku-4-5', 'anthropic', 'Claude Haiku 4.5', 1, 5, true, now()),
  ('claude-sonnet-4-5', 'anthropic', 'Claude Sonnet 4.5', 3, 15, true, now()),
  ('claude-sonnet-5', 'anthropic', 'Claude Sonnet 5', 3, 15, true, now()),
  ('claude-opus-4-7', 'anthropic', 'Claude Opus 4.7', 5, 25, true, now()),
  ('claude-opus-4-8', 'anthropic', 'Claude Opus 4.8', 5, 25, true, now())
on conflict (id) do nothing;

create table if not exists public.ia_eventos (
  id bigint generated always as identity primary key,
  criado_em timestamptz not null default now(),
  provider text check (provider is null or provider in ('anthropic', 'openai')),
  tipo text not null check (tipo in (
    'chave_configurada', 'chave_revogada', 'conexao_testada', 'modelos_sincronizados', 'config_alterada',
    'chamada_falhou', 'fallback_usado', 'limite_atingido')),
  modelo text check (modelo is null or length(modelo) <= 80),
  org_id uuid,
  agent_id uuid,
  status text check (status is null or length(status) <= 40),
  detalhe text check (detalhe is null or length(detalhe) <= 300),
  user_id uuid
);
create index if not exists ia_eventos_criado_idx on public.ia_eventos (criado_em desc);

alter table public.ia_config enable row level security;
alter table public.ia_provedores enable row level security;
alter table public.ia_modelos enable row level security;
alter table public.ia_eventos enable row level security;
revoke all on public.ia_config, public.ia_provedores, public.ia_modelos, public.ia_eventos from anon, authenticated;
-- sem policies: só o service_role (Edge admin-acoes, após a checagem de super admin) lê e escreve.

-- 2) Modelos permitidos = padrão Claude (exceto os desativados na Central) ∪ modelos ativos e precificados
--    de provedores ativos. Mantém todo o comportamento anterior quando a Central não é usada.
create or replace function public.agent_modelos_permitidos()
returns text[] language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(distinct q.id order by q.id), '{}'::text[]) from (
    select s as id from unnest(array['claude-haiku-4-5', 'claude-sonnet-4-5', 'claude-sonnet-5', 'claude-opus-4-7', 'claude-opus-4-8']) s
    where not exists (select 1 from public.ia_modelos m where m.id = s and not m.ativo)
    union
    select m.id from public.ia_modelos m join public.ia_provedores p on p.provider = m.provider
    where m.ativo and p.ativo and m.usd_in_mtok is not null and m.usd_out_mtok is not null
  ) q
$$;

-- Catálogo para o assistente do CEO (Tela 02): sem segredo, sem preço de custo interno além do necessário.
create or replace function public.ia_modelos_disponiveis()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_cfg public.ia_config; v_pronto boolean; v_chave boolean;
begin
  if auth.uid() is null then raise exception 'nao_autenticado' using errcode = '42501'; end if;
  select * into v_cfg from public.ia_config where id;
  v_chave := exists (select 1 from public.config_chaves where nome = 'OPENAI_API_KEY');
  v_pronto := case v_cfg.provedor_ceo
    when 'openai' then v_chave and exists (select 1 from public.ia_provedores where provider = 'openai' and ativo and conexao_status = 'ok')
                       and v_cfg.modelo_ceo = any (public.agent_modelos_permitidos())
    else exists (select 1 from public.ia_provedores where provider = 'anthropic' and ativo) end;
  return jsonb_build_object(
    'provedor_ceo', v_cfg.provedor_ceo, 'modelo_ceo', v_cfg.modelo_ceo, 'modelo_padrao', v_cfg.modelo_padrao,
    'ceo_pronto', coalesce(v_pronto, false),
    'modelos', coalesce((
      select jsonb_agg(jsonb_build_object('id', m.id, 'provider', m.provider, 'rotulo', coalesce(m.rotulo, m.id),
                                          'usd_in_mtok', m.usd_in_mtok, 'usd_out_mtok', m.usd_out_mtok) order by m.provider, m.id)
      from public.ia_modelos m join public.ia_provedores p on p.provider = m.provider
      where m.id = any (public.agent_modelos_permitidos()) and m.ativo and p.ativo
        and (m.provider <> 'openai' or (v_chave and p.conexao_status = 'ok'))), '[]'::jsonb));
end
$$;

-- Modelo padrão de um papel: configuração do Super Admin → padrão global → Haiku (comportamento anterior).
create or replace function public.ia_modelo_do_papel(p_papel text)
returns text language sql stable security definer set search_path = public as $$
  select coalesce(
    (select case when c.modelos_por_papel ->> p_papel = any (public.agent_modelos_permitidos()) then c.modelos_por_papel ->> p_papel end from public.ia_config c where c.id),
    (select case when c.modelo_padrao = any (public.agent_modelos_permitidos()) then c.modelo_padrao end from public.ia_config c where c.id),
    'claude-haiku-4-5')
$$;

-- A equipe aprovada nasce com o modelo definido na Central (continua sendo o humano quem aprova e ativa).
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
    values (p_org, v_papel, v_def ->> 'nome', v_papel, coalesce(v_item ->> 'modelo', public.ia_modelo_do_papel(v_papel)), v_autonomia, v_pai,
            v_def ->> 'cargo', v_def ->> 'departamento', v_def ->> 'especialidade',
            coalesce((v_item ->> 'teto_dia')::numeric, 0.50), coalesce((v_item ->> 'teto_mes')::numeric, 5.00), p_user)
    returning id into v_novo;
    if v_papel = 'gerente_comercial' then v_gerente := v_novo; end if;
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

-- ───────────────────────────── 3) orçamento agregado por organização ─────────────────────────────
create table if not exists public.agent_orcamento_org (
  org_id uuid primary key references public.orgs(id) on delete cascade,
  teto_dia_usd numeric(10, 4) not null check (teto_dia_usd >= 0 and teto_dia_usd <= 100),
  teto_mes_usd numeric(10, 4) not null check (teto_mes_usd >= 0 and teto_mes_usd <= 1000),
  atualizado_por uuid,
  atualizado_em timestamptz not null default now(),
  check (teto_dia_usd <= teto_mes_usd)
);
alter table public.agent_orcamento_org enable row level security;
revoke all on public.agent_orcamento_org from anon, authenticated;

-- Runtime: gasto agregado da organização (todos os agentes e operações) contra o teto agregado.
create or replace function public.agent_orcamento_org_estado(p_org uuid)
returns table (usd_dia numeric, usd_mes numeric, teto_dia numeric, teto_mes numeric)
language sql stable security definer set search_path = public as $$
  select
    coalesce(sum(r.custo_usd) filter (where r.iniciado_em >= date_trunc('day', now())), 0),
    coalesce(sum(r.custo_usd) filter (where r.iniciado_em >= date_trunc('month', now())), 0),
    coalesce((select o.teto_dia_usd from public.agent_orcamento_org o where o.org_id = p_org), (select c.teto_org_dia_usd from public.ia_config c where c.id), 3.50),
    coalesce((select o.teto_mes_usd from public.agent_orcamento_org o where o.org_id = p_org), (select c.teto_org_mes_usd from public.ia_config c where c.id), 35.00)
  from public.agent_runs r where r.org_id = p_org
$$;

-- ───────────────────────────── 4) memória persistente por organização ─────────────────────────────
create or replace function public.agent_membro_gestor(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_org is not null and exists (
    select 1 from public.memberships m
    where m.org_id = p_org and m.user_id = auth.uid() and m.papel::text in ('super_admin', 'admin', 'gerente'))
$$;

create table if not exists public.agent_memoria (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  operacao_id uuid,
  categoria text not null check (categoria in (
    'contexto_organizacao', 'preferencia_comercial', 'meta_aprovada', 'plano_anterior',
    'historico_tarefas', 'feedback_humano', 'decisao_aprovada', 'conversa')),
  titulo text not null check (length(btrim(titulo)) between 3 and 120),
  conteudo text not null check (length(btrim(conteudo)) between 3 and 1200),
  origem text not null check (origem in ('agente', 'humano', 'sistema')),
  agent_id uuid,
  -- Reservado para RAG/documentos (sem conector nesta fase): identifica a fonte quando houver.
  fonte_ref text check (fonte_ref is null or length(fonte_ref) <= 200),
  hash text not null,
  ativo boolean not null default true,
  criado_por uuid,
  criado_em timestamptz not null default now(),
  unique (org_id, hash),
  foreign key (agent_id, org_id) references public.agents(id, org_id)
);
create index if not exists agent_memoria_org_idx on public.agent_memoria (org_id, categoria, criado_em desc) where ativo;

alter table public.agent_memoria enable row level security;
revoke all on public.agent_memoria from anon, authenticated;
-- Memória é conteúdo do cliente: só gestores DA organização leem (o super admin da plataforma não entra por RLS).
drop policy if exists agent_memoria_select on public.agent_memoria;
create policy agent_memoria_select on public.agent_memoria for select to authenticated using (public.agent_membro_gestor(org_id));
grant select on public.agent_memoria to authenticated;

-- Bloqueia segredos e dados pessoais em memória (chaves, tokens, senhas, e-mails, telefones).
create or replace function public.agent_memoria_texto_ok(p_texto text)
returns boolean language sql immutable as $$
  select p_texto !~* '(sk-[a-z0-9_-]{12,}|apify_api_|sbp_[a-z0-9]{10,}|bearer\s+[a-z0-9._-]{16,}|eyj[a-z0-9_-]{16,}\.|(senha|password|passwd|secret|token|api[_ -]?key)\s*[:=]|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|\d{10,}|\(?\d{2}\)?\s?9?\d{4}-\d{4})'
$$;

create or replace function public.agent_memoria_inserir(
  p_org uuid, p_agent uuid, p_operacao uuid, p_categoria text, p_titulo text, p_conteudo text, p_origem text, p_user uuid
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_hash text; v_id uuid; v_ativas integer;
begin
  if not public.agent_memoria_texto_ok(coalesce(p_titulo, '') || ' ' || coalesce(p_conteudo, '')) then
    raise exception 'memoria_com_dado_sensivel' using errcode = '22023';
  end if;
  if p_operacao is not null and not exists (select 1 from public.agent_operacoes where id = p_operacao and org_id = p_org) then
    raise exception 'operacao_fora_da_organizacao' using errcode = '42501';
  end if;
  select count(*) into v_ativas from public.agent_memoria where org_id = p_org and ativo;
  if v_ativas >= 300 then raise exception 'memoria_cheia' using errcode = '22023'; end if;
  v_hash := md5(p_org::text || '|' || coalesce(p_operacao::text, '') || '|' || p_categoria || '|' || lower(btrim(p_titulo)) || '|' || lower(btrim(p_conteudo)));
  insert into public.agent_memoria (org_id, operacao_id, categoria, titulo, conteudo, origem, agent_id, hash, criado_por)
  values (p_org, p_operacao, p_categoria, btrim(p_titulo), btrim(p_conteudo), p_origem, p_agent, v_hash, p_user)
  on conflict (org_id, hash) do nothing returning id into v_id;
  return jsonb_build_object('registrada', v_id is not null, 'memoria_id', v_id, 'duplicada', v_id is null);
end
$$;

-- Runtime (ferramenta de LEITURA): org derivada do agente; opcionalmente filtrada por categoria/operação.
create or replace function public.agent_tool_memoria(p_agent uuid, p_categoria text default null, p_operacao uuid default null, p_limite integer default 15)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  v_org := public.agent_validar_uso(p_agent, 'consultar_memoria');
  return jsonb_build_object(
    'org_id', v_org, 'gerado_em', now(),
    'memorias', coalesce((
      select jsonb_agg(jsonb_build_object('id', m.id, 'categoria', m.categoria, 'titulo', m.titulo, 'conteudo', m.conteudo,
                                          'origem', m.origem, 'operacao_id', m.operacao_id, 'criado_em', m.criado_em)
                       order by m.criado_em desc)
      from (select * from public.agent_memoria
            where org_id = v_org and ativo and (p_categoria is null or categoria = p_categoria)
              and (p_operacao is null or operacao_id = p_operacao)
            order by criado_em desc limit least(greatest(coalesce(p_limite, 15), 1), 30)) m), '[]'::jsonb));
end
$$;

-- Runtime (coordenação interna): registra memória da PRÓPRIA organização do agente.
create or replace function public.agent_registrar_memoria(
  p_agent uuid, p_categoria text, p_titulo text, p_conteudo text, p_operacao uuid default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_agent public.agents;
begin
  v_org := public.agent_validar_uso(p_agent, 'registrar_memoria');
  select * into v_agent from public.agents where id = p_agent;
  if v_agent.autonomia <> 'interna_supervisionada' then raise exception 'autonomia_insuficiente' using errcode = '42501'; end if;
  if p_categoria not in ('contexto_organizacao', 'preferencia_comercial', 'plano_anterior', 'historico_tarefas', 'conversa') then
    -- metas aprovadas, decisões e feedback só nascem de pessoas ou do fluxo de aprovação
    raise exception 'categoria_reservada_a_humanos' using errcode = '42501';
  end if;
  return public.agent_memoria_inserir(v_org, p_agent, p_operacao, p_categoria, p_titulo, p_conteudo, 'agente', null);
end
$$;

-- Humano: registra feedback/preferência/meta/decisão e arquiva memórias.
create or replace function public.agent_memoria_registrar_humano(p_org uuid, p_categoria text, p_titulo text, p_conteudo text, p_operacao uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  v_user := public.agent_exigir_humano(p_org);
  return public.agent_memoria_inserir(p_org, null, p_operacao, p_categoria, p_titulo, p_conteudo, 'humano', v_user);
end
$$;

create or replace function public.agent_memoria_arquivar(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  select org_id into v_org from public.agent_memoria where id = p_id;
  if v_org is null then raise exception 'memoria_inexistente' using errcode = '22023'; end if;
  perform public.agent_exigir_humano(v_org);
  update public.agent_memoria set ativo = false where id = p_id;
end
$$;

-- ───────────────────────────── 5) operações comerciais por nicho e produto ─────────────────────────────
create table if not exists public.agent_operacoes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  nome text not null check (length(btrim(nome)) between 3 and 80),
  nicho text not null check (length(btrim(nicho)) between 2 and 80),
  subnicho text check (subnicho is null or length(subnicho) <= 80),
  produto text not null check (length(btrim(produto)) between 2 and 120),
  publico_alvo text not null check (length(btrim(publico_alvo)) between 2 and 400),
  regiao text not null check (length(btrim(regiao)) between 2 and 120),
  estrategia jsonb not null default '{}'::jsonb check (jsonb_typeof(estrategia) = 'object' and length(estrategia::text) <= 8000),
  metas jsonb not null default '{}'::jsonb check (jsonb_typeof(metas) = 'object' and length(metas::text) <= 2000),
  papeis text[] not null default '{}',
  papeis_pendentes text[] not null default '{}',
  orcamento_usd_mes numeric(10, 4) not null default 0 check (orcamento_usd_mes >= 0 and orcamento_usd_mes <= 500),
  status text not null default 'ativa' check (status in ('ativa', 'pausada', 'encerrada')),
  aprovacao_id uuid,
  proposta_por uuid,
  aprovado_por uuid,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (id, org_id),
  foreign key (proposta_por, org_id) references public.agents(id, org_id)
);
create unique index if not exists agent_operacoes_nome_uidx on public.agent_operacoes (org_id, lower(btrim(nome))) where status <> 'encerrada';
create index if not exists agent_operacoes_org_idx on public.agent_operacoes (org_id, status);

-- Agentes compartilhados entre operações SOMENTE por autorização humana (ou aprovação da proposta).
create table if not exists public.agent_operacao_agentes (
  operacao_id uuid not null,
  agent_id uuid not null,
  org_id uuid not null,
  autorizado_por uuid not null,
  autorizado_em timestamptz not null default now(),
  primary key (operacao_id, agent_id),
  foreign key (operacao_id, org_id) references public.agent_operacoes(id, org_id) on delete cascade,
  foreign key (agent_id, org_id) references public.agents(id, org_id) on delete cascade
);

alter table public.agent_tasks add column if not exists operacao_id uuid;
alter table public.agent_tasks drop constraint if exists agent_tasks_operacao_fkey;
alter table public.agent_tasks add constraint agent_tasks_operacao_fkey
  foreign key (operacao_id, org_id) references public.agent_operacoes(id, org_id);
create index if not exists agent_tasks_operacao_idx on public.agent_tasks (operacao_id) where operacao_id is not null;

alter table public.agent_memoria drop constraint if exists agent_memoria_operacao_fkey;
alter table public.agent_memoria add constraint agent_memoria_operacao_fkey
  foreign key (operacao_id, org_id) references public.agent_operacoes(id, org_id);

alter table public.agent_operacoes enable row level security;
alter table public.agent_operacao_agentes enable row level security;
revoke all on public.agent_operacoes, public.agent_operacao_agentes from anon, authenticated;
drop policy if exists agent_operacoes_select on public.agent_operacoes;
create policy agent_operacoes_select on public.agent_operacoes for select to authenticated using (public.agent_membro_gestor(org_id));
drop policy if exists agent_operacao_agentes_select on public.agent_operacao_agentes;
create policy agent_operacao_agentes_select on public.agent_operacao_agentes for select to authenticated using (public.agent_membro_gestor(org_id));
grant select on public.agent_operacoes, public.agent_operacao_agentes to authenticated;

-- Valida a definição de uma operação (usada na proposta E na aprovação).
create or replace function public.agent_validar_def_operacao(p_def jsonb)
returns void language plpgsql immutable set search_path = public as $$
declare v_papel text;
begin
  if p_def is null or jsonb_typeof(p_def) <> 'object' then raise exception 'operacao_invalida' using errcode = '22023'; end if;
  if length(btrim(coalesce(p_def ->> 'nome', ''))) not between 3 and 80
     or length(btrim(coalesce(p_def ->> 'nicho', ''))) not between 2 and 80
     or length(btrim(coalesce(p_def ->> 'produto', ''))) not between 2 and 120
     or length(btrim(coalesce(p_def ->> 'publico_alvo', ''))) not between 2 and 400
     or length(btrim(coalesce(p_def ->> 'regiao', ''))) not between 2 and 120 then
    raise exception 'operacao_campos_invalidos' using errcode = '22023';
  end if;
  if jsonb_typeof(coalesce(p_def -> 'estrategia', '{}'::jsonb)) <> 'object' or length(coalesce(p_def -> 'estrategia', '{}'::jsonb)::text) > 8000 then
    raise exception 'estrategia_invalida' using errcode = '22023';
  end if;
  if jsonb_typeof(coalesce(p_def -> 'papeis', '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_def -> 'papeis', '[]'::jsonb)) > 6 then
    raise exception 'papeis_invalidos' using errcode = '22023';
  end if;
  for v_papel in select jsonb_array_elements_text(coalesce(p_def -> 'papeis', '[]'::jsonb)) loop
    if v_papel not in ('gerente_comercial', 'prospeccao', 'sdr', 'vendedor', 'estrategista', 'seo_geral') then
      raise exception 'papeis_invalidos' using errcode = '22023';
    end if;
  end loop;
  if coalesce((p_def ->> 'orcamento_usd_mes')::numeric, 0) not between 0 and 500 then
    raise exception 'orcamento_invalido' using errcode = '22023';
  end if;
  if not public.agent_memoria_texto_ok(p_def::text) then raise exception 'operacao_com_dado_sensivel' using errcode = '22023'; end if;
end
$$;

-- CEO (runtime) só PROPÕE: cria aprovação pendente; nenhuma operação, agente ou permissão nasce aqui.
create or replace function public.agent_propor_operacao(p_org uuid, p_de uuid, p_def jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_de public.agents; v_id uuid;
begin
  select * into v_de from public.agents where id = p_de and org_id = p_org;
  if v_de.id is null or v_de.papel <> 'ceo' then raise exception 'somente_ceo_propoe' using errcode = '42501'; end if;
  if v_de.kill_switch then raise exception 'kill_switch' using errcode = '22023'; end if;
  if v_de.estado <> 'ativo' then raise exception 'agente_inativo' using errcode = '22023'; end if;
  if not exists (select 1 from public.agent_permissions where agent_id = p_de and tool_nome = 'propor_operacao' and ativo) then
    raise exception 'permissao_ausente' using errcode = '42501';
  end if;
  perform public.agent_validar_def_operacao(p_def);
  if (select count(*) from public.agent_operacoes where org_id = p_org and status <> 'encerrada') >= 10 then
    raise exception 'limite_de_operacoes' using errcode = '22023';
  end if;
  if exists (select 1 from public.agent_operacoes where org_id = p_org and status <> 'encerrada' and lower(btrim(nome)) = lower(btrim(p_def ->> 'nome'))) then
    raise exception 'operacao_ja_existe' using errcode = '22023';
  end if;
  if (select count(*) from public.agent_approvals where org_id = p_org and tipo = 'mudanca_configuracao' and status = 'pending' and payload ? 'operacao') >= 3 then
    raise exception 'propostas_pendentes_demais' using errcode = '22023';
  end if;
  insert into public.agent_approvals (org_id, agent_id, tipo, resumo, payload)
  values (p_org, p_de, 'mudanca_configuracao', left('Nova operação comercial: ' || btrim(p_def ->> 'nome') || ' (' || btrim(p_def ->> 'nicho') || ')', 500),
          jsonb_build_object('operacao', p_def))
  returning id into v_id;
  return v_id;
end
$$;

-- Humano decide. Aprovar CRIA a operação e vincula agentes JÁ EXISTENTES do papel; papéis que não existem
-- ficam em papeis_pendentes (criar agente exige a proposta de equipe e a aprovação humana próprias).
create or replace function public.agent_decidir_proposta_operacao(p_approval uuid, p_aprovar boolean, p_motivo text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_ap public.agent_approvals; v_user uuid; v_def jsonb; v_op uuid; v_papel text; v_agent uuid; v_vinc text[] := '{}'; v_pend text[] := '{}';
begin
  select * into v_ap from public.agent_approvals where id = p_approval for update;
  if v_ap.id is null then raise exception 'aprovacao_inexistente' using errcode = '22023'; end if;
  v_user := public.agent_exigir_humano(v_ap.org_id);
  if v_ap.status <> 'pending' then raise exception 'aprovacao_ja_decidida' using errcode = '22023'; end if;
  if v_ap.tipo <> 'mudanca_configuracao' or not (v_ap.payload ? 'operacao') then
    raise exception 'aprovacao_nao_e_de_operacao' using errcode = '22023';
  end if;
  if p_aprovar then
    v_def := v_ap.payload -> 'operacao';
    perform public.agent_validar_def_operacao(v_def);
    insert into public.agent_operacoes (org_id, nome, nicho, subnicho, produto, publico_alvo, regiao, estrategia, metas, orcamento_usd_mes,
                                        aprovacao_id, proposta_por, aprovado_por)
    values (v_ap.org_id, btrim(v_def ->> 'nome'), btrim(v_def ->> 'nicho'), nullif(btrim(coalesce(v_def ->> 'subnicho', '')), ''),
            btrim(v_def ->> 'produto'), btrim(v_def ->> 'publico_alvo'), btrim(v_def ->> 'regiao'),
            coalesce(v_def -> 'estrategia', '{}'::jsonb), coalesce(v_def -> 'metas', '{}'::jsonb),
            coalesce((v_def ->> 'orcamento_usd_mes')::numeric, 0), p_approval, v_ap.agent_id, v_user)
    returning id into v_op;
    for v_papel in select jsonb_array_elements_text(coalesce(v_def -> 'papeis', '[]'::jsonb)) loop
      select id into v_agent from public.agents where org_id = v_ap.org_id and papel = v_papel;
      if v_agent is null then v_pend := v_pend || v_papel;
      else
        insert into public.agent_operacao_agentes (operacao_id, agent_id, org_id, autorizado_por) values (v_op, v_agent, v_ap.org_id, v_user)
        on conflict do nothing;
        v_vinc := v_vinc || v_papel;
      end if;
    end loop;
    update public.agent_operacoes set papeis = v_vinc, papeis_pendentes = v_pend where id = v_op;
    perform public.agent_memoria_inserir(v_ap.org_id, null, v_op, 'decisao_aprovada',
      'Operação aprovada: ' || left(btrim(v_def ->> 'nome'), 80),
      left('Nicho ' || btrim(v_def ->> 'nicho') || ', produto ' || btrim(v_def ->> 'produto') || ', região ' || btrim(v_def ->> 'regiao') || '.', 1000),
      'sistema', v_user);
  end if;
  perform set_config('flow.agent_governanca', 'on', true);
  update public.agent_approvals
  set status = case when p_aprovar then 'approved' else 'rejected' end,
      decidido_por = v_user, decidido_em = now(), motivo_decisao = left(p_motivo, 500)
  where id = p_approval;
  return v_op;
end
$$;

create or replace function public.agent_operacao_definir_estado(p_op uuid, p_estado text)
returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  if p_estado not in ('ativa', 'pausada', 'encerrada') then raise exception 'estado_invalido' using errcode = '22023'; end if;
  select org_id into v_org from public.agent_operacoes where id = p_op;
  if v_org is null then raise exception 'operacao_inexistente' using errcode = '22023'; end if;
  perform public.agent_exigir_humano(v_org);
  if (select status from public.agent_operacoes where id = p_op) = 'encerrada' then raise exception 'operacao_encerrada' using errcode = '22023'; end if;
  update public.agent_operacoes set status = p_estado, atualizado_em = now() where id = p_op;
  -- pausar/encerrar cancela o que ainda não começou
  if p_estado in ('pausada', 'encerrada') then
    update public.agent_tasks set status = 'cancelled', atualizado_em = now() where operacao_id = p_op and status = 'queued';
  end if;
end
$$;

create or replace function public.agent_operacao_autorizar_agente(p_op uuid, p_agent uuid, p_autorizar boolean default true)
returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_user uuid;
begin
  select org_id into v_org from public.agent_operacoes where id = p_op;
  if v_org is null then raise exception 'operacao_inexistente' using errcode = '22023'; end if;
  v_user := public.agent_exigir_humano(v_org);
  if not exists (select 1 from public.agents where id = p_agent and org_id = v_org and papel <> 'ceo') then
    raise exception 'agente_fora_da_organizacao' using errcode = '42501';
  end if;
  if p_autorizar then
    insert into public.agent_operacao_agentes (operacao_id, agent_id, org_id, autorizado_por) values (p_op, p_agent, v_org, v_user) on conflict do nothing;
  else
    delete from public.agent_operacao_agentes where operacao_id = p_op and agent_id = p_agent;
  end if;
  update public.agent_operacoes o set
    papeis = coalesce((select array_agg(a.papel order by a.papel) from public.agent_operacao_agentes x join public.agents a on a.id = x.agent_id where x.operacao_id = o.id), '{}'),
    atualizado_em = now()
  where o.id = p_op;
end
$$;

-- Runtime: delegação vinculada à operação. Contexto, tarefa e custo ficam separados por operação.
create or replace function public.agent_delegar_tarefa_op(
  p_org uuid, p_de uuid, p_para_papel text, p_tipo text, p_entrada jsonb, p_idempotency_key text, p_parent uuid, p_operacao uuid
) returns public.agent_tasks language plpgsql security definer set search_path = public as $$
declare v_op public.agent_operacoes; v_task public.agent_tasks; v_para uuid;
begin
  select * into v_op from public.agent_operacoes where id = p_operacao and org_id = p_org;
  if v_op.id is null then raise exception 'operacao_fora_da_organizacao' using errcode = '42501'; end if;
  if v_op.status <> 'ativa' then raise exception 'operacao_inativa' using errcode = '22023'; end if;
  select id into v_para from public.agents where org_id = p_org and papel = p_para_papel and reports_to = p_de;
  if v_para is null or not exists (select 1 from public.agent_operacao_agentes where operacao_id = p_operacao and agent_id = v_para) then
    raise exception 'agente_nao_autorizado_na_operacao' using errcode = '42501';
  end if;
  v_task := public.agent_delegar_tarefa(p_org, p_de, p_para_papel, p_tipo,
              coalesce(p_entrada, '{}'::jsonb) || jsonb_build_object('operacao_id', p_operacao), p_idempotency_key, p_parent);
  update public.agent_tasks set operacao_id = p_operacao where id = v_task.id and org_id = p_org and operacao_id is null;
  select * into v_task from public.agent_tasks where id = v_task.id;
  return v_task;
end
$$;

-- Humano: desempenho por operação/nicho (tarefas, falhas e custo reais; nada inventado).
create or replace function public.agent_operacoes_desempenho(p_org uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform public.agent_exigir_humano(p_org);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'operacao_id', o.id, 'nome', o.nome, 'nicho', o.nicho, 'produto', o.produto, 'regiao', o.regiao, 'status', o.status,
      'orcamento_usd_mes', o.orcamento_usd_mes,
      'agentes', (select count(*) from public.agent_operacao_agentes x where x.operacao_id = o.id),
      'tarefas_total', (select count(*) from public.agent_tasks t where t.operacao_id = o.id),
      'tarefas_abertas', (select count(*) from public.agent_tasks t where t.operacao_id = o.id and t.status in ('queued', 'processing')),
      'tarefas_concluidas', (select count(*) from public.agent_tasks t where t.operacao_id = o.id and t.status = 'succeeded'),
      'tarefas_falhas', (select count(*) from public.agent_tasks t where t.operacao_id = o.id and t.status = 'failed'),
      'custo_mes_usd', (select coalesce(round(sum(r.custo_usd), 4), 0) from public.agent_runs r join public.agent_tasks t on t.id = r.task_id
                        where t.operacao_id = o.id and r.iniciado_em >= date_trunc('month', now()))
    ) order by o.criado_em desc)
    from public.agent_operacoes o where o.org_id = p_org), '[]'::jsonb);
end
$$;

-- Decisão genérica não pode "aprovar" uma proposta de equipe/operação sem criar nada: exige a RPC própria.
create or replace function public.agent_decidir_aprovacao(p_approval uuid, p_aprovar boolean, p_motivo text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_user uuid; v_status text; v_payload jsonb;
begin
  select org_id, status, payload into v_org, v_status, v_payload from public.agent_approvals where id = p_approval;
  if v_org is null then raise exception 'aprovacao_inexistente' using errcode = '22023'; end if;
  v_user := public.agent_exigir_humano(v_org);
  if v_status <> 'pending' then raise exception 'aprovacao_ja_decidida' using errcode = '22023'; end if;
  if v_payload ? 'equipe' or v_payload ? 'operacao' then
    raise exception 'aprovacao_exige_rpc_propria' using errcode = '22023';
  end if;
  perform set_config('flow.agent_governanca', 'on', true);
  update public.agent_approvals
  set status = case when p_aprovar then 'approved' else 'rejected' end,
      decidido_por = v_user, decidido_em = now(), motivo_decisao = left(p_motivo, 500)
  where id = p_approval;
end
$$;

-- ───────────────────────────── ferramentas, matrizes e delegação ─────────────────────────────
do $$
begin
  perform set_config('flow.agent_governanca', 'on', true);
  insert into public.agent_tools (nome, descricao, risco) values
    ('consultar_memoria', 'Memória da organização (preferências, metas e decisões aprovadas, planos anteriores, feedback). Somente leitura.', 'read'),
    ('registrar_memoria', 'Registra uma nota na memória da organização (sem segredos nem dados pessoais). Não envia nada externo.', 'write_internal'),
    ('propor_operacao', 'Cria uma PROPOSTA de operação comercial (nicho, produto, estratégia) para aprovação humana. Não cria agentes nem permissões.', 'write_internal')
  on conflict (nome) do nothing;
end $$;

create or replace function public.agent_ferramentas_do_papel(p_papel text)
returns text[] language sql immutable as $$
  select case p_papel
    when 'ceo' then array['consultar_resumo_comercial', 'consultar_pipeline', 'consultar_oportunidades',
                          'consultar_execucoes_equipe', 'consultar_memoria', 'delegar_tarefa', 'propor_estrutura_equipe',
                          'registrar_memoria', 'propor_operacao']
    when 'gerente_comercial' then array['consultar_resumo_comercial', 'consultar_pipeline', 'consultar_oportunidades',
                                        'consultar_lead', 'consultar_execucoes_equipe', 'consultar_memoria', 'delegar_tarefa']
    when 'prospeccao' then array['consultar_resumo_comercial', 'consultar_oportunidades']
    when 'sdr' then array['consultar_oportunidades', 'consultar_lead']
    when 'vendedor' then array['consultar_oportunidades', 'consultar_lead', 'consultar_pipeline']
    when 'estrategista' then array['consultar_resumo_comercial', 'consultar_pipeline']
    when 'seo_geral' then array['consultar_resumo_comercial']
    else array[]::text[] end
$$;

-- Delegação interna habilitada por humano: agora inclui memória e proposta de operação para o CEO.
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
  for v_tool in select unnest(case when v_agent.papel = 'ceo'
      then array['delegar_tarefa', 'propor_estrutura_equipe', 'propor_operacao', 'registrar_memoria', 'consultar_memoria',
                 'consultar_pipeline', 'consultar_oportunidades', 'consultar_execucoes_equipe']
      else array['delegar_tarefa', 'consultar_memoria'] end) loop
    insert into public.agent_permissions (org_id, agent_id, tool_nome, ativo, concedida_por)
    values (v_agent.org_id, p_agent, v_tool, true, v_user)
    on conflict (agent_id, tool_nome) do update set ativo = true, concedida_por = v_user, concedida_em = now();
  end loop;
end
$$;

-- ───────────────────────────── 6) controle central do Super Admin (sem conteúdo de conversa) ─────────────────────────────
create or replace function public.ia_visao_orgs()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x order by x ->> 'org_nome'), '[]'::jsonb) from (
    select jsonb_build_object(
      'org_id', o.id, 'org_nome', o.nome,
      'ceo_estado', (select a.estado from public.agents a where a.org_id = o.id and a.papel = 'ceo'),
      'ceo_modelo', (select a.modelo from public.agents a where a.org_id = o.id and a.papel = 'ceo'),
      'ceo_kill_switch', coalesce((select a.kill_switch from public.agents a where a.org_id = o.id and a.papel = 'ceo'), false),
      'agentes', (select count(*) from public.agents a where a.org_id = o.id),
      'agentes_ativos', (select count(*) from public.agents a where a.org_id = o.id and a.estado = 'ativo'),
      'agentes_pausados', (select count(*) from public.agents a where a.org_id = o.id and a.estado = 'pausado'),
      'ferramentas_habilitadas', (select count(*) from public.agent_permissions p where p.org_id = o.id and p.ativo),
      'operacoes_ativas', (select count(*) from public.agent_operacoes op where op.org_id = o.id and op.status = 'ativa'),
      'execucoes_7d', (select count(*) from public.agent_runs r where r.org_id = o.id and r.iniciado_em >= now() - interval '7 days'),
      'falhas_7d', (select count(*) from public.agent_runs r where r.org_id = o.id and r.status = 'failed' and r.iniciado_em >= now() - interval '7 days'),
      'custo_dia_usd', (select coalesce(round(sum(r.custo_usd), 4), 0) from public.agent_runs r where r.org_id = o.id and r.iniciado_em >= date_trunc('day', now())),
      'custo_mes_usd', (select coalesce(round(sum(r.custo_usd), 4), 0) from public.agent_runs r where r.org_id = o.id and r.iniciado_em >= date_trunc('month', now())),
      'teto_dia_usd', (select e.teto_dia from public.agent_orcamento_org_estado(o.id) e),
      'teto_mes_usd', (select e.teto_mes from public.agent_orcamento_org_estado(o.id) e),
      'aprovacoes_pendentes', (select count(*) from public.agent_approvals ap where ap.org_id = o.id and ap.status = 'pending'),
      'aprovacoes_decididas', (select count(*) from public.agent_approvals ap where ap.org_id = o.id and ap.status in ('approved', 'rejected'))
    ) as x
    from public.orgs o where exists (select 1 from public.agents a where a.org_id = o.id)
  ) q
$$;

-- Consumo por modelo (tokens e custo agregados; nenhum conteúdo).
create or replace function public.ia_consumo_resumo(p_dias integer default 30)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'modelo', q.modelo, 'execucoes', q.execucoes, 'falhas', q.falhas,
    'tokens_in', q.tokens_in, 'tokens_out', q.tokens_out, 'custo_usd', q.custo) order by q.custo desc), '[]'::jsonb)
  from (
    select r.modelo, count(*)::int as execucoes, count(*) filter (where r.status = 'failed')::int as falhas,
           coalesce(sum(r.tokens_entrada), 0)::bigint as tokens_in, coalesce(sum(r.tokens_saida), 0)::bigint as tokens_out,
           coalesce(round(sum(r.custo_usd), 4), 0) as custo
    from public.agent_runs r
    where r.iniciado_em >= now() - make_interval(days => least(greatest(coalesce(p_dias, 30), 1), 365))
    group by r.modelo
  ) q
$$;

-- ───────────────────────────── permissões de execução ─────────────────────────────
revoke all on function
  public.ia_modelo_do_papel(text), public.agent_memoria_texto_ok(text), public.agent_memoria_inserir(uuid, uuid, uuid, text, text, text, text, uuid),
  public.agent_validar_def_operacao(jsonb), public.agent_membro_gestor(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.agent_membro_gestor(uuid) to authenticated;

revoke all on function public.ia_modelos_disponiveis() from public, anon;
grant execute on function public.ia_modelos_disponiveis() to authenticated;

revoke all on function
  public.agent_memoria_registrar_humano(uuid, text, text, text, uuid), public.agent_memoria_arquivar(uuid),
  public.agent_decidir_proposta_operacao(uuid, boolean, text), public.agent_operacao_definir_estado(uuid, text),
  public.agent_operacao_autorizar_agente(uuid, uuid, boolean), public.agent_operacoes_desempenho(uuid)
  from public, anon;
grant execute on function
  public.agent_memoria_registrar_humano(uuid, text, text, text, uuid), public.agent_memoria_arquivar(uuid),
  public.agent_decidir_proposta_operacao(uuid, boolean, text), public.agent_operacao_definir_estado(uuid, text),
  public.agent_operacao_autorizar_agente(uuid, uuid, boolean), public.agent_operacoes_desempenho(uuid)
  to authenticated;

revoke all on function
  public.agent_orcamento_org_estado(uuid), public.agent_tool_memoria(uuid, text, uuid, integer),
  public.agent_registrar_memoria(uuid, text, text, text, uuid), public.agent_propor_operacao(uuid, uuid, jsonb),
  public.agent_delegar_tarefa_op(uuid, uuid, text, text, jsonb, text, uuid, uuid),
  public.ia_visao_orgs(), public.ia_consumo_resumo(integer)
  from public, anon, authenticated;
grant execute on function
  public.agent_orcamento_org_estado(uuid), public.agent_tool_memoria(uuid, text, uuid, integer),
  public.agent_registrar_memoria(uuid, text, text, text, uuid), public.agent_propor_operacao(uuid, uuid, jsonb),
  public.agent_delegar_tarefa_op(uuid, uuid, text, text, jsonb, text, uuid, uuid),
  public.ia_visao_orgs(), public.ia_consumo_resumo(integer)
  to service_role;

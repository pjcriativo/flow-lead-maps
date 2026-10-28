-- CHAT DO CEO MESTRE (Prompt 42) — PREPARADA, NÃO APLICADA EM PRODUÇÃO. Idempotente. Incremental sobre 001–004.
-- Aplicar só com autorização explícita.
--  1) Conversas persistentes: agent_conversas + agent_conversa_mensagens, isoladas por ORGANIZAÇÃO e por
--     USUÁRIO (só o dono da conversa lê; nem o super admin da plataforma lê conversa alheia por RLS).
--  2) Escrita só pelo runtime (service_role, via Edge agent-ceo) com redação de segredos; humano só
--     arquiva/vincula operação à PRÓPRIA conversa.
--  3) Ferramenta de LEITURA consultar_operacoes: equipe, tarefas, atrasos, aprovações pendentes, leads e
--     desempenho por operação/categoria, tudo da organização do agente. Nada de envio externo.

-- ───────────────────────────── 1) conversas ─────────────────────────────
create table if not exists public.agent_conversas (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_id uuid not null,
  operacao_id uuid,
  titulo text not null default 'Nova conversa' check (length(btrim(titulo)) between 1 and 120),
  estado text not null default 'ativa' check (estado in ('ativa', 'arquivada')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (id, org_id),
  foreign key (agent_id, org_id) references public.agents(id, org_id) on delete cascade,
  foreign key (operacao_id, org_id) references public.agent_operacoes(id, org_id)
);
create index if not exists agent_conversas_user_idx on public.agent_conversas (org_id, user_id, atualizado_em desc) where estado = 'ativa';

create table if not exists public.agent_conversa_mensagens (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid not null,
  org_id uuid not null,
  papel text not null check (papel in ('user', 'assistant')),
  conteudo text not null check (length(conteudo) between 1 and 12000),
  client_message_id text check (client_message_id is null or length(client_message_id) <= 80),
  ferramentas text[] not null default '{}',
  -- ações geradas na resposta (propostas de operação/equipe, tarefas criadas): referências, nunca segredos
  acoes jsonb not null default '[]'::jsonb check (jsonb_typeof(acoes) = 'array' and length(acoes::text) <= 20000),
  task_id uuid,
  custo_usd numeric(12, 6) not null default 0,
  criado_em timestamptz not null default now(),
  foreign key (conversa_id, org_id) references public.agent_conversas(id, org_id) on delete cascade,
  foreign key (task_id, org_id) references public.agent_tasks(id, org_id)
);
create unique index if not exists agent_conversa_msg_idem_uidx
  on public.agent_conversa_mensagens (conversa_id, client_message_id, papel) where client_message_id is not null;
create index if not exists agent_conversa_msg_idx on public.agent_conversa_mensagens (conversa_id, criado_em);

alter table public.agent_conversas enable row level security;
alter table public.agent_conversa_mensagens enable row level security;
revoke all on public.agent_conversas, public.agent_conversa_mensagens from anon, authenticated;
grant select on public.agent_conversas, public.agent_conversa_mensagens to authenticated;

-- Só o DONO da conversa lê (e ainda precisa ser gestor da organização). Sem bypass de super admin.
drop policy if exists agent_conversas_select on public.agent_conversas;
create policy agent_conversas_select on public.agent_conversas for select to authenticated
  using (user_id = auth.uid() and (public.agent_membro_gestor(org_id) or public.eh_super_admin()));
drop policy if exists agent_conversa_mensagens_select on public.agent_conversa_mensagens;
create policy agent_conversa_mensagens_select on public.agent_conversa_mensagens for select to authenticated
  using (exists (select 1 from public.agent_conversas c
                 where c.id = agent_conversa_mensagens.conversa_id and c.org_id = agent_conversa_mensagens.org_id and c.user_id = auth.uid()
                   and (public.agent_membro_gestor(c.org_id) or public.eh_super_admin())));

-- Remove chaves/tokens de qualquer texto antes de gravar (nunca guarda credencial em mensagem).
create or replace function public.agent_chat_redigir(p_texto text)
returns text language sql immutable as $$
  select regexp_replace(
           regexp_replace(
             regexp_replace(
               regexp_replace(coalesce(p_texto, ''), 'sk-[A-Za-z0-9_-]{8,}', '[segredo removido]', 'g'),
               '(sbp_[A-Za-z0-9]{8,}|apify_api_[A-Za-z0-9]{6,})', '[segredo removido]', 'g'),
             'Bearer\s+[A-Za-z0-9._-]{12,}', '[segredo removido]', 'gi'),
           'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{4,}', '[segredo removido]', 'g')
$$;

-- O usuário da conversa precisa poder usar agentes na organização (mesma regra da Edge).
create or replace function public.agent_chat_usuario_ok(p_org uuid, p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.memberships m where m.org_id = p_org and m.user_id = p_user and m.papel::text in ('super_admin', 'admin', 'gerente'))
      or exists (select 1 from public.profiles p where p.id = p_user and p.is_super_admin)
$$;

-- ───────────────────────────── 2) RPCs do runtime ─────────────────────────────
create or replace function public.agent_conversa_abrir(
  p_org uuid, p_user uuid, p_agent uuid, p_conversa uuid default null, p_operacao uuid default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_c public.agent_conversas;
begin
  if not public.agent_chat_usuario_ok(p_org, p_user) then raise exception 'sem_permissao_na_organizacao' using errcode = '42501'; end if;
  if not exists (select 1 from public.agents where id = p_agent and org_id = p_org and papel = 'ceo') then
    raise exception 'agente_fora_da_organizacao' using errcode = '42501';
  end if;
  if p_operacao is not null and not exists (select 1 from public.agent_operacoes where id = p_operacao and org_id = p_org) then
    raise exception 'operacao_fora_da_organizacao' using errcode = '42501';
  end if;
  if p_conversa is not null then
    select * into v_c from public.agent_conversas where id = p_conversa and org_id = p_org and user_id = p_user and agent_id = p_agent;
    if v_c.id is null then raise exception 'conversa_inexistente' using errcode = '42501'; end if;
    if v_c.estado <> 'ativa' then raise exception 'conversa_arquivada' using errcode = '22023'; end if;
    return v_c.id;
  end if;
  insert into public.agent_conversas (org_id, user_id, agent_id, operacao_id) values (p_org, p_user, p_agent, p_operacao) returning id into v_id;
  return v_id;
end
$$;

-- Últimas mensagens (ordem cronológica) para dar continuidade de contexto ao CEO.
create or replace function public.agent_conversa_historico(p_org uuid, p_user uuid, p_conversa uuid, p_limite integer default 12)
returns table (papel text, conteudo text, criado_em timestamptz) language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (select 1 from public.agent_conversas where id = p_conversa and org_id = p_org and user_id = p_user) then
    raise exception 'conversa_inexistente' using errcode = '42501';
  end if;
  return query
  select h.papel, h.conteudo, h.criado_em from (
    select m.papel, m.conteudo, m.criado_em from public.agent_conversa_mensagens m
    where m.conversa_id = p_conversa and m.org_id = p_org
    order by m.criado_em desc limit least(greatest(coalesce(p_limite, 12), 1), 30)) h
  order by h.criado_em;
end
$$;

create or replace function public.agent_conversa_registrar(
  p_org uuid, p_user uuid, p_conversa uuid, p_client_message_id text, p_pergunta text, p_resposta text,
  p_ferramentas text[], p_acoes jsonb, p_task uuid, p_custo numeric
) returns void language plpgsql security definer set search_path = public as $$
declare v_c public.agent_conversas;
begin
  select * into v_c from public.agent_conversas where id = p_conversa and org_id = p_org and user_id = p_user and estado = 'ativa';
  if v_c.id is null then raise exception 'conversa_inexistente' using errcode = '42501'; end if;
  insert into public.agent_conversa_mensagens (conversa_id, org_id, papel, conteudo, client_message_id)
  values (p_conversa, p_org, 'user', left(public.agent_chat_redigir(p_pergunta), 12000), left(p_client_message_id, 80))
  on conflict do nothing;
  insert into public.agent_conversa_mensagens (conversa_id, org_id, papel, conteudo, client_message_id, ferramentas, acoes, task_id, custo_usd, criado_em)
  values (p_conversa, p_org, 'assistant', left(public.agent_chat_redigir(p_resposta), 12000), left(p_client_message_id, 80),
          coalesce(p_ferramentas, '{}'), coalesce(p_acoes, '[]'::jsonb),
          (select id from public.agent_tasks where id = p_task and org_id = p_org), greatest(coalesce(p_custo, 0), 0), now() + interval '1 millisecond')
  on conflict do nothing;
  update public.agent_conversas
  set atualizado_em = now(),
      titulo = case when titulo = 'Nova conversa' then left(btrim(regexp_replace(public.agent_chat_redigir(p_pergunta), '\s+', ' ', 'g')), 80) else titulo end
  where id = p_conversa;
end
$$;

-- ───────────────────────────── 3) ações do dono da conversa ─────────────────────────────
create or replace function public.agent_conversa_arquivar(p_conversa uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'governanca_exige_sessao_humana' using errcode = '42501'; end if;
  update public.agent_conversas set estado = 'arquivada', atualizado_em = now() where id = p_conversa and user_id = auth.uid();
  if not found then raise exception 'conversa_inexistente' using errcode = '42501'; end if;
end
$$;

create or replace function public.agent_conversa_definir_operacao(p_conversa uuid, p_operacao uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  if auth.uid() is null then raise exception 'governanca_exige_sessao_humana' using errcode = '42501'; end if;
  select org_id into v_org from public.agent_conversas where id = p_conversa and user_id = auth.uid() and estado = 'ativa';
  if v_org is null then raise exception 'conversa_inexistente' using errcode = '42501'; end if;
  if p_operacao is not null and not exists (select 1 from public.agent_operacoes where id = p_operacao and org_id = v_org and status <> 'encerrada') then
    raise exception 'operacao_fora_da_organizacao' using errcode = '42501';
  end if;
  update public.agent_conversas set operacao_id = p_operacao, atualizado_em = now() where id = p_conversa;
end
$$;

-- ───────────────────────────── 4) ferramenta de leitura: operações e pendências ─────────────────────────────
do $$
begin
  perform set_config('flow.agent_governanca', 'on', true);
  insert into public.agent_tools (nome, descricao, risco) values
    ('consultar_operacoes', 'Equipe, tarefas abertas e atrasadas, aprovações pendentes, leads novos e desempenho por operação e categoria da organização. Somente leitura.', 'read')
  on conflict (nome) do nothing;
end $$;

create or replace function public.agent_ferramentas_do_papel(p_papel text)
returns text[] language sql immutable as $$
  select case p_papel
    when 'ceo' then array['consultar_resumo_comercial', 'consultar_pipeline', 'consultar_oportunidades',
                          'consultar_execucoes_equipe', 'consultar_memoria', 'consultar_operacoes', 'delegar_tarefa',
                          'propor_estrutura_equipe', 'registrar_memoria', 'propor_operacao']
    when 'gerente_comercial' then array['consultar_resumo_comercial', 'consultar_pipeline', 'consultar_oportunidades',
                                        'consultar_lead', 'consultar_execucoes_equipe', 'consultar_memoria', 'consultar_operacoes', 'delegar_tarefa']
    when 'prospeccao' then array['consultar_resumo_comercial', 'consultar_oportunidades']
    when 'sdr' then array['consultar_oportunidades', 'consultar_lead']
    when 'vendedor' then array['consultar_oportunidades', 'consultar_lead', 'consultar_pipeline']
    when 'estrategista' then array['consultar_resumo_comercial', 'consultar_pipeline']
    when 'seo_geral' then array['consultar_resumo_comercial']
    else array[]::text[] end
$$;

create or replace function public.agent_tool_operacoes(p_agent uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  v_org := public.agent_validar_uso(p_agent, 'consultar_operacoes');
  return jsonb_build_object(
    'org_id', v_org, 'gerado_em', now(),
    'equipe', coalesce((
      select jsonb_agg(jsonb_build_object(
        'papel', a.papel, 'estado', a.estado, 'kill_switch', a.kill_switch,
        'tarefas_em_execucao', (select count(*) from public.agent_tasks t where t.agent_id = a.id and t.status = 'processing'),
        'tarefas_na_fila', (select count(*) from public.agent_tasks t where t.agent_id = a.id and t.status = 'queued'),
        'concluidas_hoje', (select count(*) from public.agent_tasks t where t.agent_id = a.id and t.status = 'succeeded' and t.atualizado_em >= date_trunc('day', now())),
        'falhas_7d', (select count(*) from public.agent_tasks t where t.agent_id = a.id and t.status = 'failed' and t.atualizado_em >= now() - interval '7 days'))
        order by a.papel) from public.agents a where a.org_id = v_org), '[]'::jsonb),
    'tarefas_atrasadas', coalesce((
      select jsonb_agg(jsonb_build_object('tipo', x.tipo, 'papel', x.papel, 'status', x.status, 'horas_na_fila', x.horas) order by x.horas desc)
      from (select t.tipo, a.papel, t.status, round(extract(epoch from (now() - t.criado_em)) / 3600)::int as horas
            from public.agent_tasks t join public.agents a on a.id = t.agent_id
            where t.org_id = v_org and t.status in ('queued', 'processing') and t.criado_em < now() - interval '24 hours'
            order by t.criado_em limit 15) x), '[]'::jsonb),
    'aprovacoes_pendentes', coalesce((
      select jsonb_agg(jsonb_build_object('id', ap.id, 'tipo', ap.tipo, 'resumo', left(ap.resumo, 200), 'horas', round(extract(epoch from (now() - ap.criado_em)) / 3600)::int) order by ap.criado_em)
      from (select * from public.agent_approvals where org_id = v_org and status = 'pending' order by criado_em limit 10) ap), '[]'::jsonb),
    'operacoes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', o.id, 'nome', o.nome, 'nicho', o.nicho, 'produto', o.produto, 'regiao', o.regiao, 'status', o.status,
        'orcamento_usd_mes', o.orcamento_usd_mes, 'papeis', o.papeis, 'papeis_pendentes', o.papeis_pendentes,
        'tarefas_abertas', (select count(*) from public.agent_tasks t where t.operacao_id = o.id and t.status in ('queued', 'processing')),
        'tarefas_concluidas', (select count(*) from public.agent_tasks t where t.operacao_id = o.id and t.status = 'succeeded'),
        'tarefas_falhas', (select count(*) from public.agent_tasks t where t.operacao_id = o.id and t.status = 'failed'),
        'custo_mes_usd', (select coalesce(round(sum(r.custo_usd), 4), 0) from public.agent_runs r join public.agent_tasks t on t.id = r.task_id
                          where t.operacao_id = o.id and r.iniciado_em >= date_trunc('month', now())))
        order by o.criado_em desc)
      from (select * from public.agent_operacoes where org_id = v_org and status <> 'encerrada' order by criado_em desc limit 10) o), '[]'::jsonb),
    'leads', jsonb_build_object(
      'novos_hoje', (select count(*) from public.leads where org_id = v_org and created_at >= date_trunc('day', now())),
      'novos_7d', (select count(*) from public.leads where org_id = v_org and created_at >= now() - interval '7 days'),
      'por_categoria_30d', coalesce((
        select jsonb_agg(jsonb_build_object('categoria', c.categoria, 'leads', c.total, 'ganhos', c.ganhos) order by c.total desc)
        from (select coalesce(nullif(category, ''), 'sem categoria') as categoria, count(*)::int as total, count(*) filter (where status = 'won')::int as ganhos
              from public.leads where org_id = v_org and created_at >= now() - interval '30 days'
              group by 1 order by 2 desc limit 5) c), '[]'::jsonb)));
end
$$;

-- CEO ganha a leitura de operações ao habilitar a delegação interna (humano concede).
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
                 'consultar_pipeline', 'consultar_oportunidades', 'consultar_execucoes_equipe', 'consultar_operacoes']
      else array['delegar_tarefa', 'consultar_memoria', 'consultar_operacoes'] end) loop
    insert into public.agent_permissions (org_id, agent_id, tool_nome, ativo, concedida_por)
    values (v_agent.org_id, p_agent, v_tool, true, v_user)
    on conflict (agent_id, tool_nome) do update set ativo = true, concedida_por = v_user, concedida_em = now();
  end loop;
end
$$;

-- ───────────────────────────── permissões de execução ─────────────────────────────
revoke all on function public.agent_chat_redigir(text), public.agent_chat_usuario_ok(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke all on function
  public.agent_conversa_abrir(uuid, uuid, uuid, uuid, uuid), public.agent_conversa_historico(uuid, uuid, uuid, integer),
  public.agent_conversa_registrar(uuid, uuid, uuid, text, text, text, text[], jsonb, uuid, numeric),
  public.agent_tool_operacoes(uuid)
  from public, anon, authenticated;
grant execute on function
  public.agent_conversa_abrir(uuid, uuid, uuid, uuid, uuid), public.agent_conversa_historico(uuid, uuid, uuid, integer),
  public.agent_conversa_registrar(uuid, uuid, uuid, text, text, text, text[], jsonb, uuid, numeric),
  public.agent_tool_operacoes(uuid)
  to service_role;
revoke all on function public.agent_conversa_arquivar(uuid), public.agent_conversa_definir_operacao(uuid, uuid) from public, anon;
grant execute on function public.agent_conversa_arquivar(uuid), public.agent_conversa_definir_operacao(uuid, uuid) to authenticated;

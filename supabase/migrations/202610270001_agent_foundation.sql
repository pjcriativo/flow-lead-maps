-- FUNDAÇÃO DO CEO DE IA (Prompt 28) — PREPARADA, NÃO APLICADA EM PRODUÇÃO.
-- Aplicar só com autorização explícita do dono. Idempotente (create if not exists / or replace).
--
-- Princípios:
--  1) Todo dado tem org_id e RLS. Chaves compostas (id, org_id) impedem filho de outra organização.
--  2) Humano governa, agente executa: agents / agent_permissions / agent_tools / decisões de
--     agent_approvals só mudam via RPC que EXIGE sessão humana (auth.uid()) com papel admin/gerente.
--     Um trigger recusa qualquer outra escrita (inclusive service_role) — o CEO não se auto-promove.
--  3) O runtime (service_role) só enfileira, reserva, registra passos e conclui. Não toca em limites.
--  4) Ferramenta única nesta fase: agent_resumo_comercial (SECURITY INVOKER, só leitura).
-- Depende de: orgs, memberships, profiles, leads, eh_super_admin(), papel_do_usuario() (042).

-- ───────────────────────────── helpers de governança ─────────────────────────────
create or replace function public.agent_pode_gerir(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_org is not null and (
    public.eh_super_admin()
    or coalesce(public.papel_do_usuario(p_org) in ('super_admin', 'admin', 'gerente'), false)
  )
$$;

-- Exige humano autenticado com papel de gestão na org. service_role (auth.uid() nulo) é recusado.
create or replace function public.agent_exigir_humano(p_org uuid)
returns uuid language plpgsql stable security definer set search_path = public as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'governanca_exige_sessao_humana' using errcode = '42501';
  end if;
  if not public.agent_pode_gerir(p_org) then
    raise exception 'sem_permissao_na_organizacao' using errcode = '42501';
  end if;
  return v_user;
end
$$;

-- Trigger de guarda: só RPCs de governança (que ligam a flag local) alteram tabelas governadas.
-- Exceção: ações referenciais em cascata (ON DELETE CASCADE / SET NULL ao apagar organização ou
-- usuário) rodam dentro de outro gatilho (pg_trigger_depth() > 1) e não podem ser bloqueadas.
-- DML direto, inclusive de service_role, tem profundidade 1 e continua recusado.
create or replace function public.agent_guard_governanca()
returns trigger language plpgsql set search_path = public as $$
begin
  if coalesce(current_setting('flow.agent_governanca', true), '') <> 'on' and pg_trigger_depth() <= 1 then
    raise exception 'governanca_agente_somente_via_rpc' using errcode = '42501';
  end if;
  return coalesce(new, old);
end
$$;

-- ───────────────────────────── catálogo de ferramentas (global) ─────────────────────────────
create table if not exists public.agent_tools (
  nome text primary key check (nome ~ '^[a-z][a-z0-9_]{2,60}$'),
  descricao text not null,
  risco text not null check (risco in ('read', 'write_internal', 'external_send', 'spend')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- ───────────────────────────── agentes ─────────────────────────────
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z][a-z0-9_]{1,40}$'),
  nome text not null check (length(btrim(nome)) between 1 and 80),
  papel text not null check (papel in ('ceo')),
  modelo text not null default 'claude-haiku-4-5' check (length(modelo) between 3 and 80),
  autonomia text not null default 'somente_leitura' check (autonomia in ('somente_leitura')),
  estado text not null default 'inativo' check (estado in ('inativo', 'ativo', 'pausado')),
  kill_switch boolean not null default false,
  teto_usd_dia numeric(10, 4) not null default 0.50 check (teto_usd_dia between 0 and 5),
  teto_usd_mes numeric(10, 4) not null default 5.00 check (teto_usd_mes between 0 and 50),
  max_passos integer not null default 4 check (max_passos between 1 and 8),
  max_tokens_saida integer not null default 800 check (max_tokens_saida between 100 and 2000),
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (org_id, slug),
  unique (id, org_id)
);

create table if not exists public.agent_permissions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  agent_id uuid not null,
  tool_nome text not null references public.agent_tools(nome) on delete cascade,
  ativo boolean not null default true,
  concedida_por uuid references auth.users(id) on delete set null,
  concedida_em timestamptz not null default now(),
  foreign key (agent_id, org_id) references public.agents(id, org_id) on delete cascade,
  unique (agent_id, tool_nome)
);

-- ───────────────────────────── fila de tarefas (padrão wa_envios) ─────────────────────────────
create table if not exists public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  agent_id uuid not null,
  tipo text not null check (tipo in ('copiloto_conversa')),
  entrada jsonb not null default '{}'::jsonb,
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'awaiting_approval', 'succeeded', 'failed', 'cancelled', 'blocked')),
  prioridade integer not null default 5 check (prioridade between 1 and 9),
  idempotency_key text not null check (length(idempotency_key) between 16 and 128),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 2 check (max_attempts between 1 and 5),
  next_attempt_at timestamptz not null default now(),
  lease_expires_at timestamptz,
  worker_id text,
  resultado jsonb,
  ultimo_erro text,
  solicitado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  concluido_em timestamptz,
  foreign key (agent_id, org_id) references public.agents(id, org_id) on delete cascade,
  unique (id, org_id),
  unique (org_id, idempotency_key)
);
create index if not exists agent_tasks_fila_idx
  on public.agent_tasks (status, prioridade, next_attempt_at) where status in ('queued', 'processing');

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  agent_id uuid not null,
  task_id uuid not null,
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'running' check (status in ('running', 'succeeded', 'failed', 'cancelled')),
  modelo text not null,
  tokens_entrada integer not null default 0 check (tokens_entrada >= 0),
  tokens_saida integer not null default 0 check (tokens_saida >= 0),
  custo_usd numeric(12, 6) not null default 0 check (custo_usd >= 0),
  passos integer not null default 0 check (passos >= 0),
  erro text,
  iniciado_em timestamptz not null default now(),
  finalizado_em timestamptz,
  foreign key (agent_id, org_id) references public.agents(id, org_id) on delete cascade,
  foreign key (task_id, org_id) references public.agent_tasks(id, org_id) on delete cascade,
  unique (id, org_id)
);
create index if not exists agent_runs_consumo_idx on public.agent_runs (agent_id, iniciado_em);

create table if not exists public.agent_run_steps (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  run_id uuid not null,
  seq integer not null check (seq >= 1),
  tipo text not null check (tipo in ('model', 'tool_call', 'tool_result', 'final', 'error', 'blocked')),
  tool_nome text,
  entrada jsonb,
  saida jsonb,
  tokens_entrada integer not null default 0 check (tokens_entrada >= 0),
  tokens_saida integer not null default 0 check (tokens_saida >= 0),
  custo_usd numeric(12, 6) not null default 0 check (custo_usd >= 0),
  duracao_ms integer check (duracao_ms is null or duracao_ms >= 0),
  erro text,
  criado_em timestamptz not null default now(),
  foreign key (run_id, org_id) references public.agent_runs(id, org_id) on delete cascade,
  unique (run_id, seq)
);

create table if not exists public.agent_approvals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  agent_id uuid not null,
  task_id uuid,
  tipo text not null check (tipo in ('acao_externa', 'gasto', 'mudanca_configuracao')),
  resumo text not null check (length(btrim(resumo)) between 1 and 500),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired')),
  decidido_por uuid references auth.users(id) on delete set null,
  decidido_em timestamptz,
  motivo_decisao text,
  criado_em timestamptz not null default now(),
  foreign key (agent_id, org_id) references public.agents(id, org_id) on delete cascade,
  foreign key (task_id, org_id) references public.agent_tasks(id, org_id) on delete cascade,
  check ((status = 'pending') = (decidido_por is null and decidido_em is null))
);

-- ───────────────────────────── triggers ─────────────────────────────
-- Tabelas governadas: só RPC de governança escreve.
drop trigger if exists agent_guard on public.agents;
create trigger agent_guard before insert or update or delete on public.agents
  for each row execute function public.agent_guard_governanca();
drop trigger if exists agent_guard on public.agent_permissions;
create trigger agent_guard before insert or update or delete on public.agent_permissions
  for each row execute function public.agent_guard_governanca();
drop trigger if exists agent_guard on public.agent_tools;
create trigger agent_guard before insert or update or delete on public.agent_tools
  for each row execute function public.agent_guard_governanca();

-- Aprovação: o runtime só cria 'pending'; qualquer mudança passa pela RPC humana.
create or replace function public.agent_approvals_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'pending' then
      raise exception 'aprovacao_nasce_pendente' using errcode = '42501';
    end if;
    return new;
  end if;
  if pg_trigger_depth() > 1 then return coalesce(new, old); end if;   -- cascata referencial
  if tg_op = 'DELETE' or coalesce(current_setting('flow.agent_governanca', true), '') <> 'on' then
    raise exception 'governanca_agente_somente_via_rpc' using errcode = '42501';
  end if;
  return new;
end
$$;
drop trigger if exists agent_approvals_guard on public.agent_approvals;
create trigger agent_approvals_guard before insert or update or delete on public.agent_approvals
  for each row execute function public.agent_approvals_guard();

-- Passos são append-only (rastreabilidade).
create or replace function public.agent_steps_append_only()
returns trigger language plpgsql set search_path = public as $$
begin
  raise exception 'agent_run_steps_e_append_only' using errcode = '42501';
end
$$;
drop trigger if exists agent_steps_imutaveis on public.agent_run_steps;
create trigger agent_steps_imutaveis before update on public.agent_run_steps
  for each row execute function public.agent_steps_append_only();

-- Transições válidas de tarefa (espelha TASK_TRANSITIONS em agent-runtime.ts).
create or replace function public.agent_tasks_transicao()
returns trigger language plpgsql set search_path = public as $$
begin
  new.atualizado_em := now();
  if new.status = old.status then return new; end if;
  if not (
    (old.status = 'queued' and new.status in ('processing', 'cancelled', 'blocked'))
    or (old.status = 'processing' and new.status in ('queued', 'succeeded', 'failed', 'cancelled', 'awaiting_approval'))
    or (old.status = 'awaiting_approval' and new.status in ('queued', 'cancelled', 'failed'))
    or (old.status = 'blocked' and new.status in ('queued', 'cancelled'))
  ) then
    raise exception 'transicao_invalida: % -> %', old.status, new.status using errcode = '22023';
  end if;
  return new;
end
$$;
drop trigger if exists agent_tasks_transicao on public.agent_tasks;
create trigger agent_tasks_transicao before update on public.agent_tasks
  for each row execute function public.agent_tasks_transicao();

-- ───────────────────────────── RLS (leitura por gestores; nenhuma policy de escrita) ─────────────────────────────
alter table public.agent_tools enable row level security;
alter table public.agents enable row level security;
alter table public.agent_permissions enable row level security;
alter table public.agent_tasks enable row level security;
alter table public.agent_runs enable row level security;
alter table public.agent_run_steps enable row level security;
alter table public.agent_approvals enable row level security;

drop policy if exists agent_tools_select on public.agent_tools;
create policy agent_tools_select on public.agent_tools for select to authenticated using (true);

drop policy if exists agents_select on public.agents;
create policy agents_select on public.agents for select to authenticated using (public.agent_pode_gerir(org_id));
drop policy if exists agent_permissions_select on public.agent_permissions;
create policy agent_permissions_select on public.agent_permissions for select to authenticated using (public.agent_pode_gerir(org_id));
drop policy if exists agent_tasks_select on public.agent_tasks;
create policy agent_tasks_select on public.agent_tasks for select to authenticated using (public.agent_pode_gerir(org_id));
drop policy if exists agent_runs_select on public.agent_runs;
create policy agent_runs_select on public.agent_runs for select to authenticated using (public.agent_pode_gerir(org_id));
drop policy if exists agent_run_steps_select on public.agent_run_steps;
create policy agent_run_steps_select on public.agent_run_steps for select to authenticated using (public.agent_pode_gerir(org_id));
drop policy if exists agent_approvals_select on public.agent_approvals;
create policy agent_approvals_select on public.agent_approvals for select to authenticated using (public.agent_pode_gerir(org_id));

revoke all on public.agent_tools, public.agents, public.agent_permissions, public.agent_tasks,
  public.agent_runs, public.agent_run_steps, public.agent_approvals from anon, authenticated;
grant select on public.agent_tools, public.agents, public.agent_permissions, public.agent_tasks,
  public.agent_runs, public.agent_run_steps, public.agent_approvals to authenticated;

-- ───────────────────────────── RPCs de GOVERNANÇA (sessão humana obrigatória) ─────────────────────────────
create or replace function public.agent_criar_ceo(p_org uuid)
returns public.agents language plpgsql security definer set search_path = public as $$
declare v_user uuid; v_agent public.agents;
begin
  v_user := public.agent_exigir_humano(p_org);
  perform set_config('flow.agent_governanca', 'on', true);
  insert into public.agents (org_id, slug, nome, papel, criado_por)
  values (p_org, 'ceo', 'CEO de IA', 'ceo', v_user)
  on conflict (org_id, slug) do nothing;
  select * into v_agent from public.agents where org_id = p_org and slug = 'ceo';
  return v_agent;
end
$$;

create or replace function public.agent_conceder_permissao(p_agent uuid, p_tool text)
returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_risco text; v_user uuid;
begin
  select org_id into v_org from public.agents where id = p_agent;
  if v_org is null then raise exception 'agente_inexistente' using errcode = '22023'; end if;
  v_user := public.agent_exigir_humano(v_org);
  select risco into v_risco from public.agent_tools where nome = p_tool and ativo;
  if v_risco is null then raise exception 'ferramenta_inexistente_ou_inativa' using errcode = '22023'; end if;
  -- autonomia 'somente_leitura' (única existente hoje) só admite ferramentas de leitura.
  if v_risco <> 'read' then raise exception 'ferramenta_acima_da_autonomia' using errcode = '42501'; end if;
  perform set_config('flow.agent_governanca', 'on', true);
  insert into public.agent_permissions (org_id, agent_id, tool_nome, ativo, concedida_por)
  values (v_org, p_agent, p_tool, true, v_user)
  on conflict (agent_id, tool_nome) do update set ativo = true, concedida_por = v_user, concedida_em = now();
end
$$;

create or replace function public.agent_revogar_permissao(p_agent uuid, p_tool text)
returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  select org_id into v_org from public.agents where id = p_agent;
  if v_org is null then raise exception 'agente_inexistente' using errcode = '22023'; end if;
  perform public.agent_exigir_humano(v_org);
  perform set_config('flow.agent_governanca', 'on', true);
  update public.agent_permissions set ativo = false where agent_id = p_agent and tool_nome = p_tool;
end
$$;

create or replace function public.agent_definir_estado(p_agent uuid, p_estado text)
returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  if p_estado not in ('inativo', 'ativo', 'pausado') then
    raise exception 'estado_invalido' using errcode = '22023';
  end if;
  select org_id into v_org from public.agents where id = p_agent;
  if v_org is null then raise exception 'agente_inexistente' using errcode = '22023'; end if;
  perform public.agent_exigir_humano(v_org);
  perform set_config('flow.agent_governanca', 'on', true);
  update public.agents set estado = p_estado, atualizado_em = now() where id = p_agent;
end
$$;

create or replace function public.agent_definir_limites(
  p_agent uuid, p_teto_dia numeric, p_teto_mes numeric, p_max_passos integer, p_modelo text default null
) returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  select org_id into v_org from public.agents where id = p_agent;
  if v_org is null then raise exception 'agente_inexistente' using errcode = '22023'; end if;
  perform public.agent_exigir_humano(v_org);
  perform set_config('flow.agent_governanca', 'on', true);
  update public.agents
  set teto_usd_dia = p_teto_dia, teto_usd_mes = p_teto_mes, max_passos = p_max_passos,
      modelo = coalesce(nullif(btrim(p_modelo), ''), modelo), atualizado_em = now()
  where id = p_agent;   -- os CHECKs de coluna impõem o teto absoluto (US$5/dia, US$50/mês)
end
$$;

-- Kill-switch da organização: trava todos os agentes e cancela o que está na fila.
create or replace function public.agent_kill_switch(p_org uuid, p_ligado boolean)
returns integer language plpgsql security definer set search_path = public as $$
declare v_canceladas integer := 0;
begin
  perform public.agent_exigir_humano(p_org);
  perform set_config('flow.agent_governanca', 'on', true);
  update public.agents set kill_switch = p_ligado, atualizado_em = now() where org_id = p_org;
  if p_ligado then
    update public.agent_tasks
    set status = 'cancelled', concluido_em = now(), lease_expires_at = null, worker_id = null,
        ultimo_erro = 'kill_switch'
    where org_id = p_org and status in ('queued', 'awaiting_approval', 'blocked');
    get diagnostics v_canceladas = row_count;
  end if;
  return v_canceladas;
end
$$;

create or replace function public.agent_cancelar_tarefa(p_task uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  select org_id into v_org from public.agent_tasks where id = p_task;
  if v_org is null then raise exception 'tarefa_inexistente' using errcode = '22023'; end if;
  perform public.agent_exigir_humano(v_org);
  update public.agent_tasks
  set status = 'cancelled', concluido_em = now(), lease_expires_at = null, worker_id = null,
      ultimo_erro = 'cancelada_por_humano'
  where id = p_task and status in ('queued', 'processing', 'awaiting_approval', 'blocked');
end
$$;

create or replace function public.agent_decidir_aprovacao(p_approval uuid, p_aprovar boolean, p_motivo text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_user uuid; v_status text;
begin
  select org_id, status into v_org, v_status from public.agent_approvals where id = p_approval;
  if v_org is null then raise exception 'aprovacao_inexistente' using errcode = '22023'; end if;
  v_user := public.agent_exigir_humano(v_org);
  if v_status <> 'pending' then raise exception 'aprovacao_ja_decidida' using errcode = '22023'; end if;
  perform set_config('flow.agent_governanca', 'on', true);
  update public.agent_approvals
  set status = case when p_aprovar then 'approved' else 'rejected' end,
      decidido_por = v_user, decidido_em = now(), motivo_decisao = left(p_motivo, 500)
  where id = p_approval;
end
$$;

-- ───────────────────────────── RPCs do RUNTIME (só service_role) ─────────────────────────────
create or replace function public.agent_enfileirar_tarefa(
  p_org uuid, p_agent uuid, p_tipo text, p_entrada jsonb, p_idempotency_key text, p_user uuid
) returns public.agent_tasks language plpgsql security definer set search_path = public as $$
declare v_task public.agent_tasks;
begin
  if not exists (select 1 from public.agents where id = p_agent and org_id = p_org) then
    raise exception 'agente_fora_da_organizacao' using errcode = '42501';
  end if;
  insert into public.agent_tasks (org_id, agent_id, tipo, entrada, idempotency_key, solicitado_por)
  values (p_org, p_agent, p_tipo, coalesce(p_entrada, '{}'::jsonb), p_idempotency_key, p_user)
  on conflict (org_id, idempotency_key) do nothing;
  select * into v_task from public.agent_tasks where org_id = p_org and idempotency_key = p_idempotency_key;
  return v_task;
end
$$;

-- Reserva UMA tarefa (padrão wa_reserve_delivery_batch): skip locked + lease + tentativas.
create or replace function public.agent_reservar_tarefa(p_worker text, p_task uuid, p_lease_seconds integer default 90)
returns setof public.agent_tasks language plpgsql security definer set search_path = public as $$
begin
  if nullif(btrim(p_worker), '') is null then raise exception 'worker_obrigatorio' using errcode = '22023'; end if;
  -- lease vencido: volta à fila se ainda há tentativas; senão falha (nunca reexecuta sem limite).
  update public.agent_tasks
  set status = case when attempt_count < max_attempts then 'queued' else 'failed' end,
      lease_expires_at = null, worker_id = null, ultimo_erro = 'lease_expirado',
      concluido_em = case when attempt_count < max_attempts then null else now() end
  where id = p_task and status = 'processing' and lease_expires_at < now();

  return query
  with alvo as (
    select t.id from public.agent_tasks t
    join public.agents a on a.id = t.agent_id and a.org_id = t.org_id
    where t.id = p_task and t.status = 'queued' and t.next_attempt_at <= now()
      and t.attempt_count < t.max_attempts
      and a.estado = 'ativo' and not a.kill_switch
    for update of t skip locked
  )
  update public.agent_tasks t
  set status = 'processing', attempt_count = t.attempt_count + 1, worker_id = p_worker,
      lease_expires_at = now() + make_interval(secs => p_lease_seconds)
  from alvo where t.id = alvo.id
  returning t.*;
end
$$;

create or replace function public.agent_concluir_tarefa(
  p_task uuid, p_status text, p_resultado jsonb default null, p_erro text default null,
  p_reenfileirar_em timestamptz default null
) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('succeeded', 'failed', 'cancelled', 'queued') then
    raise exception 'status_invalido' using errcode = '22023';
  end if;
  update public.agent_tasks
  set status = p_status, resultado = coalesce(p_resultado, resultado), ultimo_erro = left(p_erro, 500),
      next_attempt_at = case when p_status = 'queued' then coalesce(p_reenfileirar_em, now()) else next_attempt_at end,
      lease_expires_at = null, worker_id = null,
      concluido_em = case when p_status = 'queued' then null else now() end
  where id = p_task and status = 'processing';
end
$$;

create or replace function public.agent_iniciar_run(p_task uuid, p_modelo text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_task public.agent_tasks; v_run uuid;
begin
  select * into v_task from public.agent_tasks where id = p_task;
  if v_task.id is null then raise exception 'tarefa_inexistente' using errcode = '22023'; end if;
  insert into public.agent_runs (org_id, agent_id, task_id, user_id, modelo)
  values (v_task.org_id, v_task.agent_id, v_task.id, v_task.solicitado_por, p_modelo)
  returning id into v_run;
  return v_run;
end
$$;

create or replace function public.agent_registrar_passo(
  p_run uuid, p_seq integer, p_tipo text, p_tool text, p_entrada jsonb, p_saida jsonb,
  p_tokens_in integer, p_tokens_out integer, p_custo numeric, p_duracao_ms integer, p_erro text
) returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_inseridos integer;
begin
  select org_id into v_org from public.agent_runs where id = p_run;
  if v_org is null then raise exception 'run_inexistente' using errcode = '22023'; end if;
  insert into public.agent_run_steps (org_id, run_id, seq, tipo, tool_nome, entrada, saida,
    tokens_entrada, tokens_saida, custo_usd, duracao_ms, erro)
  values (v_org, p_run, p_seq, p_tipo, p_tool, p_entrada, p_saida,
    coalesce(p_tokens_in, 0), coalesce(p_tokens_out, 0), coalesce(p_custo, 0), p_duracao_ms, left(p_erro, 500))
  on conflict (run_id, seq) do nothing;   -- reexecução do mesmo passo não duplica
  get diagnostics v_inseridos = row_count;
  if v_inseridos = 1 then   -- só soma custo/tokens quando o passo é novo
    update public.agent_runs
    set tokens_entrada = tokens_entrada + coalesce(p_tokens_in, 0),
        tokens_saida = tokens_saida + coalesce(p_tokens_out, 0),
        custo_usd = custo_usd + coalesce(p_custo, 0),
        passos = greatest(passos, p_seq)
    where id = p_run;
  end if;
end
$$;

create or replace function public.agent_finalizar_run(p_run uuid, p_status text, p_erro text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('succeeded', 'failed', 'cancelled') then
    raise exception 'status_invalido' using errcode = '22023';
  end if;
  update public.agent_runs
  set status = p_status, erro = left(p_erro, 500), finalizado_em = now()
  where id = p_run and status = 'running';
end
$$;

create or replace function public.agent_consumo(p_agent uuid)
returns table (usd_dia numeric, usd_mes numeric) language sql stable security definer set search_path = public as $$
  select
    coalesce(sum(custo_usd) filter (where iniciado_em >= date_trunc('day', now())), 0),
    coalesce(sum(custo_usd) filter (where iniciado_em >= date_trunc('month', now())), 0)
  from public.agent_runs where agent_id = p_agent
$$;

create or replace function public.agent_solicitar_aprovacao(
  p_org uuid, p_agent uuid, p_task uuid, p_tipo text, p_resumo text, p_payload jsonb
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into public.agent_approvals (org_id, agent_id, task_id, tipo, resumo, payload)
  values (p_org, p_agent, p_task, p_tipo, p_resumo, coalesce(p_payload, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end
$$;

-- ───────────────────────────── FERRAMENTA: resumo comercial (SOMENTE LEITURA) ─────────────────────────────
-- SECURITY INVOKER: a RLS de `leads` (org, papel, atribuição) continua valendo para quem chama.
-- O filtro por org_id é explícito. Sem SQL livre: o modelo só aciona esta função, sem parâmetros.
-- Definições (mesmos limiares do funil em pipeline_status_counts): qualificado = score >= 70.
create or replace function public.agent_resumo_comercial(p_org uuid)
returns jsonb language sql stable security invoker set search_path = public as $$
  with base as (
    select status, score, created_at, coalesce(sem_contato, false) as sem_contato
    from public.leads where org_id = p_org
  )
  select jsonb_build_object(
    'org_id', p_org,
    'gerado_em', now(),
    'total_leads', (select count(*) from base),
    'por_status', coalesce((select jsonb_object_agg(status, n) from (select status, count(*) n from base group by status) s), '{}'::jsonb),
    'qualificados', jsonb_build_object(
      'criterio', 'score >= 70 (faixa média 70-79 e alta >= 80 do funil)',
      'total', (select count(*) from base where score >= 70)),
    'oportunidades_disponiveis', jsonb_build_object(
      'criterio', 'score >= 70, status new ou enriched, com contato (sem_contato = false)',
      'total', (select count(*) from base where score >= 70 and status in ('new', 'enriched') and not sem_contato)),
    'novos_ultimos_30_dias', (select count(*) from base where created_at >= now() - interval '30 days'),
    'ganhos', (select count(*) from base where status = 'won'),
    'perdidos', (select count(*) from base where status = 'lost')
  )
$$;

-- Funções: nada para anon/public; governança só para autenticado; runtime só service_role.
revoke all on function public.agent_pode_gerir(uuid), public.agent_exigir_humano(uuid) from public, anon;
grant execute on function public.agent_pode_gerir(uuid) to authenticated;

revoke all on function
  public.agent_criar_ceo(uuid), public.agent_conceder_permissao(uuid, text),
  public.agent_revogar_permissao(uuid, text), public.agent_definir_estado(uuid, text),
  public.agent_definir_limites(uuid, numeric, numeric, integer, text), public.agent_kill_switch(uuid, boolean),
  public.agent_cancelar_tarefa(uuid), public.agent_decidir_aprovacao(uuid, boolean, text),
  public.agent_resumo_comercial(uuid)
  from public, anon;
grant execute on function
  public.agent_criar_ceo(uuid), public.agent_conceder_permissao(uuid, text),
  public.agent_revogar_permissao(uuid, text), public.agent_definir_estado(uuid, text),
  public.agent_definir_limites(uuid, numeric, numeric, integer, text), public.agent_kill_switch(uuid, boolean),
  public.agent_cancelar_tarefa(uuid), public.agent_decidir_aprovacao(uuid, boolean, text),
  public.agent_resumo_comercial(uuid)
  to authenticated;

revoke all on function
  public.agent_enfileirar_tarefa(uuid, uuid, text, jsonb, text, uuid),
  public.agent_reservar_tarefa(text, uuid, integer),
  public.agent_concluir_tarefa(uuid, text, jsonb, text, timestamptz),
  public.agent_iniciar_run(uuid, text),
  public.agent_registrar_passo(uuid, integer, text, text, jsonb, jsonb, integer, integer, numeric, integer, text),
  public.agent_finalizar_run(uuid, text, text), public.agent_consumo(uuid),
  public.agent_solicitar_aprovacao(uuid, uuid, uuid, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function
  public.agent_enfileirar_tarefa(uuid, uuid, text, jsonb, text, uuid),
  public.agent_reservar_tarefa(text, uuid, integer),
  public.agent_concluir_tarefa(uuid, text, jsonb, text, timestamptz),
  public.agent_iniciar_run(uuid, text),
  public.agent_registrar_passo(uuid, integer, text, text, jsonb, jsonb, integer, integer, numeric, integer, text),
  public.agent_finalizar_run(uuid, text, text), public.agent_consumo(uuid),
  public.agent_solicitar_aprovacao(uuid, uuid, uuid, text, text, jsonb)
  to service_role;

-- ───────────────────────────── seed do catálogo ─────────────────────────────
do $$
begin
  perform set_config('flow.agent_governanca', 'on', true);
  insert into public.agent_tools (nome, descricao, risco)
  values ('consultar_resumo_comercial',
          'Resumo comercial da organização: total de leads, leads por status, qualificados, etapas do pipeline e oportunidades disponíveis. Somente leitura.',
          'read')
  on conflict (nome) do nothing;
end $$;

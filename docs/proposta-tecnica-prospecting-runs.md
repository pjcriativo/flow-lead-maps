# Proposta Técnica: Estrutura de Execuções e Persistência de Prospecções (`prospecting_runs`)

**Documento:** PROMPT 44 — ETAPA 22  
**Status:** PROPOSTA ARQUITETURAL VERSIONADA (NÃO APLICADA)  
**Data:** 2026-10-14  
**Objetivo:** Especificar o contrato de banco de dados, ciclo de vida de execuções recuperáveis, idempotência, auditoria de cotas e transacionalidade para o módulo Google Maps Premium sem aplicação de migrations não autorizadas.

---

## 1. Contexto e Diagnóstico Atual

Atualmente, o motor de busca (`supabase/functions/search-leads/index.ts`) opera com transmissão de stream NDJSON diretamente ao navegador. Durante o streaming:
1. Lugares são coletados e enriquecidos.
2. Inserções ocorrem individualmente na tabela `public.leads` com RLS por organização.
3. Ao término do streaming, o cliente no navegador chama `criarListaComLeads` (`src/lib/lists-api.ts`), que insere um registro em `public.lead_lists` e faz `UPDATE public.leads SET list_id = :list_id WHERE id IN (:lead_ids)`.

### Lacunas Operacionais Identificadas:
- **Ausência de ID de Execução Transacional (`run_id`):** Não há uma entidade no banco de dados que agrupe uma sessão de prospecção do início ao fim.
- **Risco de Abandono de Conexão:** Se o usuário fechar a aba ou a conexão for interrompida antes da chamada `criarListaComLeads`, os leads persistidos ficam sem lista vinculada (`list_id IS NULL`), impedindo sua recuperação posterior como uma busca unitária.
- **Métricas Voláteis:** Métricas como duração da coleta, total de empresas descartadas por duplicidade e parâmetros avançados de filtro ficam apenas nos logs do console ou são inferidas indiretamente por `api_consumption_logs`.
- **Falta de Idempotência:** Uma tentativa de re-execução ou reprocessamento pode tentar duplicar leads ou requisições à Apify sem um lock de concorrência no nível do banco.

---

## 2. Especificação do Esquema Proposto: `prospecting_runs`

A futura migration deverá criar duas tabelas relacionais dedicadas, com isolamento multi-tenant estrito por `org_id`:

```sql
-- 1. Enum para o ciclo de vida rigoroso da execução
create type public.prospecting_run_status as enum (
  'created',        -- Registro criado antes do disparo
  'collecting',     -- Provedor ativo coletando dados
  'qualifying',     -- Enriquecimento e pontuação de leads
  'persisting',     -- Gravando leads e vinculando à lista
  'completed',      -- Sucesso total com lista e leads confirmados
  'partial',        -- Interrompido ou erro parcial com dados salvos
  'interrupted',    -- Interrompido pelo usuário
  'failed'          -- Erro fatal sem persistência de leads
);

-- 2. Tabela de Execuções de Prospecção
create table if not exists public.prospecting_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  list_id uuid references public.lead_lists(id) on delete set null,
  
  -- Provedor e Chaves de Idempotência
  provider text not null default 'apify',
  request_key text not null, -- hash SHA-256 de (org_id, niche, city, uf, requested_count, timestamp_window)
  external_run_id text,      -- ID da run na Apify (quando aplicável)
  
  -- Critérios Originais da Prospecção
  niche text not null,
  category text,
  city text not null,
  uf text,
  center_lat double precision,
  center_lng double precision,
  radius_km numeric not null default 10,
  requested_count integer not null check (requested_count > 0),
  filters jsonb not null default '{}'::jsonb, -- filtrosCaptura, buscarEmails, etc.
  
  -- Métricas Consolidadas da Execução
  provider_found_count integer not null default 0,
  duplicate_count integer not null default 0,
  new_leads_count integer not null default 0,
  persisted_count integer not null default 0,
  
  -- Estado e Auditoria Temporal
  status public.prospecting_run_status not null default 'created',
  error_code text,
  error_details jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_ms integer,
  last_event_at timestamptz not null default now(),
  
  created_at timestamptz not null default now(),
  constraint uq_prospecting_runs_org_request unique (org_id, request_key)
);

-- 3. Tabela Associativa de Vínculo de Leads da Execução
create table if not exists public.prospecting_run_leads (
  run_id uuid not null references public.prospecting_runs(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  outcome text not null check (outcome in ('inserted', 'duplicate_ignored', 'quota_exceeded', 'error')),
  created_at timestamptz not null default now(),
  primary key (run_id, lead_id)
);
```

---

## 3. Índices Estruturais e Performance

Para garantir consultas instantâneas mesmo sob grande volume de dados no PostgreSQL (VPS própria ou Supabase):

```sql
create index if not exists idx_prospecting_runs_org_created 
  on public.prospecting_runs (org_id, created_at desc);

create index if not exists idx_prospecting_runs_org_status 
  on public.prospecting_runs (org_id, status);

create index if not exists idx_prospecting_runs_list_id 
  on public.prospecting_runs (list_id) 
  where list_id is not null;

create index if not exists idx_prospecting_run_leads_lead 
  on public.prospecting_run_leads (lead_id);
```

---

## 4. Políticas de RLS (Row Level Security)

```sql
alter table public.prospecting_runs enable row level security;
alter table public.prospecting_run_leads enable row level security;

-- Leitura: Usuários da organização ou super_admin
create policy "Membros leem execucoes da sua organizacao"
  on public.prospecting_runs for select
  using (public.eh_super_admin() or public.pertence_a_org(org_id));

create policy "Membros leem leads de execucoes da sua organizacao"
  on public.prospecting_run_leads for select
  using (exists (
    select 1 from public.prospecting_runs r
    where r.id = run_id and (public.eh_super_admin() or public.pertence_a_org(r.org_id))
  ));

-- Escrita: Restrita a chamadas autenticadas via Service Role / Edge Functions
revoke insert, update, delete on public.prospecting_runs from anon, authenticated;
revoke insert, update, delete on public.prospecting_run_leads from anon, authenticated;
grant all on public.prospecting_runs, public.prospecting_run_leads to service_role;
```

---

## 5. Estratégias Operacionais e Não-Funcionais

### 5.1. Reserva de Cotas e Transacionalidade
1. **Reserva Provisória:** Ao iniciar a busca, a Edge Function invoca a RPC de reserva com base no limite do plano.
2. **Commit Real:** Apenas os leads efetivamente inseridos como `new_leads_count` são debitados de forma atômica ao final da coleta.
3. **Rollback Seguro:** Se a busca falhar ou o provedor não encontrar resultados, nenhuma cota é consumida.

### 5.2. Idempotência por `request_key`
A chave de requisição previne duplicação se o usuário disparar múltiplos cliques ou se ocorrer retry de rede. Se uma execução já estiver em estado `collecting`, a requisição subsequente anexa-se ao stream existente em vez de iniciar um novo Actor na Apify.

### 5.3. Retenção e Capacidade
Para manter a sustentabilidade em instâncias PostgreSQL de VPS:
- Detalhes de eventos intermediários (`SearchEvent`) devem expirar após 30 dias.
- As métricas consolidadas em `prospecting_runs` permanecem perenes como histórico operacional da organização.
- Não há duplicação dos dados do lead: os atributos detalhados residem em `public.leads` e `public.prospecting_run_leads` atua apenas como índice relacional.

---

## 6. Conclusão

Esta especificação resolve a causa raiz da ausência de histórico transacional de prospecção, separando catálogo compartilhado de dados privados multi-tenant e fornecendo auditoria confiável para o plano empresarial e para o Histórico de Buscas (Tela 05).

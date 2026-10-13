# Prompt 36 — proposta de migrations (não executada)

Data da análise: 2026-10-13. Esta proposta é deliberadamente documental: nenhum SQL abaixo foi aplicado. O projeto Supabase configurado é `lyitsavnqwtsoouhcjie`; como o repositório não prova se ele é produção ou homologação, deve ser tratado como produção até confirmação externa.

## 1. `20261013_01_lead_lists_delete_restrict_and_safe_rpc.sql`

### Problema resolvido

`leads.list_id` usa `ON DELETE CASCADE`. Uma exclusão de `lead_lists` pode apagar leads e, por cascatas subsequentes, propostas, sites e histórico. As policies de organização permitem escrita genérica em `lead_lists`; a autorização de exclusão precisa ser mais restrita que a simples participação na organização.

### SQL proposto

```sql
begin;

lock table public.lead_lists in share row exclusive mode;
lock table public.leads in share row exclusive mode;

alter table public.leads
  drop constraint if exists leads_list_id_fkey;

alter table public.leads
  add constraint leads_list_id_fkey
  foreign key (list_id) references public.lead_lists(id)
  on delete restrict;

drop policy if exists org_lead_lists_all on public.lead_lists;
drop policy if exists "Users can CRUD own lead lists" on public.lead_lists;
create policy lead_lists_select on public.lead_lists for select
  using (public.eh_super_admin() or public.pertence_a_org(org_id));
create policy lead_lists_insert on public.lead_lists for insert
  with check (public.eh_super_admin() or public.pertence_a_org(org_id));
create policy lead_lists_update on public.lead_lists for update
  using (public.eh_super_admin() or public.pertence_a_org(org_id))
  with check (public.eh_super_admin() or public.pertence_a_org(org_id));
create policy lead_lists_delete on public.lead_lists for delete
  using (public.eh_super_admin() or (
    public.pertence_a_org(org_id)
    and public.papel_do_usuario(org_id) in ('admin', 'gerente')
  ));

create or replace function public.excluir_lista_vazia(p_lista_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_role text;
begin
  select org_id into v_org
  from public.lead_lists
  where id = p_lista_id
  for update;

  if not found then
    raise exception 'lista_nao_encontrada' using errcode = 'P0002';
  end if;

  v_role := public.papel_do_usuario(v_org);
  if not public.eh_super_admin() and coalesce(v_role, '') not in ('admin', 'gerente') then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if exists (select 1 from public.leads where list_id = p_lista_id) then
    raise exception 'lista_possui_leads' using errcode = '23503';
  end if;

  delete from public.lead_lists where id = p_lista_id;
end;
$$;

revoke all on function public.excluir_lista_vazia(uuid) from public, anon;
grant execute on function public.excluir_lista_vazia(uuid) to authenticated;

commit;
```

### Decisão

Recomenda-se `ON DELETE RESTRICT`. `SET NULL` preservaria os leads, mas permitiria destruir silenciosamente o contexto da lista e quebraria a rastreabilidade comercial. Soft delete é útil para retenção e auditoria, porém exige que todas as consultas passem a filtrar `deleted_at`; pode ser uma segunda etapa. A operação explícita de desvincular/mover leads deve ser separada da exclusão da lista.

### Dependências e impacto

- Depende de `papel_do_usuario`, `eh_super_admin`, `memberships` e `org_id` das migrations 042/043.
- Não altera dados existentes; a FK atual já garante que todo `list_id` referencia uma lista.
- O frontend deve trocar o `DELETE` direto pela RPC depois da implantação.
- Edge Functions que excluam listas devem chamar a mesma RPC; a auditoria local não encontrou outra entrada atual.

### Backup, execução e reversão

1. Backup lógico de `lead_lists`, `leads`, `campanhas`, `campanha_leads`, `propostas`, `sites_publicados`, `activity_log` e `lead_atribuicoes`.
2. Confirmar contagens por `list_id` e executar em janela curta, pois os locks bloqueiam escrita concorrente.
3. Validar: lista vazia por admin/gerente; lista não vazia; vendedor/SDR; ID de outra organização; chamadas concorrentes com inserção de lead.
4. Reversão técnica: remover a RPC e recriar a FK anterior. Recriar `CASCADE` não é recomendado; se inevitável, exige aprovação de risco explícita.

### Riscos

- Operações antigas que dependiam de apagar leads ao excluir a lista passarão a falhar, que é o comportamento de segurança pretendido.
- Uma organização sem membership consistente ficará bloqueada até saneamento, em vez de ganhar permissão implícita.

## 2. `20261013_02_prospecting_runs_transactional_lists.sql`

### Problema resolvido

A coleta grava leads durante o stream e o navegador cria/vincula a lista depois. Cancelamento, fechamento, timeout ou RLS parcial podem deixar leads sem lista ou uma lista incompleta, sem identidade de execução nem reconciliação.

### SQL proposto

```sql
begin;

create type public.prospecting_run_status as enum
  ('created', 'collecting', 'finalizing', 'completed', 'partial', 'failed', 'cancelled');

create table public.prospecting_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id),
  user_id uuid not null references auth.users(id),
  list_id uuid references public.lead_lists(id) on delete restrict,
  request_key text not null,
  list_name text not null,
  provider text not null,
  query jsonb not null default '{}'::jsonb,
  status public.prospecting_run_status not null default 'created',
  inserted_count integer not null default 0 check (inserted_count >= 0),
  duplicate_count integer not null default 0 check (duplicate_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  cost_units numeric not null default 0 check (cost_units >= 0),
  error jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  unique (org_id, request_key)
);

create table public.prospecting_run_leads (
  run_id uuid not null references public.prospecting_runs(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete restrict,
  outcome text not null check (outcome in ('inserted', 'duplicate', 'failed')),
  error jsonb,
  created_at timestamptz not null default now(),
  primary key (run_id, lead_id)
);

alter table public.prospecting_runs enable row level security;
alter table public.prospecting_run_leads enable row level security;

create policy prospecting_runs_select on public.prospecting_runs for select
  using (public.eh_super_admin() or public.pertence_a_org(org_id));
create policy prospecting_run_leads_select on public.prospecting_run_leads for select
  using (exists (
    select 1 from public.prospecting_runs r
    where r.id = run_id and (public.eh_super_admin() or public.pertence_a_org(r.org_id))
  ));

-- Escrita fica restrita ao backend/service role. A função de finalização deve:
-- 1) bloquear a run FOR UPDATE; 2) ser idempotente por request_key;
-- 3) criar uma única lista não vazia; 4) vincular somente IDs registrados na run e na mesma org;
-- 5) verificar ROW_COUNT; 6) atualizar contagens/status/custo; 7) commit único.

revoke insert, update, delete, truncate on public.prospecting_runs,
  public.prospecting_run_leads from anon, authenticated;

commit;
```

### Contrato de backend proposto

- `POST /prospecting-runs`: recebe `request_key`, nome da lista, provedor e parâmetros; retorna a execução existente em repetição.
- A Edge `search-leads` recebe `run_id`, registra cada resultado efetivo em `prospecting_run_leads` e contagens de duplicados/falhas/custo.
- `POST /prospecting-runs/:id/finalize`: transação única que cria a lista apenas quando há pelo menos um lead elegível, associa somente leads desta execução/organização e devolve `completed` ou `partial` com contagens verificadas.
- Um reconciliador marca execuções abandonadas como `partial` e pode retomar `finalizing`; nunca move leads antigos que não estejam registrados na execução.

### Impacto, compatibilidade e reversão

- Compatível em implantação gradual: o fluxo atual continua até a Edge e o cliente migrarem para `run_id`.
- Não altera deduplicação permanente nem provedores/cotas.
- O consumo deve ser contabilizado na mesma identidade `request_key`, evitando dupla cobrança em retry.
- Reversão: cliente volta ao contrato atual; as tabelas podem permanecer somente para auditoria. Não apagar histórico durante rollback.

### Testes necessários

Cancelamento, timeout, fechamento/reconexão, retry com mesma chave, listas vazias, duplicados, falha parcial, RLS cross-org, contagem de custo, duas finalizações simultâneas e recuperação de execução abandonada.

## 3. `20261013_03_channel_consent_and_outbound_idempotency.sql`

### Problema resolvido

E-mail e WhatsApp fazem verificações antes do provedor, mas não reservam atomicamente o envio. Duas requisições podem passar juntas. Se o provedor entrega e a persistência falha/expira, o estado fica incerto e um retry pode duplicar. `email_opt_out` não representa autorização nem revogação específica de WhatsApp.

### SQL proposto

```sql
begin;

create type public.contact_channel as enum ('email', 'whatsapp');
create type public.contact_permission_state as enum
  ('unknown', 'authorized', 'denied', 'revoked');
create type public.outbound_delivery_state as enum
  ('reserved', 'sending', 'delivered', 'failed_retryable', 'failed_final', 'uncertain');

create table public.lead_channel_permissions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id),
  lead_id uuid not null references public.leads(id) on delete cascade,
  channel public.contact_channel not null,
  state public.contact_permission_state not null default 'unknown',
  source text not null,
  legal_basis text,
  evidence jsonb,
  preference jsonb,
  authorized_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, lead_id, channel)
);

create table public.outbound_deliveries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id),
  user_id uuid not null references auth.users(id),
  lead_id uuid not null references public.leads(id) on delete restrict,
  campanha_id uuid references public.campanhas(id) on delete restrict,
  proposta_id uuid references public.propostas(id) on delete restrict,
  channel public.contact_channel not null,
  idempotency_key text not null,
  state public.outbound_delivery_state not null default 'reserved',
  attempt_count integer not null default 0,
  provider text not null,
  provider_message_id text,
  provider_response jsonb,
  last_error jsonb,
  reserved_at timestamptz not null default now(),
  lease_expires_at timestamptz not null,
  delivered_at timestamptz,
  reconciled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, channel, idempotency_key)
);

create unique index outbound_one_campaign_lead_channel
  on public.outbound_deliveries (org_id, campanha_id, lead_id, channel)
  where campanha_id is not null and state in ('reserved', 'sending', 'delivered', 'uncertain');

alter table public.lead_channel_permissions enable row level security;
alter table public.outbound_deliveries enable row level security;

create policy channel_permissions_select on public.lead_channel_permissions for select
  using (public.eh_super_admin() or public.pertence_a_org(org_id));
create policy outbound_deliveries_select on public.outbound_deliveries for select
  using (public.eh_super_admin() or public.pertence_a_org(org_id));

revoke insert, update, delete, truncate on public.lead_channel_permissions,
  public.outbound_deliveries from anon, authenticated;

commit;
```

### Contrato de reserva e envio

1. A Edge autentica o usuário e resolve a organização pelo JWT/membership; nunca aceita `org_id` do body.
2. Valida campanha, destinatário, aprovação, papel e `lead_channel_permissions.state = 'authorized'` para o canal. Telefone público mantém `unknown` e não autoriza WhatsApp.
3. Chama uma RPC `reserve_outbound_delivery(...)` `SECURITY DEFINER` que valida tudo novamente e faz `INSERT ... ON CONFLICT`; somente quem adquiriu a reserva recebe `reserved=true`.
4. Antes do provedor, muda para `sending` com lease. Envia uma chave idempotente ao provedor quando suportado.
5. Persiste resposta e ID do provedor como `delivered`. Falha de rede depois do request vira `uncertain`, nunca retry automático cego.
6. Retry só adquire lease expirada de `failed_retryable`. `uncertain` exige consulta/reconciliação no provedor ou ação humana.
7. `wa_envios` e campos de `propostas` passam a ser projeções/histórico atualizados após `delivered`; não são mais a trava de concorrência.

### Dependências e impactos

- `send-proposal`, `send-proposal-wa`, follow-up cron e qualquer job devem usar a mesma RPC antes de chamar Resend/Evolution.
- A chave sugerida é `campaign:{campanha_id}:lead:{lead_id}:channel:{channel}:purpose:initial`; follow-ups acrescentam o ordinal lógico, não timestamp aleatório.
- Consentimentos existentes não são inferidos. `email_opt_out=true` migra e-mail para `revoked`; demais registros ficam `unknown` até comprovação.
- WhatsApp em massa permanece bloqueado enquanto `unknown`; e-mail preserva o opt-out atual, mas também deve ganhar registro por canal antes de automação ampla.

### Backup, execução, reversão e riscos

1. Backup de `leads`, `propostas`, `campanhas`, `campanha_leads`, `wa_envios`, `wa_mensagens` e logs de provider.
2. Criar tabelas/RLS; backfill somente revogações comprovadas; publicar RPC; migrar Edges; testar concorrência; só então liberar massa por feature gate.
3. Reversão: bloquear massa novamente e voltar Edges; manter deliveries/permissões como trilha de auditoria.
4. Risco principal: provedores sem idempotency key não eliminam a janela de “entregou, resposta perdeu”; por isso `uncertain` e reconciliação são obrigatórios.

### Testes necessários

Duas chamadas simultâneas, duplo clique, retry com mesma chave, lease expirada, timeout antes/depois do provider, falha ao persistir, resposta duplicada de webhook, opt-out por canal, telefone público sem evidência, cross-org, vendedor/SDR fora da atribuição e reconciliação de estado incerto.

## Auditoria multi-tenant associada

- `lead_lists` recebeu policy genérica de organização na migration 043; isso permite que vendedor/SDR alcance o `DELETE` direto. A RPC acima restringe a admin/gerente/super-admin e a policy de delete deve ser separada das demais operações.
- `leads` já possui leitura por atribuição e delete restrito a admin/gerente. A criação/vinculação de listas ainda pode atualizar somente as linhas visíveis pelo RLS, razão da verificação de contagem adicionada na aplicação.
- `send-proposal-wa` usa service role após autenticar, mas filtra entidades por `user_id`; isso impede colaboração normal dentro da mesma organização e não representa ownership organizacional. A migração deve resolver `org_id` a partir da sessão e aplicar papel/atribuição sem trocar `user_id` indiscriminadamente.
- A função `org_do_usuario` escolhe a primeira membership. Usuários em múltiplas organizações exigem tenant ativo explícito no token/sessão antes de migrar Edges para `org_id`.

## Critério para liberar produção

Nenhuma migration deve ser aplicada diretamente em produção. Primeiro: restaurar backup em ambiente isolado, executar as migrations, rodar testes reais de RLS com usuários de duas organizações e todos os papéis, testes concorrentes no PostgreSQL e testes dos provedores em sandbox/cassette. Somente depois atualizar as Edges, observar reconciliação e remover os bloqueios de envio em massa.

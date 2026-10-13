# Prompt 38 — matriz consolidada de migrations (não executada)

Data da revisão: 2026-10-13. Este documento complementa, sem substituir,
`docs/prompt-36-proposta-migrations.md`. Nenhuma migration, policy, dado ou ambiente
Supabase foi alterado nesta etapa.

## Matriz

| Migration                                                  | Objetivo                                                                                                      | Prioridade                     | Dependências                                                              | Risco                                             |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------- |
| `20261013_01_lead_lists_delete_restrict_and_safe_rpc.sql`  | Trocar a FK destrutiva por `ON DELETE RESTRICT`, separar RLS de exclusão e centralizar o delete seguro em RPC | Bloqueador de produção         | `orgs`, `memberships`, `papel_do_usuario`, `eh_super_admin`               | Alto durante troca da FK; crítico se não aplicada |
| `20261013_02_prospecting_runs_transactional_lists.sql`     | Tornar coleta/finalização recuperável, idempotente e auditável                                                | Alta                           | Edge `search-leads`, identidade de organização ativa, chave de requisição | Médio; exige migração gradual do contrato         |
| `20261013_03_channel_consent_and_outbound_idempotency.sql` | Registrar autorização por canal e reservar envios de forma atômica                                            | Bloqueador para envio em massa | Resend, Evolution, webhooks, campanhas, propostas, tenant ativo           | Alto; estados incertos exigem reconciliação       |
| `20261013_04_commercial_catalog_and_offers.sql`            | Persistir produtos, serviços e ofertas por organização sem confundir rascunho com oferta publicada            | Alta                           | Organizações, memberships, moeda e regras comerciais definidas            | Médio; risco de duplicação no backfill            |
| `20261013_05_list_strategy_versions.sql`                   | Persistir estratégia por lista, versões e vínculo explícito com campanhas                                     | Alta                           | Migration 04, listas, campanhas, identidade organizacional                | Médio; snapshots exigem contrato versionado       |

As três primeiras propostas, incluindo SQL, impactos, backup, testes e reversão,
permanecem válidas no documento do Prompt 36. A revisão encontrou uma ressalva
operacional: enquanto a migration 01 não for aplicada, o frontend continua usando
`DELETE` direto após suas verificações. Isso reduz o risco, mas não fecha a janela de
corrida nem substitui a FK estrutural.

## 4. `20261013_04_commercial_catalog_and_offers.sql`

### SQL proposto

```sql
begin;

create type public.commercial_item_kind as enum ('product', 'service');
create type public.commercial_offer_status as enum ('draft', 'active', 'archived');

create table public.commercial_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete restrict,
  kind public.commercial_item_kind not null,
  name text not null check (length(trim(name)) between 1 and 160),
  description text,
  active boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, kind, name)
);

create table public.commercial_offers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete restrict,
  item_id uuid references public.commercial_items(id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 160),
  description text,
  audience text,
  benefits text,
  value_proposition text,
  price_amount numeric(14,2) check (price_amount is null or price_amount >= 0),
  currency char(3),
  commercial_terms text,
  objective text,
  status public.commercial_offer_status not null default 'draft',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((price_amount is null and currency is null) or
         (price_amount is not null and currency is not null))
);

create index commercial_items_org_active_idx
  on public.commercial_items (org_id, active, kind);
create index commercial_offers_org_status_idx
  on public.commercial_offers (org_id, status);

alter table public.commercial_items enable row level security;
alter table public.commercial_offers enable row level security;

create policy commercial_items_select on public.commercial_items for select
  using (public.eh_super_admin() or public.pertence_a_org(org_id));
create policy commercial_items_write on public.commercial_items for all
  using (public.eh_super_admin() or public.papel_do_usuario(org_id) in ('admin', 'gerente'))
  with check (public.eh_super_admin() or public.papel_do_usuario(org_id) in ('admin', 'gerente'));
create policy commercial_offers_select on public.commercial_offers for select
  using (public.eh_super_admin() or public.pertence_a_org(org_id));
create policy commercial_offers_write on public.commercial_offers for all
  using (public.eh_super_admin() or public.papel_do_usuario(org_id) in ('admin', 'gerente'))
  with check (public.eh_super_admin() or public.papel_do_usuario(org_id) in ('admin', 'gerente'));

commit;
```

### Impacto e dependências

- É aditiva e não altera os rascunhos atuais, que existem apenas na memória do navegador.
- Produto e serviço usam uma entidade única com tipo explícito; oferta referencia o item
  quando aplicável, mas também admite oferta composta sem `item_id`.
- Depende de tenant ativo confiável. `org_id` nunca deve ser aceito diretamente do cliente.
- Antes de ativar edição para vendedores, a matriz de permissões deve decidir se eles podem
  criar rascunhos; o SQL conservador limita escrita a admin/gerente.

### Backup e aplicação sem perda

1. Backup lógico de `orgs`, `memberships` e qualquer fonte externa usada para importar
   catálogo/ofertas.
2. Criar tipos, tabelas, índices e policies sem backfill na primeira implantação.
3. Publicar leitura atrás de feature flag; importar dados somente por lote idempotente com
   relatório de duplicidades, sem converter os rascunhos locais atuais.
4. Liberar escrita somente após testes RLS. Nenhuma coluna existente deve ser removida.

### Testes

- RLS entre duas organizações e todos os papéis.
- Produto, serviço, oferta composta e oferta vinculada.
- Preço/moeda consistente, nomes vazios, duplicidade e arquivamento.
- Importação repetida sem duplicar dados e leitura apenas do tenant ativo.

### Reversão

Desligar a feature flag e voltar a interface ao estado temporário. Se já houver dados,
preservar as tabelas como somente leitura; não executar `DROP TABLE` em rollback. Remoção
física exige exportação validada e aprovação separada.

## 5. `20261013_05_list_strategy_versions.sql`

### SQL proposto

```sql
begin;

create type public.list_strategy_version_status as enum
  ('draft', 'published', 'archived');

create table public.list_strategies (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete restrict,
  list_id uuid not null references public.lead_lists(id) on delete restrict,
  offer_id uuid references public.commercial_offers(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, list_id)
);

create table public.list_strategy_versions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete restrict,
  strategy_id uuid not null references public.list_strategies(id) on delete restrict,
  version integer not null check (version > 0),
  status public.list_strategy_version_status not null default 'draft',
  content_schema_version integer not null default 1 check (content_schema_version > 0),
  content jsonb not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (strategy_id, version),
  check ((status = 'published' and published_at is not null) or status <> 'published')
);

create unique index one_published_strategy_version
  on public.list_strategy_versions (strategy_id)
  where status = 'published';

create table public.list_strategy_campaigns (
  org_id uuid not null references public.orgs(id) on delete restrict,
  strategy_version_id uuid not null references public.list_strategy_versions(id) on delete restrict,
  campaign_id uuid not null references public.campanhas(id) on delete restrict,
  linked_by uuid not null references auth.users(id) on delete restrict,
  linked_at timestamptz not null default now(),
  primary key (strategy_version_id, campaign_id)
);

alter table public.list_strategies enable row level security;
alter table public.list_strategy_versions enable row level security;
alter table public.list_strategy_campaigns enable row level security;

create policy list_strategies_org on public.list_strategies for all
  using (public.eh_super_admin() or public.pertence_a_org(org_id))
  with check (public.eh_super_admin() or public.pertence_a_org(org_id));
create policy list_strategy_versions_org on public.list_strategy_versions for all
  using (public.eh_super_admin() or public.pertence_a_org(org_id))
  with check (public.eh_super_admin() or public.pertence_a_org(org_id));
create policy list_strategy_campaigns_org on public.list_strategy_campaigns for all
  using (public.eh_super_admin() or public.pertence_a_org(org_id))
  with check (public.eh_super_admin() or public.pertence_a_org(org_id));

commit;
```

Em produção, a gravação deve ocorrer por RPC transacional que derive `org_id`, confira se
lista, oferta, versão e campanha pertencem ao mesmo tenant, serialize o próximo número de
versão e publique no máximo uma versão. As policies acima são a camada mínima; a RPC e
policies por papel devem ser fechadas antes da liberação.

### Impacto e dependências

- É aditiva: follow-up, `gold_count` e existência de campanha não serão convertidos em
  estratégia, pois não provam configuração comercial.
- O JSON versionado deve possuir schema validado contendo oferta/contexto, abordagem,
  canais, sequência e rascunhos. `content_schema_version` permite evolução controlada.
- O vínculo aponta para a versão usada pela campanha, preservando auditoria mesmo quando
  uma nova estratégia for publicada.
- Depende da migration 04 e da proteção `ON DELETE RESTRICT` das listas.

### Backup e aplicação sem perda

1. Backup lógico de `lead_lists`, `campanhas`, `campanha_leads`, `commercial_items` e
   `commercial_offers`.
2. Criar estruturas vazias e validar RLS/RPC em ambiente restaurado.
3. Não fazer backfill inferido. Estratégias começam ausentes até um usuário salvar um
   rascunho explícito.
4. Liberar leitura, depois rascunhos e, por último, publicação/vínculo de campanhas por
   feature flags independentes.

### Testes

- Cross-org, papéis, lista/oferta/campanha de tenants diferentes e concorrência ao criar
  versões.
- Um único rascunho/publicado conforme contrato, histórico imutável, schema JSON inválido,
  arquivamento e campanha vinculada à versão exata.
- Compatibilidade de versões antigas do schema e rollback da UI sem perder histórico.

### Reversão

Desabilitar escrita/publicação e voltar a Central ao estado neutro. Manter versões e
vínculos em modo somente leitura. Não apagar estratégias nem desvincular campanhas durante
rollback; uma migration posterior pode arquivar registros após exportação e validação.

## Ordem recomendada e bloqueadores

1. Confirmar tenant ativo e restaurar backup em ambiente isolado.
2. Aplicar/testar a proteção de FK e RPC segura (01).
3. Implantar execuções recuperáveis sem trocar provedores (02).
4. Criar catálogo/ofertas (04) e depois estratégias versionadas (05).
5. Manter envio em massa bloqueado até consentimento, reserva atômica, reconciliação e
   testes de provider em sandbox estarem homologados (03).

Bloqueadores de produção atuais: FK com `ON DELETE CASCADE`, exclusão ainda não atômica,
ausência de estratégia/oferta persistida e ausência de autorização/idempotência estrutural
para envios em massa.

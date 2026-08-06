-- Consumo Apify: custo real por run, conciliação do incidente e escrita apenas no servidor.

alter table public.api_consumption_logs
  add column if not exists external_id text;

create unique index if not exists api_consumption_logs_service_external_id_key
  on public.api_consumption_logs (service, external_id);

comment on column public.api_consumption_logs.external_id is
  'ID idempotente do provedor (por exemplo, actor run ID da Apify).';
comment on column public.api_consumption_logs.cost_usd is
  'Custo real informado pelo provedor; nunca estimativa por quantidade de leads.';

-- As linhas antigas usavam quantity * US$ 0,001, inclusive para OSM gratuito. O valor
-- inventado é zerado e preservado nos metadados para auditoria.
update public.api_consumption_logs
set service = case
      when metadata->>'fonte' = 'osm' then 'osm_free'
      when metadata->>'fonte' = 'geoapify' then 'geoapify_free'
      else service
    end,
    action = 'legacy_search_estimate_invalidated',
    external_id = 'legacy:' || id::text,
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'legacy_estimated_cost_usd', cost_usd,
      'cost_source', 'legacy_estimate_invalidated'
    ),
    cost_usd = 0,
    cost_brl = 0
where action = 'search_crawled'
  and coalesce(metadata->>'cost_source', '') = '';

-- Conciliação do incidente informado em 06/08/2026: a conta Apify mostrou US$ 2,82
-- após uma única busca do super admin, enquanto nenhum run havia sido lançado no livro-caixa.
with usuario as (
  select id
  from public.profiles
  where lower(email) = 'marcosg1.pereira@gmail.com'
  limit 1
), organizacao as (
  select m.org_id
  from public.memberships m
  join usuario u on u.id = m.user_id
  order by m.criada_em
  limit 1
)
insert into public.api_consumption_logs (
  org_id,
  user_id,
  service,
  action,
  external_id,
  quantity,
  cost_usd,
  cost_brl,
  metadata,
  created_at
)
select
  o.org_id,
  u.id,
  'apify_maps',
  'account_reconciliation',
  'reconciliation:apify-account:2026-08-06',
  0,
  2.82,
  15.792,
  jsonb_build_object(
    'cost_source', 'apify_account_usage_reported',
    'reason', 'run não registrado pelo fluxo legado quando zero leads foram finalizados'
  ),
  timestamptz '2026-08-06 12:43:16+00'
from usuario u
cross join organizacao o
on conflict (service, external_id) do update
set org_id = excluded.org_id,
    user_id = excluded.user_id,
    cost_usd = excluded.cost_usd,
    cost_brl = excluded.cost_brl,
    metadata = excluded.metadata;

-- O navegador não pode fabricar custo ou atribuí-lo a outra organização. Todos os novos
-- lançamentos são feitos pela Edge search-leads com service role.
drop policy if exists "Usuários autenticados podem inserir logs de consumo"
  on public.api_consumption_logs;

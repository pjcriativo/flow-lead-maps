-- Permite recuperar uma coleta Apify que continuou após o timeout HTTP da Edge.
-- O run é iniciado uma única vez; chamadas posteriores apenas consultam o mesmo run/dataset.

alter table public.redes_buscas
  add column if not exists request_id text,
  add column if not exists apify_run_id text,
  add column if not exists apify_dataset_id text,
  add column if not exists apify_chave_id uuid,
  add column if not exists cache_key text,
  add column if not exists resultado jsonb;

create unique index if not exists redes_buscas_user_request_key
  on public.redes_buscas (user_id, request_id)
  where request_id is not null;

create index if not exists redes_buscas_apify_run_idx
  on public.redes_buscas (apify_run_id)
  where apify_run_id is not null;

comment on column public.redes_buscas.request_id is
  'ID idempotente criado pelo cliente para recuperar a mesma busca após timeout HTTP.';
comment on column public.redes_buscas.apify_run_id is
  'Run Apify já iniciado; a recuperação nunca abre outro run pago.';
comment on column public.redes_buscas.resultado is
  'Resposta final persistida para repetição idempotente da consulta.';

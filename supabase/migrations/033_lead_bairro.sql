-- BAIRRO do lead — extraído do endereço (Google Places). O parser (src/lib/bairro.ts) roda no
-- backfill e na ingestão; aqui só a coluna. Cobertura reportada: ~73% dos leads com endereço.
alter table public.leads add column if not exists bairro text;
create index if not exists leads_bairro_idx on public.leads (user_id, bairro);

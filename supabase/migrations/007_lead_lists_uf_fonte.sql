-- PARTE 3 — "Minhas Listas": cada busca vira uma lista salva. A tabela lead_lists
-- já existe (migration 001) com name/city/niche/radius/total_leads/counts. Faltavam
-- a UF e a fonte da busca para exibir/filtrar por lista.
alter table public.lead_lists add column if not exists uf text;
alter table public.lead_lists add column if not exists fonte text;

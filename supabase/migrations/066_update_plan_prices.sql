-- Alinha o catálogo operacional aos preços públicos aprovados em 2026-08-06.
-- Os IDs e limites existentes são preservados para não afetar organizações vinculadas.

update public.planos
set nome = 'Básico', preco = 147.00, periodo = 'mensal'
where lower(nome) in ('starter', 'basic', 'básico', 'basico', 'flow leads basic');

update public.planos
set nome = 'Pro', preco = 297.00, periodo = 'mensal'
where lower(nome) in ('pro', 'flow leads pro');

update public.planos
set nome = 'Agência', preco = 897.00, periodo = 'mensal'
where lower(nome) in ('enterprise', 'agency', 'agência', 'agencia', 'flow leads agencia');

-- ETAPA 4.1 — canal de campanha (REUSA o motor: campanhas/campanha_leads/propostas/portão são
-- OS MESMOS; só ganham um discriminador de canal). NENHUMA tabela de pipeline nova.
--
-- (a) campanhas.canal: 'email' (default, não quebra as existentes) | 'whatsapp'.
-- (b) campanhas.wa_config: config POR CAMPANHA do canal WhatsApp (variações editáveis + intervalo
--     com jitter). É configuração de canal, não regra de motor duplicada.
-- (c) wa_envios ganha o que foi REALMENTE enviado (variação + texto) — base do "nunca repete duas
--     seguidas" (o edge lê a última variação da campanha) e do histórico (ETAPA 4.3).

alter table public.campanhas
  add column if not exists canal text not null default 'email'
  check (canal in ('email', 'whatsapp'));

-- Config do canal WhatsApp por campanha. Ex.:
-- { "intervalo_min": 35, "intervalo_max": 60,
--   "variacoes": [ {"id":"v1","texto":"Oi {{nome}}...","ativa":true}, ... ] }
alter table public.campanhas
  add column if not exists wa_config jsonb;

-- O que saiu de fato (histórico + revezamento sem repetir a anterior).
alter table public.wa_envios add column if not exists variacao_id text;
alter table public.wa_envios add column if not exists mensagem text;
create index if not exists wa_envios_campanha_idx
  on public.wa_envios (campanha_id, enviado_em desc);

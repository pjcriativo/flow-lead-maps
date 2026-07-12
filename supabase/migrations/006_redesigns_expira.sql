-- Fase 3 — Redesign fica salvo 15 dias (paridade com os sites publicados).
-- O REGISTRO permanece para histórico mesmo após expirar; o html pode ser
-- limpo depois (política de retenção). Aqui só garantimos a data de expiração.
alter table public.redesigns
  add column if not exists expira_em timestamptz;

-- Novos redesigns já nascem com 15 dias de validade.
alter table public.redesigns
  alter column expira_em set default (now() + interval '15 days');

-- Backfill: redesigns já existentes ganham expira_em = criado_em + 15 dias.
update public.redesigns
  set expira_em = criado_em + interval '15 days'
  where expira_em is null;

create index if not exists idx_redesigns_expira on public.redesigns(expira_em);

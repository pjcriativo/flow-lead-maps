-- Fase 2 (FIX 2) — FOLLOW-UP com OPT-IN por LISTA. O cron NÃO varre mais tudo:
-- só processa leads cuja LISTA (lead_list) tenha a automação LIGADA pelo usuário.
-- Default DESLIGADO — o usuário liga explicitamente ("Ativar follow-up nesta lista").
-- Continua valendo todo o resto: pula quem saiu de 'proposta_enviada', 1 por lead,
-- opt-out (LGPD), teto da rampa.
alter table public.lead_lists
  add column if not exists follow_up_ativo boolean not null default false;

-- Acelera o filtro do cron por listas ligadas.
create index if not exists idx_lead_lists_followup_ativo
  on public.lead_lists(follow_up_ativo) where follow_up_ativo;

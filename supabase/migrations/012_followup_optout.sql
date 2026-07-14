-- Fase 2 — Follow-up automático por e-mail (D+3) + opt-out (LGPD).
-- Habilita agendamento (pg_cron) e HTTP de dentro do Postgres (pg_net) para o
-- cron diário chamar a Edge Function follow-up-cron. Adiciona o rastro do
-- follow-up na proposta e o opt-out global no lead.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Rastro do follow-up na proposta (1 por lead por ora; contador p/ futuro).
alter table public.propostas add column if not exists follow_up_enviado_em timestamptz;
alter table public.propostas add column if not exists follow_up_count int not null default 0;
alter table public.propostas add column if not exists follow_up_message_id text;

-- Opt-out GLOBAL do lead (uma vez opt-out, fora de proposta E follow-up).
-- opt_out_token: segredo por lead usado no link de descadastro do rodapé.
alter table public.leads add column if not exists email_opt_out boolean not null default false;
alter table public.leads add column if not exists email_opt_out_em timestamptz;
alter table public.leads add column if not exists opt_out_token text;

-- Acelera a seleção do cron (proposta enviada, D+3, sem follow-up).
create index if not exists idx_propostas_followup
  on public.propostas(status, enviada_em, follow_up_count);

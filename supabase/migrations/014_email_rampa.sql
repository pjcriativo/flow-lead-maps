-- Fase 2 — RAMPA DE AQUECIMENTO do domínio de e-mail.
-- Teto DIÁRIO de envios que cresce por dia de domínio ativo (proposta + follow-up
-- SOMADOS). O excedente do dia fica pra amanhã (a fila já existe: o cron/limite
-- não marca o que não enviou). ramp_start = dia que ligou produção (null = rampa
-- não iniciada). Tiers/max configuráveis. Função SECURITY DEFINER conta GLOBAL
-- (todos os envios do domínio), chamada por send-proposal (user) e follow-up-cron.

create table if not exists public.email_config (
  id int primary key default 1,
  ramp_start date, -- null = rampa não iniciada (produção não ligada)
  ramp_tiers jsonb not null default
    '[{"ate":3,"teto":20},{"ate":6,"teto":40},{"ate":9,"teto":80},{"ate":13,"teto":150}]'::jsonb,
  ramp_max int not null default 300, -- teto após o último tier (D14+)
  updated_at timestamptz not null default now(),
  constraint email_config_singleton check (id = 1)
);
insert into public.email_config (id) values (1) on conflict (id) do nothing;

alter table public.email_config enable row level security;
drop policy if exists "config leitura" on public.email_config;
create policy "config leitura" on public.email_config for select using (true);
-- Escrita só via service_role (bypassa RLS) — sem policy de insert/update.

-- Status da rampa HOJE (global, dia UTC). Somatório proposta+follow-up do dia.
create or replace function public.email_rampa_status()
returns table (ativa boolean, dia int, teto int, enviados_hoje int, restante int)
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg public.email_config;
  d int;
  t int;
  n int;
begin
  select * into cfg from public.email_config where id = 1;
  select
    (select count(*) from public.propostas where enviada_em >= date_trunc('day', now()))
    + (select count(*) from public.propostas where follow_up_enviado_em >= date_trunc('day', now()))
  into n;

  if cfg.ramp_start is null then
    return query select false, 0, cfg.ramp_max, n, greatest(0, cfg.ramp_max - n);
    return;
  end if;

  d := (current_date - cfg.ramp_start) + 1; -- dia 1 no start
  select coalesce(min((tier->>'teto')::int), cfg.ramp_max) into t
  from jsonb_array_elements(cfg.ramp_tiers) as tier
  where (tier->>'ate')::int >= d;
  if t is null then t := cfg.ramp_max; end if;

  return query select true, d, t, n, greatest(0, t - n);
end $$;

grant execute on function public.email_rampa_status() to authenticated, anon, service_role;

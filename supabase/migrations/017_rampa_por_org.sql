-- Fase 2 (FIX 3) — RAMPA POR ORG. Antes o teto/contagem eram GLOBAIS (email_config
-- singleton id=1): 2 orgs dividiam a mesma cota — uma consumia a da outra. Agora a
-- config é POR ORG e email_rampa_status conta SÓ os envios da PRÓPRIA org. Cada org
-- tem sua data de início (ramp_start) e sua contagem diária (proposta + follow-up
-- somados) isoladas. RLS: org só lê a sua config; a contagem também é só da sua org.
--
-- "org" = user_id: NÃO há tabela organizations neste app — cada usuário é uma agência,
-- todas as tabelas são keyed por user_id (RLS = auth.uid() = user_id). Quando existir
-- uma tabela de organizações, trocar user_id -> org_id aqui e no cron.
--
-- NOTA / TODO (não construir agora — decisão já no blueprint): EMAIL_FROM ainda é
-- GLOBAL (contato@flowgenius.com.br) — todas as orgs compartilham a MESMA reputação
-- de domínio. Próximo passo: identidade de envio por org (subdomínio próprio + reply-to
-- da org). Ver TODO em send-proposal e follow-up-cron.

-- 1) Reconstrói email_config como POR ORG, herdando o ramp_start global atual para as
--    orgs existentes (o domínio já aquece desde a virada de produção — não zerar o
--    progresso). Novas orgs nascem sem rampa (ramp_start null).
do $$
declare
  g record;
begin
  select ramp_start, ramp_tiers, ramp_max into g from public.email_config where id = 1;

  drop table if exists public.email_config;

  create table public.email_config (
    user_id uuid primary key references auth.users(id) on delete cascade,
    ramp_start date, -- null = rampa não iniciada (org sem produção ligada)
    ramp_tiers jsonb not null default
      '[{"ate":3,"teto":20},{"ate":6,"teto":40},{"ate":9,"teto":80},{"ate":13,"teto":150}]'::jsonb,
    ramp_max int not null default 300,
    updated_at timestamptz not null default now()
  );

  insert into public.email_config (user_id, ramp_start, ramp_tiers, ramp_max)
  select distinct l.user_id,
         g.ramp_start,
         coalesce(g.ramp_tiers, '[{"ate":3,"teto":20},{"ate":6,"teto":40},{"ate":9,"teto":80},{"ate":13,"teto":150}]'::jsonb),
         coalesce(g.ramp_max, 300)
  from (select distinct user_id from public.leads where user_id is not null) l;
end $$;

alter table public.email_config enable row level security;
drop policy if exists "config leitura" on public.email_config;
drop policy if exists "email_config own read" on public.email_config;
-- Cada org só lê a SUA config. Escrita só via service_role (bypassa RLS).
create policy "email_config own read" on public.email_config
  for select using (auth.uid() = user_id);

-- 2) Status da rampa AGORA por org. Usuário autenticado sempre vê a SUA (auth.uid()
--    tem prioridade); o service_role (cron) passa p_user_id explícito por org.
drop function if exists public.email_rampa_status();
drop function if exists public.email_rampa_status(uuid);
create or replace function public.email_rampa_status(p_user_id uuid default null)
returns table (ativa boolean, dia int, teto int, enviados_hoje int, restante int)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := coalesce(auth.uid(), p_user_id); -- user autenticado NÃO pode forjar outra org
  cfg public.email_config;
  d int;
  t int;
  n int;
  def_tiers jsonb := '[{"ate":3,"teto":20},{"ate":6,"teto":40},{"ate":9,"teto":80},{"ate":13,"teto":150}]'::jsonb;
  def_max int := 300;
begin
  if uid is null then
    return query select false, 0, 0, 0, 0; -- sem contexto de org
    return;
  end if;

  select * into cfg from public.email_config where user_id = uid;

  -- contagem do dia SÓ da própria org (proposta + follow-up somados, dia UTC)
  select
    (select count(*) from public.propostas
       where user_id = uid and enviada_em >= date_trunc('day', now()))
    + (select count(*) from public.propostas
       where user_id = uid and follow_up_enviado_em >= date_trunc('day', now()))
  into n;

  if cfg.user_id is null or cfg.ramp_start is null then
    -- sem config OU rampa não iniciada: sem restrição além do teto máximo
    return query select false, 0, coalesce(cfg.ramp_max, def_max), n,
                        greatest(0, coalesce(cfg.ramp_max, def_max) - n);
    return;
  end if;

  d := (current_date - cfg.ramp_start) + 1; -- dia 1 no start
  select coalesce(min((tier->>'teto')::int), coalesce(cfg.ramp_max, def_max)) into t
  from jsonb_array_elements(coalesce(cfg.ramp_tiers, def_tiers)) as tier
  where (tier->>'ate')::int >= d;
  if t is null then t := coalesce(cfg.ramp_max, def_max); end if;

  return query select true, d, t, n, greatest(0, t - n);
end $$;

grant execute on function public.email_rampa_status(uuid) to authenticated, anon, service_role;

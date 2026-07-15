-- FASE 4 — expiração + limpeza automática. Agenda o cron diário que cumpre a promessa da
-- copy do follow-up ("eu tiro essa página do ar em {N} dias").
--
-- A rota /site/<slug> JÁ devolve 410 depois do expira_em (confirmado em produção). O que
-- faltava era a parte invisível: o arquivo ficava no Storage e o HTML no banco, para sempre.
-- A edge expirar-sites remove o peso e MANTÉM o registro (histórico/métrica).
--
-- Reusa o mesmo segredo do follow-up (vault: followup_cron_secret) — é o mesmo cron do mesmo
-- projeto chamando as próprias edges; um segredo por job só multiplicaria a superfície.
-- Roda 03:00 UTC (00h BRT): longe do follow-up (12:00 UTC) e fora do horário comercial.

-- Índice da varredura: vencidos que ainda têm arquivo.
create index if not exists idx_sites_expiracao
  on public.sites_publicados(arquivos_removidos, expira_em);

do $$
begin
  if exists (select 1 from cron.job where jobname = 'expirar-sites-diario') then
    perform cron.unschedule('expirar-sites-diario');
  end if;
end $$;

select cron.schedule(
  'expirar-sites-diario',
  '0 3 * * *',
  $job$
  select net.http_post(
    url := 'https://lyitsavnqwtsoouhcjie.supabase.co/functions/v1/expirar-sites',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'followup_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $job$
);

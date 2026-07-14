-- Fase 2 — Agenda o follow-up diário. O pg_cron chama a Edge Function
-- follow-up-cron 1x/dia às 12:00 UTC (09:00 America/Sao_Paulo) via pg_net.
-- O CRON_SECRET NÃO fica literal aqui: é lido do Vault (followup_cron_secret),
-- que precisa existir (setado no provisionamento). A função valida esse segredo
-- no header x-cron-secret (verify_jwt=false).

-- Idempotente: re-cria o agendamento se já existir.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'followup-diario') then
    perform cron.unschedule('followup-diario');
  end if;
end $$;

select cron.schedule(
  'followup-diario',
  '0 12 * * *',
  $job$
  select net.http_post(
    url := 'https://lyitsavnqwtsoouhcjie.supabase.co/functions/v1/follow-up-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'followup_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $job$
);

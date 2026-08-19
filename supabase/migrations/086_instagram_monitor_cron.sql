-- Fase 6 — Agendamento de monitoramento de concorrentes. O pg_cron chama a Edge Function
-- instagram-monitor-cron a cada 6 horas via pg_net.
-- O CRON_SECRET é lido do Vault (followup_cron_secret), reutilizando o segredo
-- já configurado para as automações (verify_jwt=false, com secret header).

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
declare
  job_exists boolean;
begin
  select exists (select 1 from cron.job where jobname = 'instagram-monitor-cron') into job_exists;
  if job_exists then
    perform cron.unschedule('instagram-monitor-cron');
  end if;
end $$;

select cron.schedule(
  'instagram-monitor-cron',
  '0 */6 * * *',
  $$
  select net.http_post(
    url := 'https://lyitsavnqwtsoouhcjie.supabase.co/functions/v1/instagram-monitor-cron',
    headers := jsonb_build_object(
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'followup_cron_secret')
    )
  );
  $$
);

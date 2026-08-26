-- Agenda o motor de comentarios somente depois de worker e Edge Function publicados.
-- O segredo permanece no Vault e nunca e gravado na migration.

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'instagram-session-automation-cron') then
    perform cron.unschedule('instagram-session-automation-cron');
  end if;
end $$;

select cron.schedule(
  'instagram-session-automation-cron',
  '*/2 * * * *',
  $$
  select net.http_post(
    url := 'https://lyitsavnqwtsoouhcjie.supabase.co/functions/v1/instagram-session-automation-cron',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-cron-secret', (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'followup_cron_secret'
      )
    ),
    body := '{"maxAccounts":1}'::jsonb
  );
  $$
);

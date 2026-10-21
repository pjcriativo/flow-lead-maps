-- Agendamento do executor de automações WhatsApp — NÃO aplicar antes da homologação.
--
-- Mesmo agendado, nada executa enquanto wa_automation_platform_controls.automation_execution_enabled
-- estiver travado em false (CHECK) e a organização não ligar o motor: o runner só registra
-- execuções bloqueadas. Nenhuma ação envia WhatsApp.
-- Idempotente. Para desligar: select cron.unschedule('wa-automation-runner');
do $$
begin
  if exists (select 1 from cron.job where jobname = 'wa-automation-runner') then
    perform cron.unschedule('wa-automation-runner');
  end if;
end $$;

select cron.schedule(
  'wa-automation-runner',
  '* * * * *',
  $job$
  select net.http_post(
    url := 'https://lyitsavnqwtsoouhcjie.supabase.co/functions/v1/wa-automation-runner',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'followup_cron_secret')
    ),
    body := '{"limit":25}'::jsonb,
    timeout_milliseconds := 55000
  );
  $job$
);

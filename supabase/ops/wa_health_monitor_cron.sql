-- Agendamento do monitor de saúde dos números WhatsApp (somente leitura no provedor).
--
-- O que faz a cada 2 min: GET /instance/status dos chips ativos com checagem vencida (máx. 25,
-- 4 em paralelo, 8 s de timeout) e reaplica o webhook de recebimento em chip CONECTADO que o
-- tenha perdido. Não desconecta, não cria/exclui instância, não envia mensagem.
-- Validado em 2026-10-21: execução manual => {"checked":2,"healthy":2,"webhooks_reaplicados":0}.
-- Idempotente. Para desligar: select cron.unschedule('wa-health-monitor');
do $$
begin
  if exists (select 1 from cron.job where jobname = 'wa-health-monitor') then
    perform cron.unschedule('wa-health-monitor');
  end if;
end $$;

select cron.schedule(
  'wa-health-monitor',
  '*/2 * * * *',
  $job$
  select net.http_post(
    url := 'https://lyitsavnqwtsoouhcjie.supabase.co/functions/v1/wa-health-monitor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'followup_cron_secret')
    ),
    body := '{"limit":25}'::jsonb,
    timeout_milliseconds := 55000
  );
  $job$
);

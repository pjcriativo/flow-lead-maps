-- Agendador da automação (ETAPA D). Roda a cada 3h e chama automacao-rodar em modo CRON
-- (x-cron-secret). O edge só age nas receitas 'ativa' VENCIDAS (diária/semanal) e respeita os
-- tetos. Como toda receita nasce ativa=false, o cron NÃO faz nada até o dono ligar uma.
-- Reusa o mesmo segredo dos outros crons (vault: followup_cron_secret).
do $$
begin
  if exists (select 1 from cron.job where jobname = 'automacao-prospeccao') then
    perform cron.unschedule('automacao-prospeccao');
  end if;
end $$;

select cron.schedule(
  'automacao-prospeccao',
  '0 */3 * * *',
  $job$
  select net.http_post(
    url := 'https://lyitsavnqwtsoouhcjie.supabase.co/functions/v1/automacao-rodar',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'followup_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $job$
);

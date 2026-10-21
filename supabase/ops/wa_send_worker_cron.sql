-- NÃO APLICAR ANTES DA HOMOLOGAÇÃO DO ENVIO DE CAMPANHAS (movido de migrations/ em 2026-10-21
-- para não ser aplicado por engano). Liga o disparo automático das campanhas LIBERADAS.
-- Agendamento do worker de envio de campanhas WhatsApp (2026-10-21).
--
-- AUTORIZAÇÃO: ligado por ordem explícita do dono em 2026-10-21 ("sim" ao envio automático),
-- conforme a REGRA 1 do CLAUDE.md. Antes disso nenhuma campanha era enviada sozinha.
--
-- O worker só envia o que já passou por todas as travas: campanha aprovada, status 'ativa',
-- dispatch_enabled=true, dentro da janela de horário, lead com consentimento, chip saudável
-- escolhido pelo rodízio e abaixo do teto diário. Sem nada elegível, cada execução é um no-op.
--
-- O segredo vem do vault (followup_cron_secret = CRON_SECRET das Edges), como os demais crons.
-- Idempotente: remove o job homônimo antes de recriar.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'wa-send-worker') then
    perform cron.unschedule('wa-send-worker');
  end if;
end $$;

select cron.schedule(
  'wa-send-worker',
  '* * * * *',
  $job$
  select net.http_post(
    url := 'https://lyitsavnqwtsoouhcjie.supabase.co/functions/v1/wa-send-worker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'followup_cron_secret')
    ),
    body := '{"limit":10}'::jsonb,
    timeout_milliseconds := 55000
  );
  $job$
);

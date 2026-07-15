-- COPY APROVADA — portão "sem motivo claro".
-- A copy da proposta afirma um problema concreto ({motivo}, classificado das flags do
-- score_breakdown). Quando as flags não permitem classificar — lead antigo sem os sinais, ou
-- site que está no ar e não é fraco — não existe proposta honesta a escrever: o dono decide.
--
-- Estado PRÓPRIO (e não 'erro'): não é falha do sistema, é ausência de motivo. Também não é
-- 'descartado', que é decisão do dono — aqui o lead fica sinalizado, esperando essa decisão.
alter table public.campanha_leads drop constraint if exists campanha_leads_estado_check;
alter table public.campanha_leads add constraint campanha_leads_estado_check
  check (estado in ('pendente','gerando','rascunho','aprovado','descartado','erro','sem_motivo'));

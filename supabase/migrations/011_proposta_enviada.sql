-- Fase 2 — status próprio 'proposta_enviada' + rastro do envio real (Resend).
-- Distingue "contatei" (contacted) de "mandei proposta e aguardo resposta"
-- (proposta_enviada) — pré-requisito do follow-up. Também guarda o id da
-- mensagem retornado pelo Resend e o destinatário, para auditoria do envio.

-- 1) Novo estado aceito na constraint de leads.status.
alter table public.leads drop constraint if exists leads_status_check;
alter table public.leads add constraint leads_status_check
  check (status in (
    'new', 'enriched', 'contacted', 'proposta_enviada',
    'responded', 'meeting', 'won', 'lost', 'nurture'
  ));

-- 2) Rastro do envio na proposta (id do Resend + destinatário).
alter table public.propostas add column if not exists email_message_id text;
alter table public.propostas add column if not exists email_para text;

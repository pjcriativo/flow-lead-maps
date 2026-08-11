-- Migration 075: Rastreamento de E-mails do Resend (Webhooks)
-- Adiciona colunas para registrar aberturas, cliques e falhas de entrega de e-mails enviados.

ALTER TABLE public.propostas
  ADD COLUMN IF NOT EXISTS aberta_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS clicada_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMPTZ;

-- Índice para busca rápida de propostas pelo ID da mensagem enviada no Resend (usado pelo webhook)
CREATE INDEX IF NOT EXISTS propostas_email_message_id_idx ON public.propostas (email_message_id) WHERE email_message_id IS NOT NULL;

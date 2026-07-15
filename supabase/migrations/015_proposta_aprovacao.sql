-- Fase 2 (FIX 1) — PORTÃO DE REVISÃO: nada sai sem aprovação humana.
-- No plugin original TUDO era comando do usuário e a proposta virava rascunho no
-- Gmail — o humano revisava e mandava. Aqui: a proposta NASCE 'rascunho' e só pode
-- ser enviada depois de 'aprovada'. O envio (send-proposal) passa a EXIGIR status
-- 'aprovada' — trava no SERVIDOR, não só na UI. Ciclo: rascunho → aprovada →
-- enviada → respondida. aprovada_em = auditoria de quando o humano liberou.

alter table public.propostas drop constraint if exists propostas_status_check;
alter table public.propostas add constraint propostas_status_check
  check (status in ('rascunho', 'aprovada', 'enviada', 'respondida'));

alter table public.propostas add column if not exists aprovada_em timestamptz;

-- Flow Business: persiste o modo de challenge pendente entre sessões de browser.
-- Permite que o card de conta detecte e retome um challenge_required sem perder contexto.

ALTER TABLE public.ig_instancias
  ADD COLUMN IF NOT EXISTS pending_challenge_mode TEXT
    CHECK (pending_challenge_mode IN ('app_approval', 'verification_code'));

COMMENT ON COLUMN public.ig_instancias.pending_challenge_mode IS
  'Modo de challenge pendente: app_approval (aprovar no app) ou verification_code (código SMS/email). NULL quando não há challenge ativo.';

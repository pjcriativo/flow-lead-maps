-- Desafios nativos do Instagram não possuem continuação programática.
-- Persistimos o estado para informar o usuário sem repetir tentativas de login.

ALTER TABLE public.ig_instancias
  DROP CONSTRAINT IF EXISTS ig_instancias_pending_challenge_mode_check;

ALTER TABLE public.ig_instancias
  ADD CONSTRAINT ig_instancias_pending_challenge_mode_check
  CHECK (pending_challenge_mode IN ('app_approval', 'verification_code', 'manual_verification'));

COMMENT ON COLUMN public.ig_instancias.pending_challenge_mode IS
  'Modo de challenge pendente: app_approval (Bloks), verification_code (SMS/email) ou manual_verification (validação nativa no dispositivo confiável). NULL quando não há challenge ativo.';

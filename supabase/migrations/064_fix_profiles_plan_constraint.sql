-- Migration 064: Corrige a constraint de planos em profiles para alinhar com os valores
-- usados em toda a aplicacao (edge admin-acoes, AdminUsers, usePlanPermissions).
--
-- PROBLEMA: profiles_plan_check aceitava apenas ('starter','growth','agency') -- os nomes
-- antigos de um schema anterior. A edge admin-acoes e a UI enviam 'basico','pro','agencia',
-- 'enterprise','starter', causando erro 23514 (check constraint violation) em TODAS as
-- tentativas de alterar ou liberar plano pelo painel admin.
--
-- SOLUCAO: Substituir a constraint pelos valores reais do produto.

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IS NULL OR plan = ANY (ARRAY[
    'starter'::text,
    'basico'::text,
    'pro'::text,
    'agencia'::text,
    'enterprise'::text,
    'growth'::text,
    'agency'::text
  ]));

-- Normaliza registros com nomes antigos para os nomes canonicos do produto.
UPDATE public.profiles SET plan = 'pro'     WHERE plan = 'growth';
UPDATE public.profiles SET plan = 'agencia' WHERE plan = 'agency';

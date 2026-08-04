-- Migration 065: Adiciona policy restrictiva "Acesso liberado a ferramenta" na tabela
-- api_consumption_logs, que foi criada pela 063 sem ela, criando inconsistencia com as
-- demais tabelas protegidas.

DROP POLICY IF EXISTS "Acesso liberado a ferramenta" ON public.api_consumption_logs;
CREATE POLICY "Acesso liberado a ferramenta"
  ON public.api_consumption_logs
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (public.acesso_ferramenta_liberado())
  WITH CHECK (public.acesso_ferramenta_liberado());

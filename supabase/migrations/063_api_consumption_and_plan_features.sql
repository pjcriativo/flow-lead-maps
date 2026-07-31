-- Migration 063: Tabela de consumo de API por cliente e flags de recursos por plano

-- 1. Tabela de Logs de Consumo de API
CREATE TABLE IF NOT EXISTS public.api_consumption_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  service TEXT NOT NULL, -- 'apify_maps', 'openai_enrichment', 'whatsapp_evolution', 'google_places'
  action TEXT NOT NULL,  -- 'search_crawled', 'site_enrich', 'wa_message'
  quantity INT NOT NULL DEFAULT 1,
  cost_usd NUMERIC(10, 4) NOT NULL DEFAULT 0.0000,
  cost_brl NUMERIC(10, 4) NOT NULL DEFAULT 0.0000,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para buscas rápidas no painel admin e relatórios por org/período
CREATE INDEX IF NOT EXISTS idx_api_consumption_org_created ON public.api_consumption_logs(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_consumption_user_created ON public.api_consumption_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_consumption_service ON public.api_consumption_logs(service);

-- Habilitar RLS
ALTER TABLE public.api_consumption_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Super admin lê todos os logs de consumo de API" ON public.api_consumption_logs;
CREATE POLICY "Super admin lê todos os logs de consumo de API"
  ON public.api_consumption_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "Usuário lê consumo de API de sua organização" ON public.api_consumption_logs;
CREATE POLICY "Usuário lê consumo de API de sua organização"
  ON public.api_consumption_logs
  FOR SELECT
  TO authenticated
  USING (
    org_id IS NOT NULL AND public.pertence_a_org(org_id)
  );

DROP POLICY IF EXISTS "Usuários autenticados podem inserir logs de consumo" ON public.api_consumption_logs;
CREATE POLICY "Usuários autenticados podem inserir logs de consumo"
  ON public.api_consumption_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR org_id IS NOT NULL
  );

-- 2. Adicionar colunas de controle de recursos na tabela de planos (se ela existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'planos') THEN
    ALTER TABLE public.planos ADD COLUMN IF NOT EXISTS has_instagram_search BOOLEAN DEFAULT false;
    ALTER TABLE public.planos ADD COLUMN IF NOT EXISTS has_linkedin_search BOOLEAN DEFAULT false;
    ALTER TABLE public.planos ADD COLUMN IF NOT EXISTS has_propostas BOOLEAN DEFAULT false;
    ALTER TABLE public.planos ADD COLUMN IF NOT EXISTS has_contratos BOOLEAN DEFAULT false;
    ALTER TABLE public.planos ADD COLUMN IF NOT EXISTS has_financeiro BOOLEAN DEFAULT false;
    ALTER TABLE public.planos ADD COLUMN IF NOT EXISTS has_whatsapp BOOLEAN DEFAULT false;
    ALTER TABLE public.planos ADD COLUMN IF NOT EXISTS has_redesign BOOLEAN DEFAULT false;
    ALTER TABLE public.planos ADD COLUMN IF NOT EXISTS has_publicar BOOLEAN DEFAULT false;
  END IF;
END $$;

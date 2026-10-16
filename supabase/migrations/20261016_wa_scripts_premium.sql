-- Migration: wa_scripts_premium (Extensão de metadados para scripts WhatsApp)
-- Suporte nativo a categorias, status ativo/inativo, contador de usos e auditoria de atualização

ALTER TABLE IF EXISTS public.wa_scripts
  ADD COLUMN IF NOT EXISTS categoria text DEFAULT 'boas_vindas',
  ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS usos integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS atualizado_em timestamp with time zone DEFAULT now();

-- Índices para buscas rápidas e ordenação por uso e categoria
CREATE INDEX IF NOT EXISTS idx_wa_scripts_org_categoria ON public.wa_scripts(org_id, categoria);
CREATE INDEX IF NOT EXISTS idx_wa_scripts_org_usos ON public.wa_scripts(org_id, usos DESC);

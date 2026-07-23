-- ═══ Configurações v3 — paridade com a tela de referência (LeadzenAI) ═══
-- Campos novos de config_plataforma, cada um LIDO por um lugar real do produto:
--   moeda / simbolo_moeda   -> /pricing (preço dos planos) e tela Planos do admin
--   fuso_horario            -> exibição de datas do painel (formatData com timeZone)
--   cor_base / cor_secundaria -> variáveis CSS injetadas (landing + app): --primary/--gold
--   modelo_openai           -> _shared/ai/openai.ts (override de OPENAI_MODEL)
--   seo_titulo / seo_descricao -> landing pública (/): document.title + meta description
--   gdpr_texto              -> página /privacy (substitui o corpo padrão quando preenchido)
--   css_personalizado       -> <style> injetado nas páginas públicas (landing/pricing)
alter table config_plataforma
  add column if not exists moeda text,
  add column if not exists simbolo_moeda text,
  add column if not exists fuso_horario text,
  add column if not exists cor_base text,
  add column if not exists cor_secundaria text,
  add column if not exists modelo_openai text,
  add column if not exists seo_titulo text,
  add column if not exists seo_descricao text,
  add column if not exists gdpr_texto text,
  add column if not exists css_personalizado text;

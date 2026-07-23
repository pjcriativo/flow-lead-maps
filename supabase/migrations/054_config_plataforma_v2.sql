-- ═══ Configurações básicas / Logotipo / Painel de controle — novos campos reais ═══
-- Expande config_plataforma (singleton já existente desde a migration 050). Cada campo
-- abaixo é lido de verdade por um lugar específico do produto — nenhum é decorativo:
--   nome_plataforma        -> FlowLeadsLogo (texto da marca, quando não há logo_url)
--   logo_url / favicon_url -> FlowLeadsLogo / <link rel="icon"> do documento
--   max_leads_busca        -> search-leads (teto rígido no limite pedido)
--   fonte_leads_padrao     -> SearchSection (fonte pré-selecionada ao abrir Buscar)
--   modelo_ia              -> redesign-site (override de ANTHROPIC_MODEL)
--   cadastro_usuario_ativo -> /auth (esconde e bloqueia o modo "Cadastre-se")
--   termos_condicoes_ativo -> /auth (exige aceite antes de criar conta)
--   modo_manutencao_ativo  -> guard de _authenticated (bloqueia quem não é super_admin)
alter table config_plataforma
  add column if not exists nome_plataforma text,
  add column if not exists logo_url text,
  add column if not exists favicon_url text,
  add column if not exists max_leads_busca integer,
  add column if not exists fonte_leads_padrao text,
  add column if not exists modelo_ia text,
  add column if not exists cadastro_usuario_ativo boolean not null default true,
  add column if not exists termos_condicoes_ativo boolean not null default false,
  add column if not exists modo_manutencao_ativo boolean not null default false;

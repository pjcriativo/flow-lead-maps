-- ═══ ETAPA 5 — Conteúdo da landing pública (CMS) ═══
-- A landing (/) e /pricing são hoje 100% JSX hardcoded, sem tabela nenhuma por trás. Este
-- singleton guarda só os campos que REALMENTE aparecem nessas páginas (hero, seção de
-- benefícios, CTA final, os planos exibidos em /pricing, o texto do rodapé). Igual a
-- config_plataforma: null = usa o padrão hardcoded no componente ("cai no padrão").
--
-- Diferença de config_plataforma: aqui a LEITURA é PÚBLICA de propósito — a landing é servida
-- sem login (visitante anônimo), então a policy de select libera geral. Nada sensível mora
-- aqui, é só o texto que já era público no código-fonte. Escrita continua só via service role
-- (admin-acoes: cms_ler/cms_salvar).
create table if not exists site_conteudo (
  id boolean primary key default true check (id = true),
  hero_badge text,
  hero_titulo text,
  hero_titulo_destaque text,
  hero_subtitulo text,
  hero_cta_primario text,
  hero_cta_secundario text,
  hero_disclaimer text,
  features_titulo text,
  features_subtitulo text,
  cta_final_titulo text,
  cta_final_subtitulo text,
  cta_final_botao text,
  planos_json jsonb,
  footer_texto text,
  atualizado_em timestamptz not null default now()
);
insert into site_conteudo (id) values (true) on conflict (id) do nothing;

alter table site_conteudo enable row level security;
drop policy if exists site_conteudo_sel on site_conteudo;
create policy site_conteudo_sel on site_conteudo for select using (true);
-- sem insert/update/delete pra client: só o edge admin-acoes (service role) grava.

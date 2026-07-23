-- ═══ CONFIGURAÇÕES — o que hoje é hardcoded/env e faz sentido ser ajustável ═══
-- Singleton (1 linha só, id fixo). Cada campo aqui SUBSTITUI uma constante que já existe no
-- código (src/lib/redes-teto.ts, publicacao.core.ts, send-proposal, configPadraoWa) — os edges
-- leem a config e caem no valor padrão (const pura) se a linha não existir ou o campo for null.
-- Nada de config decorativa: cada campo abaixo controla algo real, listado no comentário.

create table if not exists config_plataforma (
  id boolean primary key default true,
  -- teto de gasto da coleta/geração via Apify+IA (buscar-redes, redesign-site) — default
  -- em src/lib/redes-teto.ts (US$5/US$50)
  teto_rodada_usd numeric(10, 2),
  teto_mes_usd numeric(10, 2),
  -- validade do site publicado, em dias (publicacao.core.ts DIAS_VALIDADE=15)
  dias_validade_site integer,
  -- remetente padrão do e-mail de proposta quando a org não tem o próprio (send-proposal
  -- DEFAULT_FROM/EMAIL_FROM)
  remetente_nome_padrao text,
  remetente_email_padrao text,
  -- intervalo padrão (segundos) usado ao CRIAR uma campanha nova de WhatsApp
  -- (src/lib/wa-copy.ts configPadraoWa)
  intervalo_disparo_min_seg integer,
  intervalo_disparo_max_seg integer,
  atualizado_em timestamptz not null default now(),
  constraint config_plataforma_singleton check (id = true)
);
comment on table config_plataforma is 'Configuração global da plataforma (1 linha). Cada campo substitui uma constante hardcoded — null = usa o padrão do código.';

insert into config_plataforma (id) values (true) on conflict (id) do nothing;

alter table config_plataforma enable row level security;
drop policy if exists config_plataforma_sel on config_plataforma;
-- leitura: qualquer usuário logado (edges leem com o client do próprio usuário; mesmo padrão
-- de 'planos', que também é catálogo lido por todos). Escrita só pelo Edge admin-acoes (service role).
create policy config_plataforma_sel on config_plataforma for select using (auth.uid() is not null);

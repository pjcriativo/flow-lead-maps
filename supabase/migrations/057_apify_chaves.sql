-- ═══ POOL DE CHAVES APIFY — rodízio automático por esgotamento de crédito ═══
-- Mesma família do rodízio de chips do WhatsApp: N chaves ordenadas, a ativa de menor
-- ordem trabalha; esgotou → sai do rodízio e a próxima assume NO MEIO da operação.
-- Valor CIFRADO com o mesmo cofre AES-256-GCM (CHAVES_MASTER_KEY) — o texto puro nunca
-- toca o banco nem volta pro navegador (só ultimos4 pra exibição).
--
-- RLS: SEM NENHUMA policy (nem select) — só service role (admin-acoes/edges) toca.
-- Chave esgotada NÃO volta sozinha: o super admin reativa na tela quando quiser.
create table if not exists apify_chaves (
  id uuid primary key default gen_random_uuid(),
  apelido text not null unique,
  valor_cifrado text not null,
  ultimos4 text not null,
  ordem integer not null default 0,
  status text not null default 'ativa'
    check (status in ('ativa', 'esgotada', 'invalida', 'desativada')),
  esgotada_em timestamptz,
  ultimo_uso timestamptz,
  -- crédito restante estimado (USD), atualizado pelo "Testar chave" (GET /users/me/limits)
  credito_estimado numeric(10, 4),
  criado_por uuid references auth.users(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
alter table apify_chaves enable row level security;
create index if not exists idx_apify_chaves_rodizio on apify_chaves (status, ordem);

-- Auditoria: quem adicionou/removeu/alterou qual chave e quando (inclui trocas de status
-- automáticas do rodízio — acao 'esgotou_automatico'/'invalida_automatico').
create table if not exists apify_chaves_auditoria (
  id uuid primary key default gen_random_uuid(),
  apelido text not null,
  acao text not null,
  alterado_por uuid references auth.users(id),
  alterado_em timestamptz not null default now()
);
alter table apify_chaves_auditoria enable row level security;
create index if not exists idx_apify_chaves_auditoria_data on apify_chaves_auditoria (alterado_em desc);

-- Livro-caixa: cada busca registra QUAL chave gastou (fecha parte da dívida do "gasto
-- cego" — docs/DIVIDAS.md item 1). Nullable: buscas antigas e fontes grátis ficam null.
alter table redes_buscas add column if not exists chave_apelido text;

-- FASE 0 / Frente 2 — o livro-caixa passa a registrar TAMBÉM a geração de sites por IA
-- (Claude no redesign-site), não só a coleta de redes. Um lugar só para TODO gasto de API,
-- e o teto mensal de US$ 50 vira GLOBAL do livro-caixa: coleta + sites disputam o mesmo
-- orçamento (conservador de propósito — estourar teto separado por categoria é furo).
--
-- fonte 'ia_site': uma linha por geração de site (custo REAL: tokens da IA + Apify de
-- reviews, o mesmo custo_usd que já é gravado em redesigns). estrategia = 'SITE'
-- (redesign do site atual) ou 'SITE-NOVO' (do zero, ignorar_site).

alter table redes_buscas
  drop constraint if exists redes_buscas_fonte_check;
alter table redes_buscas
  add constraint redes_buscas_fonte_check
  check (fonte in ('instagram', 'linkedin', 'ia_site'));

comment on table redes_buscas is
  'Livro-caixa de gasto de API por rodada: coleta em redes (instagram/linkedin via Apify) e geração de sites por IA (ia_site — Claude/OpenAI + Apify de reviews). A soma de custo_usd do mês é o gasto que o teto mensal (US$ 50, global) controla.';
comment on column redes_buscas.fonte is
  'De onde veio o gasto: instagram | linkedin (coleta Apify) | ia_site (geração de site no redesign-site).';

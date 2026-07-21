-- Livro-caixa das buscas em redes sociais (Instagram/LinkedIn via Apify).
-- É o que sustenta o TETO DE GASTO: o gasto do mês é a SOMA de custo_usd das rodadas do mês.
-- Sem esta tabela não existe teto — e a regra do projeto é não ligar coleta paga sem teto.

create table if not exists redes_buscas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fonte text not null check (fonte in ('instagram', 'linkedin')),
  estrategia text not null,
  -- o pedido exatamente como foi montado na tela (rastreabilidade do que se pediu)
  pedido jsonb not null default '{}'::jsonb,
  limite integer not null default 50,
  -- custo REAL cobrado pela Apify neste run (lido do run, não estimado)
  custo_usd numeric(10, 4) not null default 0,
  encontrados integer not null default 0,
  inseridos integer not null default 0,
  status text not null default 'rodando'
    check (status in ('rodando', 'concluida', 'parada_teto', 'erro')),
  detalhe text,
  mes_ref text not null,
  criado_em timestamptz not null default now(),
  concluida_em timestamptz
);

alter table redes_buscas enable row level security;

-- o dono lê o próprio histórico; escrita é só pelo service_role (o edge)
drop policy if exists "own redes_buscas" on redes_buscas;
create policy "own redes_buscas" on redes_buscas
  for select using (auth.uid() = user_id);

-- o teto mensal é sempre consultado por (dono, mês)
create index if not exists idx_redes_buscas_mes on redes_buscas (user_id, mes_ref);

comment on table redes_buscas is 'Uma linha por rodada de coleta em rede social. A soma de custo_usd do mês é o gasto que o teto controla.';
comment on column redes_buscas.custo_usd is 'Custo REAL do run na Apify (usageTotalUsd), não estimativa.';

-- Fase 2 — CAMPANHAS: agrupa a abordagem de uma LISTA num lote revisável. Uma
-- campanha nasce de uma lead_list e reúne as propostas (rascunho) geradas para os
-- leads elegíveis dela. A "revisão em lote" aprova/edita/envia essas propostas
-- reusando o PORTÃO DE REVISÃO (nada sai sem aprovação) e a RAMPA POR ORG.
-- "org" = user_id (cada usuário é uma agência; sem tabela organizations).
create table if not exists public.campanhas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  -- de qual lista a campanha nasceu (set null se a lista for excluída — a campanha
  -- e suas propostas permanecem).
  list_id uuid references public.lead_lists on delete set null,
  nome text not null,
  status text not null default 'ativa' check (status in ('ativa', 'concluida')),
  criada_em timestamptz not null default now()
);

alter table public.campanhas enable row level security;
drop policy if exists "Users CRUD own campanhas" on public.campanhas;
create policy "Users CRUD own campanhas"
  on public.campanhas for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_campanhas_user on public.campanhas(user_id);

-- Liga a proposta à campanha (nulo = proposta avulsa, fora de campanha). set null
-- ao excluir a campanha: a proposta continua existindo, só desvinculada.
alter table public.propostas
  add column if not exists campanha_id uuid references public.campanhas on delete set null;
create index if not exists idx_propostas_campanha on public.propostas(campanha_id);

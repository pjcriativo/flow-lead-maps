-- Fase 2 — Propostas comerciais enviadas aos leads.
-- Usa o site JÁ publicado (Fase 4) como prévia/link único — NÃO gera site novo.
-- Copy montada por template local com dados REAIS do lead (elogio das avaliações
-- + motivo do site ruim vindo do score_breakdown da Fase 1 + link da página
-- publicada). SEM preço na 1ª abordagem. "Melhorar com IA" é opcional (edge).
-- Ciclo: rascunho → enviada → respondida.
create table if not exists public.propostas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  lead_id uuid references public.leads on delete cascade not null,
  -- site publicado usado como prévia (link da proposta). set null se o site
  -- expirar/for removido — a proposta permanece.
  site_id uuid references public.sites_publicados on delete set null,
  assunto text not null,
  corpo text not null,
  valor numeric, -- R$; null na 1ª abordagem (sem preço)
  status text not null default 'rascunho'
    check (status in ('rascunho', 'enviada', 'respondida')),
  criada_em timestamptz not null default now(),
  enviada_em timestamptz,
  respondida_em timestamptz
);

alter table public.propostas enable row level security;

-- RLS por dono (mesmo padrão de redesigns/leads/sites_publicados).
drop policy if exists "Users CRUD own propostas" on public.propostas;
create policy "Users CRUD own propostas"
  on public.propostas for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_propostas_user on public.propostas(user_id);
create index if not exists idx_propostas_lead on public.propostas(lead_id);
create index if not exists idx_propostas_status on public.propostas(status);

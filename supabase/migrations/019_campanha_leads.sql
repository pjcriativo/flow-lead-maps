-- Fase 2 (portão do site) — CAMPANHA_LEADS: membros da campanha com pipeline próprio.
-- Correção do buraco do c8f46ba: antes a campanha só aceitava lead que JÁ tinha site
-- publicado (invertido). Agora TODOS os leads da lista entram como 'pendente' (custo
-- ZERO na criação); o usuário SELECIONA quem preparar → só esses geram site+proposta.
-- Estados:
--   pendente   → nada gerado (custo zero)
--   gerando    → geração em andamento (transitório)
--   rascunho   → redesign pronto (reusado ou gerado) + proposta rascunho, EM REVISÃO,
--                SEM site publicado (preview via iframe do HTML, sem URL pública)
--   aprovado   → aprovado → site publicado (URL existe) + link injetado na proposta
--   descartado → descartado pelo usuário (com motivo)
--   erro       → geração falhou (lead inviável / dado insuficiente) — reportado, não fingido
create table if not exists public.campanha_leads (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid references public.campanhas on delete cascade not null,
  lead_id uuid references public.leads on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  estado text not null default 'pendente'
    check (estado in ('pendente', 'gerando', 'rascunho', 'aprovado', 'descartado', 'erro')),
  -- redesign usado (reusado do lead ou gerado); set null se o redesign for excluído.
  redesign_id uuid references public.redesigns on delete set null,
  -- proposta rascunho gerada; set null se a proposta for excluída.
  proposta_id uuid references public.propostas on delete set null,
  motivo_descarte text,
  erro text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (campanha_id, lead_id) -- um lead entra uma vez por campanha
);

alter table public.campanha_leads enable row level security;
drop policy if exists "Users CRUD own campanha_leads" on public.campanha_leads;
create policy "Users CRUD own campanha_leads"
  on public.campanha_leads for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_campanha_leads_campanha on public.campanha_leads(campanha_id);
create index if not exists idx_campanha_leads_estado on public.campanha_leads(campanha_id, estado);

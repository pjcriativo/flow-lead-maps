-- Fase 3 — Redesign com IA. Guarda o site gerado (e a versão editada) por lead.
create table if not exists public.redesigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  lead_id uuid references public.leads on delete cascade not null,
  site_original_url text,
  html_gerado text,
  html_editado text,
  status text not null default 'pendente'
    check (status in ('pendente', 'gerando', 'pronto', 'erro')),
  modelo text,
  custo_usd numeric,
  observacoes text,
  criado_em timestamptz not null default now(),
  gerado_em timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.redesigns enable row level security;

drop policy if exists "Users CRUD own redesigns" on public.redesigns;
create policy "Users CRUD own redesigns"
  on public.redesigns for all using (auth.uid() = user_id);

create index if not exists idx_redesigns_user on public.redesigns(user_id);
create index if not exists idx_redesigns_lead on public.redesigns(lead_id);

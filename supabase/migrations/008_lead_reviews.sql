-- Redesign v3 — DEPOIMENTOS REAIS do Google (puxados via Apify no redesign).
-- Vinculados ao lead; substituídos a cada nova coleta (não acumula duplicado).
create table if not exists public.lead_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  lead_id uuid references public.leads on delete cascade not null,
  author_name text,
  author_photo text,
  rating numeric,
  text text,
  when_label text,
  review_url text,
  source text not null default 'google',
  fetched_at timestamptz not null default now()
);

alter table public.lead_reviews enable row level security;

drop policy if exists "Users CRUD own lead_reviews" on public.lead_reviews;
create policy "Users CRUD own lead_reviews"
  on public.lead_reviews for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_lead_reviews_lead on public.lead_reviews(lead_id);
create index if not exists idx_lead_reviews_user on public.lead_reviews(user_id);

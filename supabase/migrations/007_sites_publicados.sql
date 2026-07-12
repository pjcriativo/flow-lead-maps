-- Fase 4 — Publicação de sites TEMPORÁRIOS.
-- Guarda o registro de cada site publicado (o arquivo HTML fica no Storage,
-- bucket "sites-publicados"). Ciclo: publicado → aprovado/reprovado/expirado.
-- Expira em 15 dias. Ao despublicar/expirar, os arquivos do Storage são
-- apagados, mas o REGISTRO permanece (arquivos_removidos = true) para histórico.
create table if not exists public.sites_publicados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  lead_id uuid references public.leads on delete cascade not null,
  redesign_id uuid references public.redesigns on delete cascade not null,
  -- slug único no NAMESPACE de URLs (/site/<slug>), não só por usuário.
  slug text not null unique,
  url_publica text not null,
  status text not null default 'publicado'
    check (status in ('publicado', 'aprovado', 'reprovado', 'expirado')),
  publicado_em timestamptz not null default now(),
  expira_em timestamptz not null default (now() + interval '15 days'),
  arquivos_removidos boolean not null default false
);

alter table public.sites_publicados enable row level security;

-- RLS por dono (mesmo padrão de redesigns/leads). A rota pública /site/<slug>
-- NÃO usa este client: ela lê via service role (server-side), sem sessão.
drop policy if exists "Users CRUD own sites" on public.sites_publicados;
create policy "Users CRUD own sites"
  on public.sites_publicados for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_sites_user on public.sites_publicados(user_id);
create index if not exists idx_sites_lead on public.sites_publicados(lead_id);
create index if not exists idx_sites_expira on public.sites_publicados(expira_em);

-- Bucket PRIVADO do Storage: só o service role (server) sobe/lê/apaga.
-- A rota pública serve o HTML baixando via service role e checando expiração.
insert into storage.buckets (id, name, public)
values ('sites-publicados', 'sites-publicados', false)
on conflict (id) do nothing;

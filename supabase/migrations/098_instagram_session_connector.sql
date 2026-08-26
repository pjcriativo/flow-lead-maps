-- Conector próprio de sessão do Instagram (piloto controlado).
-- A senha nunca é persistida; somente o estado de sessão cifrado pelo worker.

alter table public.ig_instancias drop constraint if exists ig_instancias_provider_check;
alter table public.ig_instancias add constraint ig_instancias_provider_check
  check (provider in ('meta_official', 'unipile', 'session_worker', 'evolution_legacy'));

create table if not exists public.instagram_connector_sessions (
  instance_id uuid primary key references public.ig_instancias(id) on delete cascade,
  encrypted_settings text not null,
  settings_version integer not null default 1,
  last_verified_at timestamptz not null default now(),
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.instagram_connector_sessions enable row level security;
revoke all on public.instagram_connector_sessions from anon, authenticated;

comment on table public.instagram_connector_sessions is
  'Estado de sessão cifrado do conector Instagram. Acesso exclusivo por service_role.';


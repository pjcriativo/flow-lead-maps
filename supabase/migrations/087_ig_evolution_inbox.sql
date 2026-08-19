-- Fase 7: Instagram Direct via Evolution API

create table if not exists public.ig_instancias (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  nome text not null,
  username_ig text,
  status text not null default 'desconectado'
    check (status in ('desconectado', 'aguardando', 'conectado', 'erro')),
  criada_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique(org_id, nome)
);

create index if not exists ig_instancias_org_idx on public.ig_instancias(org_id);

alter table public.ig_instancias enable row level security;
drop policy if exists ig_instancias_all on public.ig_instancias;
create policy ig_instancias_all on public.ig_instancias for all
  using (public.eh_super_admin() or public.pertence_a_org(org_id))
  with check (public.eh_super_admin() or public.pertence_a_org(org_id));

create table if not exists public.ig_instancia_tokens (
  instancia_id uuid primary key references public.ig_instancias(id) on delete cascade,
  token text not null,
  atualizado_em timestamptz not null default now()
);

-- ATENCAO: ig_instancia_tokens RLS é "Default Deny" por segurança (sem policies)
alter table public.ig_instancia_tokens enable row level security;


create table if not exists public.ig_conversas (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  instancia_id uuid not null references public.ig_instancias(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  external_contact_id text not null, -- ID remoto da conversa (ex: IGSID)
  external_contact_name text,
  external_contact_avatar text,
  status text not null default 'open' check (status in ('open', 'closed', 'archived')),
  last_message_text text,
  last_message_at timestamptz not null default now(),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (instancia_id, external_contact_id)
);

create index if not exists ig_conversas_org_idx on public.ig_conversas(org_id, last_message_at desc);

alter table public.ig_conversas enable row level security;
drop policy if exists ig_conversas_all on public.ig_conversas;
create policy ig_conversas_all on public.ig_conversas for all
  using (public.eh_super_admin() or public.pertence_a_org(org_id))
  with check (public.eh_super_admin() or public.pertence_a_org(org_id));


create table if not exists public.ig_mensagens (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  conversa_id uuid not null references public.ig_conversas(id) on delete cascade,
  external_message_id text unique,
  direction text not null check (direction in ('inbound', 'outbound')),
  message_type text not null default 'text',
  text text,
  media_url text,
  is_read boolean not null default false,
  timestamp timestamptz not null default now(),
  criado_em timestamptz not null default now()
);

create index if not exists ig_mensagens_conv_idx on public.ig_mensagens(conversa_id, timestamp asc);

alter table public.ig_mensagens enable row level security;
drop policy if exists ig_mensagens_all on public.ig_mensagens;
create policy ig_mensagens_all on public.ig_mensagens for all
  using (public.eh_super_admin() or public.pertence_a_org(org_id))
  with check (public.eh_super_admin() or public.pertence_a_org(org_id));


create table if not exists public.ig_automacoes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  instancia_id uuid not null references public.ig_instancias(id) on delete cascade,
  name text not null,
  trigger_type text not null default 'keyword' check (trigger_type in ('keyword', 'first_message')),
  keywords text[],
  reply_text text not null,
  is_active boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists ig_automacoes_org_idx on public.ig_automacoes(org_id, is_active);

alter table public.ig_automacoes enable row level security;
drop policy if exists ig_automacoes_all on public.ig_automacoes;
create policy ig_automacoes_all on public.ig_automacoes for all
  using (public.eh_super_admin() or public.pertence_a_org(org_id))
  with check (public.eh_super_admin() or public.pertence_a_org(org_id));

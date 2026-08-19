-- Fase 7: Instagram Inbox (Mensageria e Automacoes)

create table if not exists public.instagram_accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  instagram_id text not null, -- IG User ID
  username text not null,
  facebook_page_id text not null,
  access_token text not null,
  status text not null default 'active' check (status in ('active', 'error', 'disconnected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, instagram_id)
);

create index if not exists instagram_accounts_org_idx on public.instagram_accounts(org_id);
create index if not exists instagram_accounts_ig_idx on public.instagram_accounts(instagram_id);

alter table public.instagram_accounts enable row level security;
drop policy if exists instagram_accounts_all on public.instagram_accounts;
create policy instagram_accounts_all on public.instagram_accounts for all
  using (public.eh_super_admin() or public.pertence_a_org(org_id))
  with check (public.eh_super_admin() or public.pertence_a_org(org_id));

create table if not exists public.instagram_conversations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  account_id uuid not null references public.instagram_accounts(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  external_contact_id text not null, -- ID do usuario no Instagram (Lead)
  external_contact_username text,
  external_contact_name text,
  external_contact_avatar text,
  status text not null default 'open' check (status in ('open', 'closed', 'archived')),
  last_message_text text,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, external_contact_id)
);

create index if not exists instagram_conversations_org_idx on public.instagram_conversations(org_id, last_message_at desc);

alter table public.instagram_conversations enable row level security;
drop policy if exists instagram_conversations_all on public.instagram_conversations;
create policy instagram_conversations_all on public.instagram_conversations for all
  using (public.eh_super_admin() or public.pertence_a_org(org_id))
  with check (public.eh_super_admin() or public.pertence_a_org(org_id));

create table if not exists public.instagram_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.instagram_conversations(id) on delete cascade,
  org_id uuid not null references public.orgs(id) on delete cascade,
  external_message_id text unique, -- ID da mensagem na Meta
  direction text not null check (direction in ('inbound', 'outbound')),
  message_type text not null default 'text' check (message_type in ('text', 'image', 'video', 'audio', 'file', 'postback', 'story_reply')),
  text text,
  media_url text,
  is_read boolean not null default false,
  timestamp timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists instagram_messages_conv_idx on public.instagram_messages(conversation_id, timestamp asc);
create index if not exists instagram_messages_org_unread_idx on public.instagram_messages(org_id, is_read) where direction = 'inbound' and is_read = false;

alter table public.instagram_messages enable row level security;
drop policy if exists instagram_messages_all on public.instagram_messages;
create policy instagram_messages_all on public.instagram_messages for all
  using (public.eh_super_admin() or public.pertence_a_org(org_id))
  with check (public.eh_super_admin() or public.pertence_a_org(org_id));

create table if not exists public.instagram_automations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.instagram_accounts(id) on delete cascade,
  name text not null,
  trigger_type text not null default 'keyword' check (trigger_type in ('keyword', 'story_reply', 'first_message')),
  keywords text[], -- Ex: ['preco', 'valor', 'orcamento']
  reply_text text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists instagram_automations_org_idx on public.instagram_automations(org_id, is_active);

alter table public.instagram_automations enable row level security;
drop policy if exists instagram_automations_all on public.instagram_automations;
create policy instagram_automations_all on public.instagram_automations for all
  using (public.eh_super_admin() or public.pertence_a_org(org_id))
  with check (public.eh_super_admin() or public.pertence_a_org(org_id));

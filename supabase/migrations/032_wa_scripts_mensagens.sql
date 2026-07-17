-- Redesign estilo S-zap/Kaptar — tabelas novas das abas Scripts e Conversas.
-- (a) wa_scripts: mensagens/mídias salvas para reuso rápido (texto/imagem/vídeo/arquivo).
-- (b) wa_mensagens: histórico de bate-papo (in/out) por número — base da aba Conversas
--     (autoatendimento). O webhook de recebimento (service_role) insere as entradas; a resposta
--     sai por edge que também grava a saída. O cliente só LÊ/atualiza (RLS por dono).

create table if not exists public.wa_scripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null,
  tipo text not null default 'texto' check (tipo in ('texto', 'imagem', 'video', 'arquivo')),
  mensagem text,
  media_url text,
  criado_em timestamptz not null default now()
);
create index if not exists wa_scripts_user_idx on public.wa_scripts (user_id, criado_em desc);
alter table public.wa_scripts enable row level security;
drop policy if exists "own wa_scripts" on public.wa_scripts;
create policy "own wa_scripts" on public.wa_scripts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.wa_mensagens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  instancia_id uuid references public.wa_instancias(id) on delete set null,
  numero text not null,                       -- contato (DDI+DDD+numero, só dígitos)
  lead_id uuid references public.leads(id) on delete set null,
  nome_contato text,                          -- pushName do WhatsApp (quando vier)
  direcao text not null check (direcao in ('in', 'out')),
  tipo text not null default 'texto',
  texto text,
  media_url text,
  externo_id text,                            -- id da mensagem na Evolution (dedup)
  lida boolean not null default false,
  criado_em timestamptz not null default now()
);
create index if not exists wa_mensagens_conversa_idx
  on public.wa_mensagens (user_id, numero, criado_em);
create unique index if not exists wa_mensagens_externo_uq
  on public.wa_mensagens (user_id, externo_id) where externo_id is not null;
alter table public.wa_mensagens enable row level security;
-- Dono LÊ e atualiza (marcar lida) as próprias; INSERT é só do servidor (webhook/edge).
drop policy if exists "own wa_mensagens read" on public.wa_mensagens;
create policy "own wa_mensagens read" on public.wa_mensagens for select using (auth.uid() = user_id);
drop policy if exists "own wa_mensagens update" on public.wa_mensagens;
create policy "own wa_mensagens update" on public.wa_mensagens for update using (auth.uid() = user_id);
